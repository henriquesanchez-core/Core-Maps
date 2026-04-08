import { supabasePublic } from "@/lib/supabase"
import Link from "next/link"
import type { Metadata } from "next"
import type { MapData, TabAudios } from "@/types/map"
import { TAB_IDS } from "@/lib/constants"
import { MapView } from "./MapView"

export const revalidate = 0;

type JsonParseIssue = {
  field: string
  rawValue: string
  fallbackUsed: string
}

function toRawPreview(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function parseJsonField<T>(mapId: string, field: string, rawValue: unknown, fallback: T, fallbackLabel: string): { value: T; issue?: JsonParseIssue } {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { value: fallback }
  }
  if (typeof rawValue !== "string") {
    return { value: rawValue as T }
  }

  try {
    return { value: JSON.parse(rawValue) as T }
  } catch (error) {
    const rawPreview = toRawPreview(rawValue).slice(0, 2000)
    console.error("[MapPage] JSON parse failed", {
      mapId,
      field,
      rawValue: rawPreview,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      value: fallback,
      issue: {
        field,
        rawValue: rawPreview,
        fallbackUsed: fallbackLabel,
      },
    }
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: map } = await supabasePublic.from('maps').select('client_username, client_data, extracted_profile').eq('id', id).single()

  const name = map?.client_data?.fullName || map?.extracted_profile?.nome || map?.client_username || 'Cliente'
  const especialidade = map?.extracted_profile?.especialidade || ''

  return {
    title: `Mapa Estratégico — ${name}`,
    description: especialidade ? `Mapa estratégico de conteúdo para ${name} • ${especialidade}` : `Mapa estratégico de conteúdo personalizado para ${name}`,
    openGraph: {
      title: `Mapa Estratégico — ${name}`,
      description: especialidade ? `Mapa estratégico de conteúdo • ${especialidade}` : `Mapa estratégico de conteúdo personalizado`,
      type: 'website',
    },
  }
}

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: map, error } = await supabasePublic
    .from('maps')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !map) {
    return (
      <div className="min-h-screen bg-[#050507] text-white p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Mapa não encontrado</h2>
        <Link href="/" className="text-[var(--gold)] hover:underline">Voltar ao Início</Link>
      </div>
    )
  }

  // Parse all JSON fields
  const parseIssues: JsonParseIssue[] = []

  const viralTermsResult = parseJsonField<unknown>(
    id,
    "viral_term",
    map.viral_term,
    [],
    "[]"
  )
  if (viralTermsResult.issue) {
    parseIssues.push(viralTermsResult.issue)
  }

  let viralTerms = toStringArray(viralTermsResult.value)
  if (viralTerms.length === 0 && typeof viralTermsResult.value === "string" && viralTermsResult.value.trim()) {
    viralTerms = [viralTermsResult.value.trim()]
  }

  const contentInputsResult = parseJsonField<Record<string, unknown>>(
    id,
    "viral_format",
    map.viral_format,
    {
      __fallback: "invalid_or_missing_viral_format",
      videoExamples: [],
      headlineExamples: [],
      scriptExamples: [],
    },
    "{ __fallback, videoExamples: [], headlineExamples: [], scriptExamples: [] }"
  )
  if (contentInputsResult.issue) {
    parseIssues.push(contentInputsResult.issue)
  }

  const contentInputs = isRecord(contentInputsResult.value)
    ? contentInputsResult.value
    : {
        __fallback: "viral_format_not_object",
        videoExamples: [],
        headlineExamples: [],
        scriptExamples: [],
      }

  const videoExamples: string[] = toStringArray(contentInputs.videoExamples)
  const headlineStructures: string[] = toStringArray(contentInputs.headlineExamples)
  const scriptExamples: string[] = toStringArray(contentInputs.scriptExamples)

  const actionPlanResult = parseJsonField<MapData["action_plan"]>(
    id,
    "action_plan",
    map.action_plan,
    null,
    "null"
  )
  if (actionPlanResult.issue) {
    parseIssues.push(actionPlanResult.issue)
  }

  const actionPlan = actionPlanResult.value

  const mapData: MapData = {
    id: map.id,
    updated_at: map.updated_at || null,
    client_username: map.client_username,
    client_data: map.client_data || { username: map.client_username, fullName: null, profilePicUrl: null },
    references_data: map.references_data || [],
    extracted_profile: map.extracted_profile || null,
    narrative: map.narrative || null,
    viral_terms: viralTerms,
    video_examples: videoExamples,
    headline_structures: headlineStructures,
    script_examples: scriptExamples,
    action_plan: actionPlan,
  }

  // Fetch tab audios + speaker image
  const { data: audioRows } = await supabasePublic.from('tab_audios').select('tab_id, audio_url')
  const tabAudios: TabAudios = {}
  let speakerImage: string | null = null
  for (const row of audioRows || []) {
    if (row.tab_id === TAB_IDS.speaker_image) {
      speakerImage = row.audio_url
    } else {
      tabAudios[row.tab_id] = row.audio_url
    }
  }

  return (
    <div>
      {parseIssues.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <p className="font-semibold">Aviso de integridade do mapa</p>
            <p className="mt-1">
              Alguns campos JSON estavam inválidos para o mapa <span className="font-mono">{id}</span>. Fallback estruturado aplicado.
            </p>
            <ul className="mt-2 list-disc pl-5">
              {parseIssues.map((issue, index) => (
                <li key={`${issue.field}-${index}`}>
                  campo <span className="font-mono">{issue.field}</span> com fallback <span className="font-mono">{issue.fallbackUsed}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <MapView mapData={mapData} tabAudios={tabAudios} speakerImage={speakerImage} />
    </div>
  )
}
