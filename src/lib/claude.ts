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

A linguagem deve ser natural, falada, sem parecer robô.

MUITO IMPORTANTE: Retorne APENAS as 3 opções geradas. Não inclua introduções, saudações, conversas ou perguntas finais (ex: "Qual dessas opções mais ressoa com você?"). Entregue diretamente e unicamente o conteúdo final.`;

export const HEADLINE_EXAMPLES_PROMPT = `Aja como um Copywriter Sênior especialista no "Método Audience" de headlines virais para Instagram/Reels.

Você receberá o perfil do mentorado e as estruturas de headline que ele deve modelar. Sua missão é PREENCHER cada estrutura com o conteúdo real do nicho desse mentorado, criando exemplos prontos para uso.

PERFIL DO MENTORADO:
{{NUCLEO_INFLUENCIA}}

---

PARTE 1: ESTRUTURAS DE HEADLINE PREENCHIDAS
Para cada estrutura abaixo, crie um exemplo CONCRETO e PRONTO PARA USO aplicado ao nicho do mentorado. O exemplo deve ser uma headline completa, curta e de alto impacto.

Estruturas:
{{HEADLINE_STRUCTURES}}

---

PARTE 2: HEADLINES COM TERMOS VIRAIS
Para cada termo viral abaixo, crie uma headline matadora que combine esse termo com uma das estruturas acima, aplicada ao nicho do mentorado. A headline deve ser curta, de alto impacto e pronta para usar em Reels.

Termos Virais:
{{VIRAL_TERMS}}

---

PARTE 3: ROTEIROS PERSONALIZADOS
Para cada roteiro/estrutura abaixo, crie uma versão PERSONALIZADA e PRONTA PARA USO para o mentorado, usando seu nicho, público, dor e linguagem natural. Mantenha a estrutura do roteiro original mas adapte todo o conteúdo para o nicho do mentorado.

Roteiros:
{{SCRIPT_STRUCTURES}}

---

Retorne APENAS um JSON válido, sem markdown, sem texto adicional, neste formato exato:

{
  "headline_examples": [
    { "structure": "a estrutura original exata", "filled_example": "o exemplo preenchido" }
  ],
  "viral_term_examples": [
    { "viral_term": "o termo viral exato", "headline_example": "a headline criada" }
  ],
  "script_rewrites": [
    "roteiro personalizado completo 1",
    "roteiro personalizado completo 2"
  ]
}`;

export const PLAYBOOK_PROMPT = `Você é um mentor de conteúdo escrevendo instruções práticas para o SEU CLIENTE. O cliente acabou de receber o Mapa Estratégico dele e agora precisa de um passo a passo de 15 dias para colocar tudo em prática.

IMPORTANTE: Você está falando DIRETAMENTE com o cliente. Use "você" (não "mentorado"). O tom deve ser de um mentor dando tarefas claras para o aluno executar — como um professor passando lição de casa.

Aqui estão TODOS os dados do mapa estratégico desse cliente:

PERFIL (Núcleo de Influência):
{{NUCLEO_INFLUENCIA}}

NARRATIVA MAGNÉTICA:
{{NARRATIVE}}

PERFIS DE REFERÊNCIA:
{{REFERENCES}}

TERMOS VIRAIS:
{{VIRAL_TERMS}}

ESTRUTURAS DE HEADLINE (com exemplos preenchidos pela IA):
{{HEADLINE_EXAMPLES}}

ROTEIROS PERSONALIZADOS:
{{SCRIPT_REWRITES}}

VÍDEOS DE REFERÊNCIA:
{{VIDEO_EXAMPLES}}

---

Crie um PLAYBOOK DE 15 DIAS seguindo estas regras:

1. FALE DIRETAMENTE COM O CLIENTE — "Abra a aba Referências do seu mapa e...", "Vá na aba Headlines e pegue a estrutura 1..."
2. Cada dia deve ter EXERCÍCIOS CONCRETOS que o cliente consegue fazer sozinho. Exemplos do tipo de tarefa:
   - "Abra os perfis de referência (@username) e encontre os 10 posts com mais views. Anote o que eles têm em comum."
   - "Pegue a Estrutura de Headline 1 do seu mapa e crie 3 variações para o seu nicho."
   - "Use o Termo Viral 'X' e escreva 5 headlines diferentes aplicando ele."
   - "Grave um vídeo de 60s usando o Roteiro 1 do seu mapa. Não precisa ficar perfeito, só grave."
   - "Assista os vídeos de referência e anote a estrutura: gancho, desenvolvimento, CTA."
   - "Releia sua Narrativa Magnética e escreva 3 ganchos de vídeo que conectem com a dor do seu público."
3. REFERENCIE ELEMENTOS ESPECÍFICOS do mapa pelo nome/número — cite os termos virais reais, os @usernames das referências, as estruturas de headline pelo número
4. Distribua assim ao longo dos 15 dias:
   - Dias 1-3: Estudo e absorção (analisar referências, entender as estruturas, estudar os vídeos de referência)
   - Dias 4-7: Prática de headlines e ganchos (criar variações usando as estruturas e termos virais)
   - Dias 8-11: Produção de conteúdo (gravar vídeos usando os roteiros, aplicar as headlines)
   - Dias 12-15: Publicação e análise (postar, testar diferentes headlines, analisar resultados)
5. Cada dia deve ter entre 2-4 tarefas específicas. Não mais que isso.
6. Inclua dicas curtas de execução quando relevante (ex: "Dica: grave em luz natural, perto da janela")

Formatação Markdown:
- Use ## para semanas (Semana 1: Estudo e Absorção, Semana 2: Produção, Semana 3: Publicação)
- Use ### **Dia X — [Tema do dia]** para cada dia
- Use checkboxes (- [ ]) para as tarefas, para o cliente poder marcar o que já fez
- Destaque elementos do mapa em **negrito**
- Use > blockquote para dicas

Escreva em português brasileiro, tom direto e encorajador. Não seja genérico — cada tarefa deve ser TÃO específica que o cliente não tenha dúvida do que fazer.`;
