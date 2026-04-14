require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { ApifyClient } = require('apify-client');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3000;

const anthropic = new Anthropic();
const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/maps', express.static(path.join(__dirname, 'output')));

// Prompts
const EXTRACT_PROFILE_PROMPT = `Com base na transcrição abaixo de uma sessão de mentoria, extraia as seguintes informações sobre o mentorado. Retorne APENAS um JSON válido, sem markdown, sem texto adicional:

{
  "nome": "nome do mentorado",
  "especialidade": "profissão ou especialidade",
  "publico_alvo": "quem ele ajuda",
  "dor": "a grande dor que ele resolve",
  "inimigo": "o inimigo/causador da dor",
  "desejo": "a transformação/desejo que entrega",
  "nova_crenca": "a nova crença que defende"
}

TRANSCRIÇÃO:
{{TRANSCRIPTION}}`;

const NARRATIVE_PROMPT = `Aja como um Copywriter Sênior especialista no "Método Audience" de criação de roteiros virais e posicionamento de marca. Sua missão é extrair e construir a minha "Narrativa Magnética", que é a união da ideia central que eu defendo (Narrativa) com a minha promessa de autoridade (Apresentação Magnética).

A Narrativa Magnética serve para conectar o conteúdo de valor que eu entrego nos meus vídeos com o desejo do meu público, aumentando o nível de consciência deles para a minha solução e gerando vontade de me seguir e comprar de mim.

Aqui estão as informações do meu Núcleo de Influência:
{{NUCLEO_INFLUENCIA}}

Com base nessas informações, crie 3 opções completas de "Narrativa Magnética", divididas em duas partes (como em um roteiro de Reels):

PARTE 1: O CONECTOR E A NARRATIVA (A Venda da Ideia)
Crie o parágrafo de transição que vem logo após a entrega do conteúdo do vídeo. Use a estrutura de conector: "E você precisa entender o seguinte..." ou "A verdade que ninguém te conta é que...". Em seguida, apresente a minha [Nova Crença] combatendo o [Inimigo]. O objetivo aqui é vender a ideia central do meu movimento e elevar o nível de consciência da pessoa.

PARTE 2: A APRESENTAÇÃO MAGNÉTICA
Logo após a narrativa, crie a minha apresentação de impacto. Ela deve soar humana, direta e com autoridade. Use as seguintes estruturas validadas para criar as opções:
- Opção A (Direta e Focada no Desejo): "Eu sou [Nome], especialista em [Profissão], e eu estou aqui para ajudar [Público] a [Desejo], evitando [Dor/Inimigo]."
- Opção B (Focada na Empatia e Dor): "Meu nome é [Nome], e eu sei que você se sente [Dor/Exausto] por causa do [Inimigo]. Mas calma, eu estou aqui para te mostrar o caminho para [Desejo/Solução]."
- Opção C (Brevidade Inteligente): Crie uma versão extremamente enxuta e de alto impacto focada na transformação real, sem usar palavras genéricas ou técnicas.

A linguagem deve ser natural, falada (como se estivesse gravando um vídeo), sem parecer um robô ou um texto formal de blog.`;

const ACTION_PLAN_PROMPT = `Aja como um Estrategista de Conteúdo Sênior especialista no "Método Audience". Com base nas informações abaixo, crie um Plano de Ação detalhado e prático para o mentorado.

PERFIL DO MENTORADO:
{{NUCLEO_INFLUENCIA}}

TERMO VIRAL: {{VIRAL_TERM}}

FORMATO VIRAL / INSUMOS:
{{VIRAL_FORMAT}}

NARRATIVA GERADA:
{{NARRATIVE}}

Crie um plano de ação com:
1. **Posicionamento de Perfil** — Bio, destaques, e identidade visual sugerida
2. **Estratégia de Conteúdo Semanal** — Frequência, tipos de posts, pilares de conteúdo
3. **Roteiro Base para Reels** — Estrutura de roteiro usando a narrativa magnética gerada
4. **Estratégia de Crescimento** — Como usar o termo viral e as referências para crescer
5. **Próximos Passos Imediatos** — 5 ações concretas para executar nos próximos 7 dias

Seja prático, direto e use linguagem acessível.`;

// Helper: Chamar Claude API
async function callClaude(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}

// Helper: Buscar perfil Instagram
async function fetchInstagramProfile(username) {
  const clean = username.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
  const run = await apifyClient.actor('apify/instagram-profile-scraper').call({
    usernames: [clean],
    resultsLimit: 12,
  });
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  return items[0] || {};
}

// Helper: Formatar núcleo de influência
function formatNucleo(profile) {
  return `- Meu Nome: ${profile.nome}
- Minha Profissão/Especialidade: ${profile.especialidade}
- Quem eu ajudo (Público-Alvo): ${profile.publico_alvo}
- A grande dor que eu resolvo: ${profile.dor}
- O Inimigo/Causador dessa dor: ${profile.inimigo}
- O Desejo/Transformação que eu entrego: ${profile.desejo}
- A Nova Crença que eu defendo: ${profile.nova_crenca}`;
}

