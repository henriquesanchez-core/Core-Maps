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

O Núcleo de Influência é o mapa de comunicação estratégico criado pelo Elias Maman que define o posicionamento completo do mentorado. Ele é construído passo a passo seguindo a sequência exata abaixo.

═══════════════════════════════
SEQUÊNCIA DO NÚCLEO DE INFLUÊNCIA (na ordem exata do método)
═══════════════════════════════

1. NOME — Qual o nome do mentorado?
2. ESPECIALIDADE — O que ele faz? Profissão ou especialidade.
3. TERMO PRÓPRIO — Ele se identifica por algum termo? (ex: "especialista em audiência", "a nutricionista do alto rendimento"). Opcional.
4. PÚBLICO-ALVO — Quem ele ajuda? Seja ESPECÍFICO. (ex: "donos de brechó", "mulheres 40+ na menopausa", "bons profissionais no anonimato", "líderes de empresas")
5. DOR PRINCIPAL — Qual a principal dor que ele resolve? Obrigatória. Deve ser específica e emocional.
6. INIMIGO — Quem é o CAUSADOR dessa dor?

   REGRA CRÍTICA DO MÉTODO: O inimigo NUNCA pode ser a própria pessoa/público. Deve ser um comportamento, uma indústria, um hábito, uma mentalidade ou uma força externa.
   - "Não é você, é isso que você faz que está te prejudicando" (Elias)
   - Ex do Elias: "o mundo de 3 segundos" (causador do anonimato dos bons profissionais)
   - Ex da Veridiana: "a geração mais rebelde da história" (causadora da dor dos líderes)
   - Ex do Cacá Montanz: "os princípios modernos de relacionamento"
   - Ex da Micheline: "o hábito de ficar o dia inteiro sentada"
   Se for um comportamento da pessoa, SEPARE: culpe o comportamento, não a pessoa.

7. NOME DO INIMIGO — Um nome "sexy" ou marcante para o inimigo. (ex: "o século da preguiça", "cegueira funcional", "a maldição do diploma", "a síndrome do like"). Opcional mas poderoso.

8. SOLUÇÕES ALTERNATIVAS — O que o público JÁ TENTOU e NÃO FUNCIONOU?
   O objetivo é gerar IDENTIFICAÇÃO: "se eu consigo te explicar por que a sua tentativa falhou, você abre a porta para ouvir mais sobre o que eu tenho para te dizer" (Elias).
   - Ex do Elias: contratar agência, fazer tráfego pago, fazer feed bonitinho cheio de carrossel
   - Ex do Euriller: arrumar lançador, comprar cursos de marketing, postar aleatoriamente
   - Ex da Ana (brechó): publicar o máximo de produtos, investir em e-commerce desatualizado, baixar preço

9. MENTIRA/CRENÇA ERRADA — A MAIOR mentira que o público acredita.
   Deve ser ESPECÍFICA e gerar um "soco" de reconhecimento imediato.
   - Ex: "seguro de vida é só para a morte"
   - Ex: "esteira emagrece" (Raquel Quartieiro)
   - Ex: "preenchimento trata flacidez"
   - Ex: "se eu não tô presente, o negócio não anda"
   DICA: pegue os assuntos virais do nicho e pergunte "quais são as mentiras sobre esse assunto?"

10. PROBLEMA FILOSÓFICO — A frase de INDIGNAÇÃO. Estrutura: "Não faz sentido [situação injusta/absurda]"
    Deve gerar indignação IMEDIATA e identificação.
    - Elias: "Não faz sentido os bons profissionais estarem no anonimato enquanto os ruins têm voz"
    - Tributarista: "Não faz sentido as empresas pequenas pagarem X de imposto enquanto as grandes pagam Y"
    - Vanessa: "Não faz sentido você ter medo de fazer reposição hormonal se passou a vida inteira tomando anticoncepcional"
    - Márcio: "Não faz sentido viver a vida inteira sem saber que é autista"

11. SOLUÇÃO — É a ENGENHARIA REVERSA da dor. Se o problema é X, a solução é o oposto.
    - Elias: dor = anonimato → solução = "empacotar seu conteúdo pro mundo de 3 segundos"
    - Cacá: dor = "dedo podre" → solução = "se relacionar com base nos princípios de quem criou os relacionamentos"
    - Euriller: solução = "criar o negócio digital do futuro"

