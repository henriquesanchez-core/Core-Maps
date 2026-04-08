import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchInstagramProfile, fetchInstagramProfiles } from '@/lib/apify';
import {
  callClaude,
  EXTRACT_PROFILE_PROMPT,
  NARRATIVE_PROMPT,
  HEADLINE_EXAMPLES_PROMPT,
  PLAYBOOK_PROMPT,
} from '@/lib/claude';
import { requireAdmin } from '@/lib/auth';
import { GenerateRequestSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type ScriptElement = {
  element_type: string;
  structure: string;
  modeled_example: string;
};

type ScriptRewriteAnalyzed = {
  elements: ScriptElement[];
};

type ScriptRewriteValue = ScriptRewriteAnalyzed | string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeScriptElement(value: unknown): ScriptElement | null {
  if (!isRecord(value)) return null;
  return {
    element_type: typeof value.element_type === 'string' ? value.element_type : '',
    structure: typeof value.structure === 'string' ? value.structure : '',
    modeled_example: typeof value.modeled_example === 'string' ? value.modeled_example : '',
  };
}

function normalizeScriptRewrite(value: unknown): ScriptRewriteValue | null {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return null;

  // New format: { elements: [...] }
  if ('elements' in value && Array.isArray(value.elements)) {
    const elements = value.elements
      .map(normalizeScriptElement)
      .filter((e): e is ScriptElement => e !== null);
    return { elements };
  }

  // Legacy format: { headline, intensifier, first_list_topic } → convert to new format
  if ('headline' in value || 'intensifier' in value || 'first_list_topic' in value) {
    const elements: ScriptElement[] = [];
    const legacyKeys = [
      { key: 'headline', label: 'Headline' },
      { key: 'intensifier', label: 'Intensificador' },
      { key: 'first_list_topic', label: 'Valor Prático - Lista Numerada' },
    ];
    for (const { key, label } of legacyKeys) {
      const block = value[key];
      if (isRecord(block)) {
        elements.push({
          element_type: label,
          structure: typeof block.structure === 'string' ? block.structure : '',
          modeled_example: typeof block.modeled_example === 'string' ? block.modeled_example : '',
        });
      }
    }
    return { elements };
  }

  return null;
}

function normalizeScriptRewrites(value: unknown): ScriptRewriteValue[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeScriptRewrite)
    .filter((item): item is ScriptRewriteValue => item !== null);
}

function formatScriptRewriteForPlaybook(script: ScriptRewriteValue, index: number): string {
  if (typeof script === 'string') {
    return `--- Roteiro ${index + 1} ---\n${script}`;
  }

  const lines = [`--- Roteiro ${index + 1} ---`];
  for (const el of script.elements) {
    lines.push(``, `${el.element_type || 'Elemento'}`);
    lines.push(`- Estrutura: ${el.structure || 'N/A'}`);
    lines.push(`- Exemplo modelado: ${el.modeled_example || 'N/A'}`);
  }
  return lines.join('\n');
}

