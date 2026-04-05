import { supabase } from "@/lib/supabase"
import { GenerationForm } from "@/components/GenerationForm"
import { Map, Zap } from "lucide-react"
import Link from "next/link"

export const revalidate = 0; // Disable cache so Dashboard loads freshest.

export default async function Home() {
  const { data: maps } = await supabase
    .from('maps')
    .select('id, client_username, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

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

          <GenerationForm />
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-100">
              <Zap className="w-5 h-5 text-yellow-500" />
              Últimos Mapas
            </h3>
            
            <div className="space-y-3">
              {maps?.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">Nenhum mapa gerado ainda.</p>
              )}
              {maps?.map((m) => (
                <Link key={m.id} href={`/maps/${m.id}`}>
                  <div className="group bg-zinc-950 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-xl p-4 transition-all hover:border-blue-500/30 cursor-pointer mb-2">
                    <p className="font-medium text-zinc-200 flex items-center gap-2">
                      <Map className="w-4 h-4 text-purple-400" />
                      @{m.client_username}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}  - {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
