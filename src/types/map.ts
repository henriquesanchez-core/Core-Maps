export interface InstagramProfile {
  username: string
  fullName: string | null
  profilePicUrl: string | null
}

export interface ExtractedProfile {
  nome: string
  especialidade: string
  publico_alvo: string
  dor: string
  inimigo: string
  desejo: string
  nova_crenca: string
}

export interface HeadlineExample {
  structure: string
  filled_example: string
}

export interface ViralTermExample {
  viral_term: string
  headline_example: string
}

export interface ActionPlan {
  headline_examples: HeadlineExample[]
  viral_term_examples: ViralTermExample[]
  script_rewrites: string[]
}

export interface MapData {
  id: string
  client_username: string
  client_data: InstagramProfile
  references_data: InstagramProfile[]
  extracted_profile: ExtractedProfile | null
  narrative: string | null
  viral_terms: string[]
  video_examples: string[]
  headline_structures: string[]
  script_examples: string[]
  action_plan: ActionPlan | null
}
