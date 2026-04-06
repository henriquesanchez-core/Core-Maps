import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchInstagramProfile, fetchInstagramProfiles } from '@/lib/apify';
import {
  callClaude,
  EXTRACT_PROFILE_PROMPT,
  NARRATIVE_PROMPT,
  HEADLINE_EXAMPLES_PROMPT,
} from '@/lib/claude';

export const dynamic = 'force-dynamic';

function formatNucleo(profile: any) {
  return `- Meu Nome: ${profile.nome || 'N/A'}
- Minha Profissão/Especialidade: ${profile.especialidade || 'N/A'}
- Quem eu ajudo (Público-Alvo): ${profile.publico_alvo || 'N/A'}
- A grande dor que eu resolvo: ${profile.dor || 'N/A'}
- O Inimigo/Causador dessa dor: ${profile.inimigo || 'N/A'}
- O Desejo/Transformação que eu entrego: ${profile.desejo || 'N/A'}
- A Nova Crença que eu defendo: ${profile.nova_crenca || 'N/A'}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientUsername,
      referenceProfiles,
      transcription,
      viralTerms,
      videoExamples,
      headlineExamples,
      scriptExamples,
    } = body;

    if (!clientUsername) {
      return NextResponse.json({ error: 'Username do cliente é obrigatório' }, { status: 400 });
    }

    const cleanUsername = clientUsername.replace('@', '').toLowerCase();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }
        function sendProgress(step: number, message: string) {
          sendEvent({ type: 'progress', step, message });
        }
        function sendError(message: string) {
          sendEvent({ type: 'error', message });
          controller.close();
        }

        try {
          // STEP 1: Client Instagram Profile (foto, nome, @)
          sendProgress(1, 'Buscando perfil do Instagram...');
          let clientData = {};
          try {
            clientData = await fetchInstagramProfile(cleanUsername);
            console.log('[Generate] clientData:', JSON.stringify(clientData));
          } catch (err: any) {
            console.error('[Generate] Erro ao buscar Instagram:', err?.message, err?.stack);
            sendProgress(1, `Aviso: erro Instagram - ${err.message}`);
          }

          // STEP 2: Reference Profiles (foto, nome, link)
          sendProgress(2, 'Buscando perfis de referência...');
          let referencesData: any[] = [];
          if (referenceProfiles && referenceProfiles.trim()) {
            try {
              const usernames = referenceProfiles.split('\n').map((u: string) => u.trim()).filter(Boolean);
              referencesData = await fetchInstagramProfiles(usernames);
            } catch (err: any) {
              console.error('[Generate] Erro ao buscar referências:', err);
              sendProgress(2, `Aviso: não foi possível buscar referências (${err.message})`);
            }
          }

          // STEP 3: Extract Profile from Transcription
          let extractedProfile = null;
          if (transcription && transcription.trim()) {
            sendProgress(3, 'Extraindo perfil estratégico com IA...');
            const prompt = EXTRACT_PROFILE_PROMPT.replace('{{TRANSCRIPTION}}', transcription);
            const result = await callClaude(prompt);
            const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            try {
              extractedProfile = JSON.parse(cleaned);
            } catch(e) {
              console.error("Nao foi possivel o parse", cleaned);
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
            narrative = await callClaude(prompt);
          } else {
            sendProgress(4, 'Sem perfil extraído. Pulando narrativa.');
          }

          // STEP 5: Generate headline/viral/script examples with AI
          const viralTermsArray = Array.isArray(viralTerms) ? viralTerms : [];
          const headlineExamplesArray = Array.isArray(headlineExamples) ? headlineExamples : [];
          const scriptExamplesArray = Array.isArray(scriptExamples) ? scriptExamples : [];

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

            const result = await callClaude(prompt);
            const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            try {
              actionPlan = JSON.parse(cleaned);
            } catch (e) {
              console.error('[Generate] Failed to parse headline examples:', cleaned);
              actionPlan = {
                headline_examples: headlineExamplesArray.map((h: string) => ({ structure: h, filled_example: '' })),
                viral_term_examples: viralTermsArray.map((t: string) => ({ viral_term: t, headline_example: '' })),
                script_rewrites: [],
              };
            }
          } else {
            sendProgress(5, 'Sem insumos para exemplos. Pulando...');
          }

          // STEP 6: Save to DB
          sendProgress(6, 'Salvando o Mapa Final no banco...');

          const contentInputs = {
            videoExamples: Array.isArray(videoExamples) ? videoExamples : [],
            headlineExamples: headlineExamplesArray,
            scriptExamples: scriptExamplesArray,
          };

          const { data: inserted, error: dbError } = await supabase
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
            console.log("DB ERROR", dbError)
            sendProgress(6, 'Aviso: Erro ao salvar no banco, mas a geração concluiu.');
            sendEvent({ type: 'done', id: null, username: cleanUsername });
          } else {
            sendEvent({ type: 'done', id: inserted.id, username: cleanUsername });
          }

          controller.close();
        } catch (err: any) {
          console.error(err);
          sendError(err.message || 'Erro desconhecido');
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
