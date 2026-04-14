import { supabasePublic } from "@/lib/supabase"
import { GenerationForm } from "@/components/GenerationForm"
import { MapSidebar } from "@/components/MapSidebar"
import { Settings } from "lucide-react"
import Link from "next/link"

export const revalidate = 0;

export default async function Home() {
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

          <GenerationForm />
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