// Dashboard
app.get('/', (req, res) => {
  const mapsDir = path.join(__dirname, 'output');
  let existingMaps = [];
  if (fs.existsSync(mapsDir)) {
    existingMaps = fs.readdirSync(mapsDir)
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace('.html', ''));
  }
  res.render('dashboard', { existingMaps });
});

// SSE: Pipeline completo — um endpoint, tudo automático
app.post('/api/generate', async (req, res) => {
  const { clientUsername, referenceProfiles, viralTerm, transcription, viralFormat } = req.body;

  if (!clientUsername) {
    return res.status(400).json({ error: 'Username do cliente é obrigatório' });
  }

  const cleanUsername = clientUsername.replace('@', '').toLowerCase();

  // SSE para mandar progresso em tempo real
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  function sendProgress(step, message) {
    res.write(`data: ${JSON.stringify({ type: 'progress', step, message })}\n\n`);
  }

  try {
    // ── STEP 1: Buscar perfil do cliente no Instagram ──
    sendProgress(1, 'Buscando perfil do Instagram...');
    let clientData = {};
    try {
      clientData = await fetchInstagramProfile(cleanUsername);
    } catch (err) {
      sendProgress(1, 'Aviso: não foi possível buscar Instagram, continuando...');
    }

    // ── STEP 2: Buscar perfis de referência ──
    let references = [];
    if (referenceProfiles && referenceProfiles.trim()) {
      sendProgress(2, 'Buscando perfis de referência...');
      try {
        const usernames = referenceProfiles.split('\n').map(u => u.trim()).filter(Boolean);
        const cleanUsernames = usernames.map(u => u.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, ''));
        const run = await apifyClient.actor('apify/instagram-profile-scraper').call({
          usernames: cleanUsernames,
          resultsLimit: 12,
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        references = items;
      } catch (err) {
        sendProgress(2, 'Aviso: não foi possível buscar referências, continuando...');
      }
    }

    // ── STEP 3: Extrair perfil da transcrição ──
    let extractedProfile = null;
    if (transcription && transcription.trim()) {
      sendProgress(3, 'Extraindo perfil da transcrição com IA...');
      const prompt = EXTRACT_PROFILE_PROMPT.replace('{{TRANSCRIPTION}}', transcription);
      const result = await callClaude(prompt);
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      extractedProfile = JSON.parse(cleaned);
    }

    // ── STEP 4: Gerar narrativa ──
    let narrative = '';
    if (extractedProfile) {
      sendProgress(4, 'Gerando Narrativa Magnética...');
      const nucleoInfo = formatNucleo(extractedProfile);
      const prompt = NARRATIVE_PROMPT.replace('{{NUCLEO_INFLUENCIA}}', nucleoInfo);
      narrative = await callClaude(prompt);
    }

    // ── STEP 5: Gerar plano de ação ──
    let actionPlan = '';
    if (extractedProfile) {
      sendProgress(5, 'Gerando Plano de Ação...');
      const nucleoInfo = formatNucleo(extractedProfile);
      const prompt = ACTION_PLAN_PROMPT
        .replace('{{NUCLEO_INFLUENCIA}}', nucleoInfo)
        .replace('{{VIRAL_TERM}}', viralTerm || 'Não informado')
        .replace('{{VIRAL_FORMAT}}', viralFormat || 'Não informado')
        .replace('{{NARRATIVE}}', narrative);
      actionPlan = await callClaude(prompt);
    }

    // ── STEP 6: Gerar HTML final ──
    sendProgress(6, 'Montando mapa final...');
    const templateData = {
      client: { username: cleanUsername, data: clientData },
      references,
      viralTerm: viralTerm || '',
      transcription: transcription || '',
      narrative,
      viralFormat: viralFormat || '',
      actionPlan,
      extractedProfile,
      generatedAt: new Date().toLocaleDateString('pt-BR'),
    };

    const html = await new Promise((resolve, reject) => {
      app.render('map-template', templateData, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const outputPath = path.join(__dirname, 'output', `${cleanUsername}.html`);
    fs.writeFileSync(outputPath, html, 'utf-8');

    // Resultado final
    res.write(`data: ${JSON.stringify({
      type: 'done',
      url: `/maps/${cleanUsername}.html`,
      username: cleanUsername
    })}\n\n`);
    res.end();

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// API: Listar mapas gerados
app.get('/api/maps', (req, res) => {
  const mapsDir = path.join(__dirname, 'output');
  if (!fs.existsSync(mapsDir)) {
    return res.json({ maps: [] });
  }
  const maps = fs.readdirSync(mapsDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      username: f.replace('.html', ''),
      url: `/maps/${f}`,
    }));
  res.json({ maps });
});

app.listen(PORT, () => {
  console.log(`CoreMaps rodando em http://localhost:${PORT}`);
});
