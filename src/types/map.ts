export interface InstagramProfile {
  username: string
  fullName: string | null
  profilePicUrl: string | null
}

export interface ExtractedProfile {
  nome: string
  especialidade: string
  termo_proprio?: string | null
  publico_alvo: string
  nome_audiencia?: string | null
  dor?: string // backward compat
  dor_principal?: string
  inimigo: string
  nome_inimigo?: string | null
  solucoes_alternativas?: string[]
  mentira_crenca_errada?: string | null
  problema_filosofico?: string | null
  solucao?: string | null
  beneficios?: string[]
  desejo: string
  nome_metodo?: string | null
  crencas_centrais?: string[]
  nova_crenca: string
  historia_emocional?: string | null
  provas_cases?: string | null
}

export interface HeadlineExample {
  structure: string
  filled_example: string
}

export interface ViralTermExample {
  viral_term: string
  headline_example: string
}

export interface ScriptElement {
  element_type: string
  structure: string
  modeled_example: string
}

export interface ScriptRewriteAnalyzed {
  elements: ScriptElement[]
}

export type ScriptRewrite = ScriptRewriteAnalyzed | string

export interface ActionPlan {
  headline_examples: HeadlineExample[]
  viral_term_examples: ViralTermExample[]
  script_rewrites: ScriptRewrite[]
  playbook?: string | null
}

export type TabAudios = Record<string, string | null>

export interface MapData {
  id: string
  updated_at: string | null
  client_username: string
  client_data: InstagramProfile
  references_data: InstagramProfile[]
  extracted_profile: ExtractedProfile | null
  narrative: string | null
  viral_terms: string[]
  video_examples: (string | { title: string; url: string })[]
  headline_structures: string[]
  script_examples: string[]
  action_plan: ActionPlan | null
}
