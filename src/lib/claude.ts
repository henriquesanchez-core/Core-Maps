import { Anthropic } from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function callClaudeOnce(prompt: string, signal?: AbortSignal): Promise<string> {
  const message = await anthropic.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal, timeout: 240_000 },
  )
  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Claude retornou tipo de conteúdo inesperado')
  return content.text
}

export async function callClaude(prompt: string, signal?: AbortSignal): Promise<string> {
  const backoffs = [1000, 2000]
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      return await callClaudeOnce(prompt, signal)
    } catch (err: any) {
      const status: number = err?.status ?? 0
      const retryable = status === 429 || (status >= 500 && status < 600)
      if (!retryable || attempt === 2) throw err
      await new Promise(r => setTimeout(r, backoffs[attempt]))
    }
  }
  throw new Error('Unreachable')
}

export const EXTRACT_PROFILE_PROMPT = `Você é um estrategista sênior do "Método Audience" criado por Elias Maman. Sua missão é extrair o NÚCLEO DE INFLUÊNCIA completo de um mentorado a partir da transcrição de uma sessão de diagnóstico/mentoria.

O Núcleo de Influência é o mapa de comunicação estratégico que define TUDO sobre o posicionamento do mentorado: quem ele é, quem ele ajuda, qual dor resolve, quem é o inimigo, qual a solução, quais crenças defende e como se apresenta.

REGRAS DE EXTRAÇÃO:
1. O INIMIGO nunca pode ser a própria pessoa/público. Deve ser um comportamento, uma indústria, um hábito, uma mentalidade ou uma força externa que causa a dor. Ex: "o mundo de 3 segundos", "a geração mais rebelde da história", "os princípios modernos de relacionamento".
2. As SOLUÇÕES ALTERNATIVAS são coisas que o público JÁ TENTOU e que NÃO FUNCIONARAM. São tentativas frustradas que geram identificação.
3. A MENTIRA/CRENÇA ERRADA é algo que o público ACREDITA que é verdade mas NÃO É. Deve ser específica e gerar um "soco" de reconhecimento.
4. O PROBLEMA FILOSÓFICO segue a estrutura "Não faz sentido [situação injusta/absurda]". Deve gerar indignação e identificação imediata.
5. Os BENEFÍCIOS devem ser tangíveis, específicos e dimensionados — como os do Bruno Andrade: "clientes que te pagam mais, te dão menos trabalho e geram mais resultado". NÃO use termos vagos como "qualidade de vida" ou "bem-estar".
6. As CRENÇAS CENTRAIS são frases de alto impacto que o mentorado defende e pode repetir em vários vídeos. Podem seguir estruturas como: "X vale mais que Y", "Não faz sentido X enquanto Y", "Existem dois tipos de X: os que Y e os que Z", ou frases contraintuitivas.
7. Se algum campo não for mencionado explicitamente na transcrição, DEDUZA com inteligência a partir do contexto. Se realmente não houver informação, use null.

Extraia o Núcleo de Influência completo. Retorne APENAS um JSON válido, sem markdown, sem texto adicional:

{
  "nome": "nome do mentorado",
  "especialidade": "profissão ou especialidade",
  "termo_proprio": "termo ou título que ele usa para se identificar (ex: 'especialista em audiência', 'a nutricionista do alto rendimento'). null se não mencionado",
  "publico_alvo": "quem ele ajuda — seja específico (ex: 'donos de brechó', 'mulheres 40+ na menopausa', 'bons profissionais no anonimato')",
  "nome_audiencia": "nome que dá para a audiência (ex: 'cientistas da atenção'). null se não mencionado",
  "dor_principal": "a grande dor/problema que ele resolve — específico e emocional",
  "inimigo": "o causador da dor — NÃO pode ser a pessoa. Deve ser um comportamento, sistema, mentalidade ou força externa",
  "nome_inimigo": "nome 'sexy' ou marcante para o inimigo (ex: 'o século da preguiça', 'cegueira funcional', 'a maldição do diploma'). null se não mencionado",
  "solucoes_alternativas": ["lista de coisas que o público já tentou e não funcionaram — geram identificação"],
  "mentira_crenca_errada": "a maior mentira/crença errada que o público acredita (ex: 'seguro de vida é só para a morte', 'esteira emagrece', 'preenchimento trata flacidez')",
  "problema_filosofico": "a frase de indignação no formato 'Não faz sentido [situação absurda]' (ex: 'Não faz sentido os bons profissionais estarem no anonimato enquanto os ruins têm voz')",
  "solucao": "a solução que o mentorado oferece — engenharia reversa da dor (ex: 'empacotar seu conteúdo pro mundo de 3 segundos', 'se relacionar com base nos princípios de quem criou os relacionamentos')",
  "beneficios": ["3 benefícios tangíveis e específicos que a solução gera — NÃO use termos vagos"],
  "desejo": "a transformação/desejo maior que ele entrega",
  "nome_metodo": "nome do método/framework, se existir. null se não mencionado",
  "crencas_centrais": ["3-5 frases de alto impacto que o mentorado defende — crenças fortes, específicas e repetíveis em vários vídeos"],
  "nova_crenca": "a crença central mais forte — aquela que se o público acreditar, já está mais perto de comprar",
  "historia_emocional": "história pessoal emocionante mencionada que pode ser usada em conteúdo. null se não mencionada",
  "provas_cases": "cases de sucesso, números ou provas de resultado mencionados. null se não mencionados"
}

TRANSCRIÇÃO:
{{TRANSCRIPTION}}`;

