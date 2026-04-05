import { Anthropic } from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function callClaude(prompt: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  return '';
}

export const EXTRACT_PROFILE_PROMPT = `Com base na transcrição abaixo de uma sessão de mentoria, extraia as seguintes informações sobre o mentorado. Retorne APENAS um JSON válido, sem markdown, sem texto adicional:

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

export const NARRATIVE_PROMPT = `Aja como um Copywriter Sênior especialista no "Método Audience" de criação de roteiros virais e posicionamento de marca. Sua missão é extrair e construir a minha "Narrativa Magnética", que é a união da ideia central que eu defendo (Narrativa) com a minha promessa de autoridade (Apresentação Magnética).

A Narrativa Magnética serve para conectar o conteúdo de valor que eu entrego nos meus vídeos com o desejo do meu público, aumentando o nível de consciência deles para a minha solução e gerando vontade de me seguir e comprar de mim.

Aqui estão as informações do meu Núcleo de Influência:
{{NUCLEO_INFLUENCIA}}

Com base nessas informações, crie 3 opções completas de "Narrativa Magnética", divididas em duas partes (como em um roteiro de Reels):

PARTE 1: O CONECTOR E A NARRATIVA (A Venda da Ideia)
Crie o parágrafo de transição que vem logo após a entrega do conteúdo do vídeo. Use a estrutura de conector: "E você precisa entender o seguinte..." ou "A verdade que ninguém te conta é que...". Em seguida, apresente a minha [Nova Crença] combatendo o [Inimigo]. O objetivo aqui é vender a ideia central do meu movimento e elevar o nível de consciência da pessoa.

PARTE 2: A APRESENTAÇÃO MAGNÉTICA
Logo após a narrativa, crie a minha apresentação de impacto. Ela deve soar humana, direta e com autoridade. Use as seguintes estruturas validadas:
- Opção A (Direta e Focada no Desejo): "Eu sou [Nome], especialista em [Profissão], e eu estou aqui para ajudar [Público] a [Desejo], evitando [Dor/Inimigo]."
- Opção B (Focada na Empatia e Dor): "Meu nome é [Nome], e eu sei que você se sente [Dor/Exausto] por causa do [Inimigo]. Mas calma, eu estou aqui para te mostrar o caminho para [Desejo/Solução]."
- Opção C (Brevidade Inteligente): Crie uma versão extremamente enxuta e de alto impacto focada na transformação real.

A linguagem deve ser natural, falada, sem parecer robô.`;

export const ACTION_PLAN_PROMPT = `Aja como um Estrategista de Conteúdo Sênior especialista no "Método Audience". Com base nas informações abaixo, crie um Plano de Ação detalhado e prático para o mentorado.

PERFIL DO MENTORADO:
{{NUCLEO_INFLUENCIA}}

TERMO VIRAL: {{VIRAL_TERM}}

FORMATO VIRAL / INSUMOS:
{{VIRAL_FORMAT}}

NARRATIVA GERADA:
{{NARRATIVE}}

Crie um plano de ação com:
1. **Posicionamento de Perfil** — Bio, destaques e identidade visual
2. **Estratégia de Conteúdo Semanal** — Frequência e pilares
3. **Roteiro Base para Reels** — Usando a narrativa magnética gerada
4. **Estratégia de Crescimento** — Como usar o termo viral e referências
5. **Próximos Passos** — 5 ações imediatas

Seja prático, direto e com linguagem acessível. Use formatação em Markdown bem rica para a leitura.`;
