import { supabase } from "@/lib/supabase"
import Link from "next/link"
import type { MapData } from "@/types/map"
import { MapView } from "./MapView"

export const revalidate = 0;

function parseJsonSafe(str: any, fallback: any = null) {
  if (!str) return fallback
  if (typeof str !== 'string') return str
  try { return JSON.parse(str) } catch { return fallback }
}

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: map, error } = await supabase
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
  const viralTermsRaw = parseJsonSafe(map.viral_term, null)
  const viralTerms: string[] = Array.isArray(viralTermsRaw) ? viralTermsRaw : (map.viral_term ? [map.viral_term] : [])

  const contentInputs = parseJsonSafe(map.viral_format, {})
  const videoExamples: string[] = contentInputs?.videoExamples || []
  const headlineStructures: string[] = contentInputs?.headlineExamples || []
  const scriptExamples: string[] = contentInputs?.scriptExamples || []

  const actionPlan = parseJsonSafe(map.action_plan, null)

  const mapData: MapData = {
    id: map.id,
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

  return <MapView mapData={mapData} />
}