export const NARRATIVE_PROMPT = `Você é um Copywriter Sênior do "Método Audience" criado por Elias Maman. Sua missão é gerar os CONECTORES DE NARRATIVA e as APRESENTAÇÕES MAGNÉTICAS de um mentorado.

CONTEXTO DO MÉTODO:
No Método Audience, um Reels viral segue esta estrutura:
HEADLINE → INTENSIFICADOR DO MISTÉRIO → CTA (salva) → CONTEÚDO NOTÁVEL → CTA (compartilha) → **CONECTOR DE NARRATIVA** → **APRESENTAÇÃO MAGNÉTICA** → CTA FINAL (me segue)

O CONECTOR é a ponte entre o conteúdo de valor e a narrativa/posicionamento. A APRESENTAÇÃO MAGNÉTICA é como o mentorado se apresenta no final — é o momento que transforma um espectador em seguidor.

Aqui está o Núcleo de Influência completo do mentorado:
{{NUCLEO_INFLUENCIA}}

---

Gere o seguinte conteúdo em DUAS SEÇÕES. A linguagem deve ser NATURAL, FALADA e HUMANA — como se estivesse sendo dita em um Reels, não escrita em um artigo.

═══════════════════════════════
SEÇÃO 1: CONECTORES DE NARRATIVA
═══════════════════════════════

Gere 3 blocos de "Conector + Narrativa" diferentes. Cada bloco é o trecho que vem LOGO APÓS o conteúdo do vídeo e ANTES da apresentação magnética.

Estrutura de cada bloco:
1. FRASE PONTE (o conector) — usa uma dessas aberturas:
   • "E você precisa entender o seguinte..."
   • "A verdade que ninguém te conta é que..."
   • "Então, compartilha esse vídeo com [público] e..."
   • "E o que eu preciso que você entenda é..."
   • "Mas antes de sair desse vídeo, entenda uma coisa..."

2. NARRATIVA (a venda da ideia) — logo após a frase ponte, apresente a crença central combatendo o [Inimigo] e elevando o nível de consciência para a [Solução]. Deve ser 2-4 frases. O tom é de convicção absoluta, como um líder de movimento.

EXEMPLO DO ELIAS (para referência de tom e estrutura):
"Então, compartilha esse vídeo com todo profissional que você conhece. E você precisa entender o seguinte: audiência vale mais que dinheiro. Porque o profissional que tem audiência nunca mais vai depender de algoritmo, de agência ou de indicação. Ele se torna o próprio canal de vendas."

═══════════════════════════════
SEÇÃO 2: APRESENTAÇÕES MAGNÉTICAS
═══════════════════════════════

Gere 3 apresentações magnéticas diferentes usando as fórmulas validadas abaixo. Cada uma deve ser COMPLETA e PRONTA PARA USAR no final de um Reels.

FÓRMULA 1 — DIRETA + BENEFÍCIOS:
"Eu sou [Nome], [profissão/especialidade], e eu estou aqui para ajudar [público] a [benefício 1], [benefício 2] e [benefício 3]."
(Referência: Bruno Andrade — "clientes que te pagam mais, te dão menos trabalho e geram mais resultado")

FÓRMULA 2 — EMPATIA + DOR:
"Eu sou [Nome] e eu sei que você [descrição vívida da dor/situação atual]. Por isso eu estou aqui para te mostrar o caminho para [solução/desejo]."
(Referência: Veridiana — "eu sei que você se sente solitário e exausto por liderar a geração mais rebelde da história")

FÓRMULA 3 — CRENÇA FILOSÓFICA (INDIGNAÇÃO):
"Eu sou [Nome], [profissão]. E não faz sentido [problema filosófico/indignação]. Se você está comigo nessa, me segue que eu vou te mostrar [caminho]."
(Referência: Elias — "Não faz sentido os bons estarem no anonimato enquanto os ruins têm alcance")

REGRAS PARA TODAS AS APRESENTAÇÕES:
- Tom HUMANO e CONVERSADO — como se estivesse falando com alguém, não lendo um texto.
- Os benefícios devem ser TANGÍVEIS e DIMENSIONADOS (não vagos).
- NUNCA use "qualidade de vida", "bem-estar" ou outros termos genéricos.
- A apresentação deve fazer a pessoa pensar: "eu PRECISO seguir essa pessoa".
- Cada apresentação deve terminar com um convite natural para seguir ("me segue que...", "se faz sentido, me acompanha aqui", etc.)
- Aplique o princípio de BREVIDADE INTELIGENTE: falar menos, com mais punch. Se dá pra tirar uma palavra sem perder sentido, tire.

═══════════════════════════════

FORMATO DE SAÍDA:
Retorne o conteúdo organizado exatamente assim, com os separadores e títulos:

## CONECTORES DE NARRATIVA

### Conector 1
[bloco completo: frase ponte + narrativa]

### Conector 2
[bloco completo: frase ponte + narrativa]

### Conector 3
[bloco completo: frase ponte + narrativa]

## APRESENTAÇÕES MAGNÉTICAS

### Opção 1 — Direta + Benefícios
[apresentação completa]

### Opção 2 — Empatia + Dor
[apresentação completa]

### Opção 3 — Indignação Filosófica
[apresentação completa]

MUITO IMPORTANTE: Retorne APENAS o conteúdo gerado no formato acima. Não inclua introduções, saudações, conversas, explicações ou perguntas finais. Entregue diretamente e unicamente o conteúdo final.`;

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

