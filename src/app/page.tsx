import { supabasePublic } from "@/lib/supabase"
import { GenerationForm, type FormInitialValues } from "@/components/GenerationForm"
import { MapSidebar } from "@/components/MapSidebar"
import { Settings } from "lucide-react"
import Link from "next/link"

export const revalidate = 0;

function safeJsonParse(value: unknown): any {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return null
  try { return JSON.parse(value) } catch { return null }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

export default async function Home({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams
  const fromMapId = params.from

  const [{ data: maps }, { data: folders }] = await Promise.all([
    supabasePublic
      .from('maps')
      .select('id, client_username, name, folder_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabasePublic
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true }),
  ])

  // Build initialValues if duplicating from an existing map
  let initialValues: FormInitialValues | undefined
  if (fromMapId) {
    const { data: sourceMap } = await supabasePublic
      .from('maps')
      .select('client_username, reference_profiles, transcription, analyst_direction, viral_term, viral_format')
      .eq('id', fromMapId)
      .maybeSingle()

    if (sourceMap) {
      const viralTerms = toStringArray(safeJsonParse(sourceMap.viral_term))
      const viralFormat = safeJsonParse(sourceMap.viral_format)

      const videoExamples = Array.isArray(viralFormat?.videoExamples)
        ? viralFormat.videoExamples.map((v: any) => {
            if (typeof v === 'string') return { title: v, url: v }
            if (v && typeof v === 'object' && v.url) return { title: v.title || v.url, url: v.url }
            return null
          }).filter(Boolean)
        : []

      initialValues = {
        clientUsername: sourceMap.client_username || "",
        referenceProfiles: sourceMap.reference_profiles || "",
        transcription: sourceMap.transcription || "",
        analystDirection: sourceMap.analyst_direction || "",
        viralTerms,
        videoExamples,
        headlineExamples: toStringArray(viralFormat?.headlineExamples),
        scriptExamples: toStringArray(viralFormat?.scriptExamples),
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <header>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              CoreMaps Copilot
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Painel Diário para Estrategistas da Equipe.
            </p>
          </header>

          <div className="flex gap-3">
            <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-2 transition-colors">
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
          </div>

          <GenerationForm initialValues={initialValues} />
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-80 flex flex-col gap-6">
          <MapSidebar
            initialMaps={maps ?? []}
            initialFolders={folders ?? []}
          />
        </aside>

      </div>
    </div>
  )
}