12. BENEFÍCIOS — 3 benefícios TANGÍVEIS e DIMENSIONADOS da solução.
    REGRA: NUNCA use "qualidade de vida", "bem-estar", "crescimento pessoal" ou termos genéricos.
    Os benefícios devem ser tão concretos que a pessoa visualize imediatamente.
    - Bruno Andrade: "clientes que te pagam mais, te dão menos trabalho e geram mais resultado"
    - Elias: "uma audiência que te respeita, confia e compra de você"
    - Marcelo Capela: "secar o bucho em 15 dias, em casa, sem equipamentos"

13. DESEJO/TRANSFORMAÇÃO — O resultado maior que a pessoa alcança.

14. NOME DO MÉTODO — Se existir. Opcional.

15. NOVA CRENÇA — A crença central mais forte. Se o público acreditar NISSO, já está mais perto de comprar.
    - Elias: "Audiência vale mais que dinheiro"
    - Ana (brechó): "Luxo não precisa ser caro"
    Estruturas validadas para crenças: "X vale mais que Y", contraintuitiva, "Existem dois tipos de X: os que Y e os que Z", "X não é sobre Y, é sobre Z"

Extraia o Núcleo de Influência completo. Retorne APENAS um JSON válido, sem markdown, sem texto adicional:

{
  "nome": "nome do mentorado",
  "especialidade": "profissão ou especialidade",
  "termo_proprio": "termo ou título próprio. null se não mencionado",
  "publico_alvo": "quem ele ajuda — específico",
  "dor_principal": "a grande dor que ele resolve — específica e emocional",
  "inimigo": "o causador da dor — NUNCA a pessoa, sempre um comportamento/sistema/força externa",
  "nome_inimigo": "nome 'sexy' para o inimigo. null se não mencionado",
  "solucoes_alternativas": ["coisas que o público já tentou e não funcionaram — geram identificação"],
  "mentira_crenca_errada": "a maior mentira que o público acredita — específica, gera 'soco'",
  "problema_filosofico": "Não faz sentido [situação injusta/absurda] — gera indignação imediata",
  "solucao": "engenharia reversa da dor — o que o mentorado oferece",
  "beneficios": ["3 benefícios tangíveis e dimensionados — NUNCA vagos"],
  "desejo": "a transformação/desejo maior",
  "nome_metodo": "nome do método. null se não mencionado",
  "nova_crenca": "a crença central mais forte — se o público acreditar, já quer comprar"
}

Se algum campo não for mencionado explicitamente na transcrição, DEDUZA com inteligência a partir do contexto. Se realmente não houver informação, use null.

TRANSCRIÇÃO:
{{TRANSCRIPTION}}`;

export const NARRATIVE_PROMPT = `Você é um Copywriter Sênior treinado no "Método Audience" criado por Elias Maman. Sua missão é gerar 3 OPÇÕES de fechamento de Reels para um mentorado.

═══════════════════════════════
DIRECIONAMENTO DO ESTRATEGISTA
═══════════════════════════════

O estrategista responsável pelo mentorado definiu o seguinte direcionamento de ângulo para essa narrativa:

{{ANALYST_DIRECTION}}

Se houver um direcionamento definido acima, você DEVE priorizar esse ângulo nas 3 opções geradas. Ele sobrepõe preferências genéricas — busque na transcrição e no Núcleo os dados que suportam esse ângulo específico.
Se o campo estiver vazio ou indicar "Sem direcionamento", gere as opções com base no Núcleo e na transcrição normalmente.

═══════════════════════════════
TRANSCRIÇÃO DA CALL DE DIAGNÓSTICO
═══════════════════════════════

A seguir está a transcrição real da call de diagnóstico com o mentorado. Use os trechos mais reveladores — frases espontâneas do cliente, histórias pessoais, momentos de indignação ou clareza — para tornar a narrativa mais autêntica e com a voz real da pessoa:

{{TRANSCRIPTION}}

Use a transcrição para:
- Encontrar a "frase de ouro" do cliente que pode virar crença ou conector
- Identificar o tom de voz e o vocabulário natural da pessoa
- Ancorar a apresentação magnética em algo real que ela disse ou viveu
Se a transcrição estiver vazia, ignore essa seção e use apenas o Núcleo.



═══════════════════════════════
CONTEXTO: ESTRUTURA COMPLETA DE UM REELS VIRAL (MÉTODO AUDIENCE)
═══════════════════════════════