PARTE 3: ANÁLISE DE ESTRUTURA INVISÍVEL DO ROTEIRO (MÉTODO AUDIENCE)
Você receberá roteiros virais já validados, que podem ser de nichos diferentes do mentorado. Para cada roteiro, analise a ESTRUTURA INVISÍVEL COMPLETA usando a taxonomia do Método Audience criado por Elias Maman.

TAXONOMIA DO MÉTODO AUDIENCE — ELEMENTOS QUE PODEM APARECER:

• Headline — frase de abertura que captura atenção em 0-3 segundos
  Subtipos: Promessa Direta, Contraintuitiva, Número + Benefício, Pergunta Retórica, Afirmação Polêmica, Identificação Direta

• Intensificador — elemento logo após a headline que prende o espectador e evita o skip
  Subtipos:
  - Intensificador de Mistério: cria curiosidade sobre o que vem a seguir
  - Intensificador de Desejo: amplifica o desejo pelo resultado
  - Intensificador de Medo: aciona o medo de perder ou errar
  - Intensificador de Reconhecimento: faz o público se sentir visto/entendido
  - Intensificador de Crença: desafia ou reforça uma crença do público
  - Intensificador de Autoridade: estabelece credibilidade do criador

• CTA — convite à ação dentro do conteúdo
  Subtipos:
  - CTA de Salvamento: "salva esse vídeo porque..."
  - CTA de Compartilhamento: "manda pra [pessoa] que..."
  - CTA de Comentário: "comenta aqui [X] se você [Y]..."

• Valor Prático — o conteúdo de valor central do vídeo
  Subtipos:
  - Valor Prático - Lista Numerada: X coisas/passos/erros numerados
  - Valor Prático - Checklist: lista de verificação com critérios
  - Valor Prático - Dica Rápida: um insight único, direto e aplicável
  - Valor Prático - Mini Tutorial: passo a passo simplificado
  - Valor Prático - Modelo Pronto: template/script/fórmula copiável
  - Valor Prático - Comparativo: X vs Y ou antes e depois
  - Valor Prático - Lista com Argumentação: cada item tem justificativa

• Ponto de Identificação — frase que faz o público dizer "isso sou eu"
  Conecta com a dor, situação ou desejo do público de forma específica e visceral

• Prova Social — evidência de resultado ou autoridade
  Subtipos:
  - Prova - Números e Estatísticas
  - Prova - Case de Resultado
  - Prova - Depoimento
  - Prova - Fato Comprovado (dado científico ou referência externa)

• Disrupção — elemento que quebra padrão e gera engajamento
  Subtipos:
  - Disrupção Contraintuitiva: afirmação que contradiz o senso comum
  - Disrupção de Controle: devolve o poder ao espectador ("não precisa de X para Y")
  - Disrupção Polêmica: posicionamento forte e divisivo (mas verdadeiro)

• Storytelling — narrativa pessoal ou de terceiro que gera emoção e identificação

• Conector de Narrativa — ponte entre o conteúdo e o posicionamento do criador
  Ex: "E você precisa entender o seguinte...", "A verdade que ninguém te conta é que..."

• Crença Central — a ideia/filosofia que o criador defende e quer plantar no público

• Apresentação Magnética — como o criador se apresenta e convida ao follow no final

INSTRUÇÕES DE ANÁLISE:
1. Leia o roteiro inteiro antes de analisar
2. Identifique TODOS os elementos presentes — não force elementos que não existem, mas não pule nenhum que exista
3. Para elementos com subtipo, use o nome composto (ex: "Intensificador de Mistério", "Valor Prático - Lista Numerada")
4. Em "structure": descreva o PRINCÍPIO INVISÍVEL e a engenharia da frase, de forma abstrata e transferível para qualquer nicho
5. Em "modeled_example": escreva um exemplo concreto e pronto para uso, já adaptado ao nicho do mentorado
6. Mantenha a ORDEM dos elementos como aparecem no roteiro original

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
    {
      "elements": [
        { "element_type": "Headline", "structure": "princípio invisível da frase", "modeled_example": "exemplo adaptado ao nicho do mentorado" },
        { "element_type": "Intensificador de Mistério", "structure": "princípio invisível", "modeled_example": "exemplo adaptado" }
      ]
    }
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
