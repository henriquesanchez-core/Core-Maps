export const TAB_IDS = {
  nucleo: 'nucleo',
  virais: 'virais',
  referencias: 'referencias',
  headlines: 'headlines',
  roteiro: 'roteiro',
  playbook: 'playbook',
  speaker_image: 'speaker_image',
} as const

export type TabId = (typeof TAB_IDS)[keyof typeof TAB_IDS]

export const MAP_TAB_IDS = [
  TAB_IDS.nucleo,
  TAB_IDS.virais,
  TAB_IDS.referencias,
  TAB_IDS.headlines,
  TAB_IDS.roteiro,
  TAB_IDS.playbook,
] as const

export type MapTabId = (typeof MAP_TAB_IDS)[number]

export const ALL_TAB_IDS = [...MAP_TAB_IDS, TAB_IDS.speaker_image] as const

export const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB
export const LOGIN_MAX_ATTEMPTS_PER_WINDOW = 5
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const LOGIN_MIN_RESPONSE_DELAY_MS = 200

// Generate form input limits — shared by frontend (TagInput) and backend (Zod/normalize)
export const LIMITS = {
  viralTerms: { maxItems: 100, maxChars: 500 },
  headlineExamples: { maxItems: 100, maxChars: 500 },
  scriptExamples: { maxItems: 50, maxChars: 30000 },
  videoExamples: { maxItems: 100 },
  transcription: { maxChars: 100000 },
  analystDirection: { maxChars: 10000 },
  referenceProfiles: { maxChars: 10000 },
} as const