No Método Audience, um Reels viral tem essa estrutura:
HEADLINE → INTENSIFICADOR DO MISTÉRIO → CTA (salva) → CONTEÚDO NOTÁVEL → CTA (compartilha) → CONECTOR DE NARRATIVA → CRENÇA/NARRATIVA → APRESENTAÇÃO MAGNÉTICA → CTA FINAL (me segue)

Você vai gerar APENAS a parte final (do CTA de compartilhamento até o CTA final). Essa parte final funciona como UM ÚNICO BLOCO CONTÍNUO — é uma fala fluida, sem pausas ou separações.

═══════════════════════════════
O QUE É CADA ELEMENTO DO FECHAMENTO
═══════════════════════════════

1. CTA DE COMPARTILHAMENTO — Puxa o público-alvo para o vídeo:
   "Compartilha esse vídeo com todo [público] que você conhece"
   "Manda pra aquele [tipo de pessoa] que precisa ouvir isso"

2. CONECTOR DE NARRATIVA — A ponte entre o conteúdo e a narrativa. Frases que funcionam:
   • "E você precisa entender o seguinte..."
   • "E o que eu preciso que você entenda é..."
   • "Mas antes de sair desse vídeo, entenda uma coisa..."
   O Elias usa MUITO: "Compartilha com todo [público] que você conhece. E você precisa entender o seguinte..."

3. CRENÇA/NARRATIVA — A ideia central que você está vendendo. É a crença combatendo o inimigo e elevando a consciência. Tom de CONVICÇÃO ABSOLUTA, como um líder de movimento. 2-3 frases no máximo.

4. APRESENTAÇÃO MAGNÉTICA — Como o mentorado se apresenta. Existem várias fórmulas (detalhadas abaixo).

5. CTA FINAL — Convite natural para seguir: "Me segue aqui", "Já me segue e acompanha meus próximos conteúdos", "Se faz sentido, me segue"

═══════════════════════════════
AS FÓRMULAS DE APRESENTAÇÃO MAGNÉTICA (direto da imersão do Elias)
═══════════════════════════════

FÓRMULA 1 — DIRETA + BENEFÍCIOS (a mais básica e eficiente):
Nome + Profissão + "estou aqui para [tirar da dor] e [levar pro resultado]"
Os benefícios devem ser TANGÍVEIS E DIMENSIONADOS.

Exemplos reais da imersão:
- Bruno Andrade: "Eu sou o Bruno Andrade, especialista em posicionamento, e eu te ajudo a atrair clientes que te pagam mais, te dão menos trabalho e te dão mais resultado."
- Elias: "Eu sou o Elias Maman, especialista em audiência, e eu estou aqui para te tirar do anonimato e te fazer construir uma audiência que te respeita, confia e compra de você."
- Marcelo Capela: "Eu sou Marcelo Capela, especialista em emagrecimento, e ajudo a secar o seu bucho em casa, sem equipamentos, em 15 dias."
- Leandro Zucchi: "Ajudo donos de negócios presos no operacional a transformar tecnologia em menos custo, mais venda e mais tempo."

Opcionais que podem ser adicionados: quem você ajuda, nome do método, cases/provas.

REGRA ABSOLUTA: NUNCA use "qualidade de vida", "bem-estar", "crescimento pessoal" ou termos genéricos nos benefícios.

FÓRMULA 2 — EMPATIA + DOR (modelo Veridiana):
"Eu sou [Nome] e eu sei que você [descrição VÍVIDA da dor/situação]. Por isso eu estou aqui para te mostrar o caminho para [solução/benefícios]."

Exemplos reais:
- Veridiana: "Meu nome é Veridiana Cavalieri e eu sei que você se sente solitário e exausto por liderar a geração mais rebelde da história. Por isso eu estou aqui para te mostrar o caminho para construir uma equipe que te admira, te respeita e caminha junto com você."
- Elias (adaptação): "Eu sou Elias Maman e eu sei que você é um bom profissional, mas que você está silenciado aqui no Instagram. Eu sei que você estudou pra caramba, mas você não tem voz. Calma que eu vou te ajudar a empacotar o seu conteúdo para construir uma audiência que te respeita, confia e compra de você."
- Cristiane Bonelli (adaptação do Elias): "Eu sou a Cristiane Bonelli e eu sei que você está arrastando um sofrimento dentro de você por muito tempo."