function formatNucleo(profile: any) {
  const lines = [
    `- Nome: ${profile.nome || 'N/A'}`,
    `- Profissão/Especialidade: ${profile.especialidade || 'N/A'}`,
    profile.termo_proprio ? `- Termo/Título: ${profile.termo_proprio}` : null,
    `- Público-Alvo: ${profile.publico_alvo || 'N/A'}`,
    profile.nome_audiencia ? `- Nome da Audiência: ${profile.nome_audiencia}` : null,
    `- Dor Principal: ${profile.dor_principal || profile.dor || 'N/A'}`,
    `- Inimigo/Causador da Dor: ${profile.inimigo || 'N/A'}`,
    profile.nome_inimigo ? `- Nome do Inimigo: ${profile.nome_inimigo}` : null,
    profile.solucoes_alternativas?.length > 0 ? `- O que o público já tentou (e não funcionou): ${profile.solucoes_alternativas.join('; ')}` : null,
    profile.mentira_crenca_errada ? `- Mentira/Crença Errada do público: ${profile.mentira_crenca_errada}` : null,
    profile.problema_filosofico ? `- Problema Filosófico (indignação): ${profile.problema_filosofico}` : null,
    profile.solucao ? `- Solução: ${profile.solucao}` : null,
    profile.beneficios?.length > 0 ? `- Benefícios tangíveis: ${profile.beneficios.join('; ')}` : null,
    `- Desejo/Transformação: ${profile.desejo || 'N/A'}`,
    profile.nome_metodo ? `- Nome do Método: ${profile.nome_metodo}` : null,
    profile.crencas_centrais?.length > 0 ? `- Crenças Centrais: ${profile.crencas_centrais.join(' | ')}` : null,
    `- Nova Crença principal: ${profile.nova_crenca || 'N/A'}`,
    profile.historia_emocional ? `- História emocional: ${profile.historia_emocional}` : null,
    profile.provas_cases ? `- Provas/Cases: ${profile.provas_cases}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

function normalizeStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to validate authentication.' }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido no body' }, { status: 400 });
  }

  const parsedRequest = GenerateRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsedRequest.error.flatten() },
      { status: 400 }
    );
  }

  const validatedRequest = parsedRequest.data;
  const clientUsername = typeof body.clientUsername === 'string' ? body.clientUsername.trim() : '';
  const referenceProfiles = typeof body.referenceProfiles === 'string' ? body.referenceProfiles.slice(0, 5000) : '';
  const transcription = typeof body.transcription === 'string' ? body.transcription.slice(0, 30000) : '';
  const videoExamples = normalizeStringArray(body.videoExamples, 20, 300);
  const headlineExamples = normalizeStringArray(body.headlineExamples, 20, 200);
  const scriptExamples = normalizeStringArray(body.scriptExamples, 20, 1200);
  const viralTerms = validatedRequest.tags;

  if (!clientUsername) {
    return NextResponse.json({ error: 'Username do cliente é obrigatório' }, { status: 400 });
  }

  const cleanUsername = clientUsername.replace('@', '').toLowerCase();

  // Master abort controller: cancelled when the client disconnects
  const master = new AbortController();
  req.signal.addEventListener('abort', () => master.abort('client_disconnected'), { once: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      function sendEvent(data: any) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      }
      function sendProgress(step: number, message: string) {
        sendEvent({ type: 'progress', step, message });
      }
      function close() {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch {}
      }

      try {
        // STEP 1: Client Instagram Profile
        sendProgress(1, 'Buscando perfil do Instagram...');
        let clientData = {};
        try {
          clientData = await fetchInstagramProfile(cleanUsername, master.signal);
          console.log('[Generate] clientData:', JSON.stringify(clientData));
        } catch (err: any) {
          if (master.signal.aborted) throw err;
          console.error('[Generate] Erro ao buscar Instagram:', err?.message);
          sendProgress(1, `Aviso: erro Instagram - ${err.message}`);
        }

        // STEP 2: Reference Profiles
        sendProgress(2, 'Buscando perfis de referência...');
        let referencesData: any[] = [];
        if (referenceProfiles && referenceProfiles.trim()) {
          try {
            const usernames = referenceProfiles.split('\n').map((u: string) => u.trim()).filter(Boolean);
            referencesData = await fetchInstagramProfiles(usernames, master.signal);
          } catch (err: any) {
            if (master.signal.aborted) throw err;
            console.error('[Generate] Erro ao buscar referências:', err);
            sendProgress(2, `Aviso: não foi possível buscar referências (${err.message})`);
          }
        }

        // STEP 3: Extract Profile from Transcription
        let extractedProfile = null;
        if (transcription && transcription.trim()) {
          sendProgress(3, 'Extraindo perfil estratégico com IA...');
          const prompt = EXTRACT_PROFILE_PROMPT.replace('{{TRANSCRIPTION}}', transcription);
          const result = await callClaude(prompt, master.signal);
          const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          try {
            extractedProfile = JSON.parse(cleaned);
          } catch {
            console.error('[Generate] Nao foi possivel o parse do perfil:', cleaned.slice(0, 300));
          }
        } else {
          sendProgress(3, 'Ignorando transcrição (vazia)...');
        }

        // STEP 4: Narrative
        let narrative = '';
        if (extractedProfile) {
          sendProgress(4, 'Gerando Narrativa Magnética...');
          const nucleoInfo = formatNucleo(extractedProfile);
          const prompt = NARRATIVE_PROMPT.replace('{{NUCLEO_INFLUENCIA}}', nucleoInfo);
          narrative = await callClaude(prompt, master.signal);
        } else {
          sendProgress(4, 'Sem perfil extraído. Pulando narrativa.');
        }

        // STEP 5: Generate headline/viral/script examples
        const viralTermsArray = viralTerms;
        const headlineExamplesArray = headlineExamples;
        const scriptExamplesArray = scriptExamples;

        let actionPlan = null;
        const hasInputs = extractedProfile && (headlineExamplesArray.length > 0 || viralTermsArray.length > 0 || scriptExamplesArray.length > 0);

        if (hasInputs) {
          sendProgress(5, 'Gerando exemplos personalizados com IA...');
          const nucleoInfo = formatNucleo(extractedProfile);
          const structuresList = headlineExamplesArray.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n');
          const termsList = viralTermsArray.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');
          const scriptsList = scriptExamplesArray.map((s: string, i: number) => `--- Roteiro ${i + 1} ---\n${s}`).join('\n\n');

          const prompt = HEADLINE_EXAMPLES_PROMPT
            .replace('{{NUCLEO_INFLUENCIA}}', nucleoInfo)
            .replace('{{HEADLINE_STRUCTURES}}', structuresList || 'Nenhuma estrutura fornecida')
            .replace('{{VIRAL_TERMS}}', termsList || 'Nenhum termo viral fornecido')
            .replace('{{SCRIPT_STRUCTURES}}', scriptsList || 'Nenhum roteiro fornecido');

          const result = await callClaude(prompt, master.signal);
          const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

          try {
            actionPlan = JSON.parse(cleaned);
            if (actionPlan && typeof actionPlan === 'object') {
              actionPlan.script_rewrites = normalizeScriptRewrites((actionPlan as any).script_rewrites);
            }
          } catch {
            console.error('[Generate] Failed to parse headline examples:', cleaned.slice(0, 300));
            actionPlan = {
              headline_examples: headlineExamplesArray.map((h: string) => ({ structure: h, filled_example: '' })),
              viral_term_examples: viralTermsArray.map((t: string) => ({ viral_term: t, headline_example: '' })),
              script_rewrites: [],
            };
          }
        } else {
          sendProgress(5, 'Sem insumos para exemplos. Pulando...');
        }

        // STEP 6: Playbook
        let playbook = '';
        if (extractedProfile) {
          sendProgress(6, 'Gerando Playbook de 15 dias...');
          const nucleoInfo = formatNucleo(extractedProfile);

          const refsText = referencesData.length > 0
            ? referencesData.map((r: any) => `- @${r.username}${r.fullName ? ` (${r.fullName})` : ''}`).join('\n')
            : 'Nenhuma referência fornecida';

          const termsText = viralTermsArray.length > 0
            ? viralTermsArray.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')
            : 'Nenhum termo viral fornecido';

          const headlineText = actionPlan?.headline_examples?.length > 0
            ? actionPlan.headline_examples.map((h: any, i: number) => `${i + 1}. Estrutura: "${h.structure}" → Exemplo: "${h.filled_example}"`).join('\n')
            : headlineExamplesArray.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n') || 'Nenhuma headline fornecida';

          const scriptText = actionPlan?.script_rewrites?.length > 0
            ? actionPlan.script_rewrites.map((s: ScriptRewriteValue, i: number) => formatScriptRewriteForPlaybook(s, i)).join('\n\n')
            : scriptExamplesArray.map((s: string, i: number) => `--- Roteiro ${i + 1} ---\n${s}`).join('\n\n') || 'Nenhum roteiro fornecido';

          const videoText = videoExamples.length > 0
            ? videoExamples.map((v: string, i: number) => `${i + 1}. ${v}`).join('\n')
            : 'Nenhum vídeo de referência fornecido';

          const prompt = PLAYBOOK_PROMPT
            .replace('{{NUCLEO_INFLUENCIA}}', nucleoInfo)
            .replace('{{NARRATIVE}}', narrative || 'Narrativa não gerada')
            .replace('{{REFERENCES}}', refsText)
            .replace('{{VIRAL_TERMS}}', termsText)
            .replace('{{HEADLINE_EXAMPLES}}', headlineText)
            .replace('{{SCRIPT_REWRITES}}', scriptText)
            .replace('{{VIDEO_EXAMPLES}}', videoText);

          playbook = await callClaude(prompt, master.signal);
        } else {
          sendProgress(6, 'Sem perfil extraído. Pulando playbook.');
        }

        // STEP 7: Save to DB
        sendProgress(7, 'Salvando o Mapa Final no banco...');

        const contentInputs = {
          companyName: validatedRequest.companyName,
          niche: validatedRequest.niche,
          tags: validatedRequest.tags,
          painPoints: validatedRequest.painPoints,
          videoExamples,
          headlineExamples: headlineExamplesArray,
          scriptExamples: scriptExamplesArray,
        };

        if (actionPlan) {
          actionPlan.playbook = playbook || null;
        } else if (playbook) {
          actionPlan = { headline_examples: [], viral_term_examples: [], script_rewrites: [], playbook };
        }

        const { data: inserted, error: dbError } = await supabaseAdmin
          .from('maps')
          .insert({
            client_username: cleanUsername,
            reference_profiles: referenceProfiles || null,
            viral_term: JSON.stringify(viralTermsArray),
            transcription: transcription || null,
            viral_format: JSON.stringify(contentInputs),
            client_data: clientData,
            references_data: referencesData.length > 0 ? referencesData : null,
            extracted_profile: extractedProfile || null,
            narrative: narrative || null,
            action_plan: actionPlan ? JSON.stringify(actionPlan) : null,
          })
          .select()
          .single();

        if (dbError) {
          console.error('[Generate] DB ERROR', dbError);
          sendProgress(7, 'Aviso: Erro ao salvar no banco, mas a geração concluiu.');
          sendEvent({ type: 'done', id: null, username: cleanUsername });
        } else {
          sendEvent({ type: 'done', id: inserted.id, username: cleanUsername });
        }
      } catch (err: any) {
        if (master.signal.aborted) {
          console.log('[Generate] Abortado:', master.signal.reason);
        } else {
          console.error('[Generate] Erro na pipeline:', err);
          sendEvent({ type: 'error', message: err.message || 'Erro desconhecido' });
        }
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