A chave é que a pessoa pense: "caramba, ela está lendo a minha situação".

FÓRMULA 3 — INDIGNAÇÃO FILOSÓFICA:
"Eu sou [Nome], [profissão]. E não faz sentido [problema filosófico]. Se você está comigo nessa, me segue."

Exemplos reais:
- Elias: "Eu sou o Elias Maman, especialista em audiência. E não faz sentido os bons profissionais estarem no anonimato, enquanto os ruins estão assim. Então já me segue se você está comigo nessa."
- Adaptação: "E não faz sentido você ter medo de fazer reposição hormonal se passou a vida inteira tomando anticoncepcional."

═══════════════════════════════
EXEMPLOS COMPLETOS DE BLOCOS DE FECHAMENTO (referência de como tudo flui junto)
═══════════════════════════════

VERIDIANA (bloco completo — o melhor exemplo da imersão):
"Então é muito importante que você compartilhe esse vídeo com todos os líderes que você conhece. E você precisa entender o seguinte: quando você passa a mão na cabeça de um funcionário ruim, você está desrespeitando um bom. Cultura é feita por líderes que têm valores claros e fortes. Meu nome é Veridiana Cavalieri e eu sei que você se sente solitário e exausto por liderar a geração mais rebelde da história. Por isso eu estou aqui para te mostrar o caminho para construir uma equipe que te admira, te respeita e caminha junto com você. Então, já me segue e acompanhe meus próximos conteúdos."

ELIAS (bloco completo):
"Então, compartilha esse vídeo com todo profissional que você conhece. E você precisa entender o seguinte: audiência vale mais que dinheiro. Porque o profissional que tem audiência nunca mais vai depender de algoritmo, de agência ou de indicação. Ele se torna o próprio canal de vendas. Eu sou o Elias Maman, especialista em audiência, e eu estou aqui para te tirar do anonimato e te fazer construir uma audiência que te respeita, confia e compra de você. Me segue aqui."

EXEMPLO COM CRENÇA DO INTESTINO (construído ao vivo na imersão):
"Então, compartilha com toda mulher que você conhece. E você precisa entender o seguinte. Você não é aquilo que você come. Você é o que o seu intestino absorve. E tem muita gente ficando doente comendo bem e suplementando. [apresentação magnética]. Me segue aqui."

Perceba: tudo flui como UMA FALA CONTÍNUA. É como se a pessoa estivesse falando naturalmente, sem parar.

═══════════════════════════════
PRINCÍPIO DA BREVIDADE INTELIGENTE
═══════════════════════════════

Conceito central do Elias: "Se dá pra tirar uma palavra sem perder sentido, tire."

Exemplo da imersão — Leandro Zucchi disse: "transformar tecnologia em resultado real. Menos custo, mais venda e mais tempo."
O Elias cortou "resultado real": "Por que ele está dizendo resultado real se vai dizer depois o que é resultado real? Deletado."
Ficou: "transformar tecnologia em menos custo, mais venda e mais tempo."

Aplique isso em TUDO que você escrever. Cada palavra deve merecer estar ali.

═══════════════════════════════

Aqui está o Núcleo de Influência completo do mentorado:
{{NUCLEO_INFLUENCIA}}

---

Gere 3 OPÇÕES de fechamento de Reels. Cada opção usa uma fórmula de apresentação diferente, mas TODAS devem ser blocos completos e contínuos (CTA compartilhamento → Conector → Crença → Apresentação → CTA final).

### Opção 1 — Direta + Benefícios
[bloco completo como fala contínua — use Fórmula 1]

### Opção 2 — Empatia + Dor
[bloco completo como fala contínua — use Fórmula 2]

### Opção 3 — Indignação Filosófica
[bloco completo como fala contínua — use Fórmula 3]

REGRAS FINAIS:
- Tom HUMANO e CONVERSADO — como se estivesse FALANDO em um Reels, NÃO escrevendo artigo
- Use conectores VARIADOS entre as 3 opções (não repita o mesmo conector)
- A crença/narrativa deve combater o INIMIGO do mentorado e reforçar a SOLUÇÃO
- BREVIDADE INTELIGENTE em tudo — corte toda palavra que não agrega
- Cada bloco deve fazer a pessoa pensar: "eu PRECISO seguir essa pessoa"
- Retorne APENAS as 3 opções. Sem introduções, explicações ou perguntas. Entregue direto.`;

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
