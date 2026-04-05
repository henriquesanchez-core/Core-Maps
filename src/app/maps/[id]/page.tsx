import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ArrowLeft, User, Flame, ExternalLink } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const revalidate = 0;

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

  const profile = map.extracted_profile || {}
  const clientData = map.client_data || {}
  const referencesData = map.references_data || []

  const nucleoFields = [
    { label: "Especialidade", value: profile.especialidade, color: "text-white" },
    { label: "Público Alvo", value: profile.publico_alvo, color: "text-white" },
    { label: "Dor que Resolve", value: profile.dor, color: "text-white" },
    { label: "Inimigo Comum", value: profile.inimigo, color: "text-red-400" },
    { label: "Desejo / Transformação", value: profile.desejo, color: "text-emerald-400" },
    { label: "Nova Crença", value: profile.nova_crenca, color: "text-[var(--gold-light)]" },
  ]

  let sectionIndex = 0;

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[var(--gold)]/20">
      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--gold)]/[0.03] blur-[150px] rounded-full glow-ambient" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] blur-[150px] rounded-full glow-ambient" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <span className="text-zinc-600 text-xs tracking-widest uppercase">Mapa Estratégico</span>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 space-y-20">

        {/* ── HERO: Client Profile ── */}
        <section className="flex flex-col items-center text-center space-y-6 animate-fade-up">
          {/* Profile Photo with animated ring */}
          <div className="profile-ring w-[120px] h-[120px]">
            {clientData.profilePicUrl ? (
              <img
                src={clientData.profilePicUrl}
                alt={clientData.fullName || map.client_username}
                className="relative z-10 w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="relative z-10 w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                <User className="w-10 h-10 text-zinc-600" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              {clientData.fullName || profile.nome || map.client_username}
            </h1>
            <p className="text-zinc-500 font-mono text-sm">@{map.client_username}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--gold)]/40" />
            <span className="gold-shimmer text-sm font-semibold tracking-[0.2em] uppercase">
              Mapa Estratégico Personalizado
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--gold)]/40" />
          </div>
        </section>

        {/* ── SECTION: Núcleo de Influência ── */}
        <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-8">
            <span className="section-number">{++sectionIndex}</span>
            <h2 className="text-xl font-bold text-white tracking-tight">Núcleo de Influência</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="premium-border rounded-2xl">
            <div className="bg-[#0a0a0f] rounded-2xl p-8 space-y-6">
              {/* Nome destaque */}
              {profile.nome && (
                <div className="text-center pb-6 border-b border-white/[0.06]">
                  <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Nome</p>
                  <p className="text-2xl font-bold gold-shimmer">{profile.nome}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nucleoFields.map((field, i) => (
                  <div key={i} className="group">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-semibold mb-1.5">
                      {field.label}
                    </p>
                    <p className={`text-[15px] leading-relaxed font-medium ${field.color}`}>
                      {field.value || <span className="text-zinc-700 italic">Não informado</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Referências ── */}
        {referencesData.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Referências</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {referencesData.map((ref: any, i: number) => (
                <a
                  key={i}
                  href={`https://instagram.com/${ref.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[var(--gold)]/30 rounded-xl p-5 transition-all duration-300"
                >
                  {ref.profilePicUrl ? (
                    <img
                      src={ref.profilePicUrl}
                      alt={ref.fullName || ref.username}
                      className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-white/10 group-hover:ring-[var(--gold)]/30 transition-all"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                      <User className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {ref.fullName && (
                      <p className="text-sm font-semibold text-white truncate">{ref.fullName}</p>
                    )}
                    <p className="text-sm text-zinc-500 font-mono truncate">@{ref.username}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-[var(--gold)] transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION: Termos Virais ── */}
        {map.viral_term && (
          <section className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Termos Virais</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <Flame className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-lg text-zinc-200 leading-relaxed font-medium">{map.viral_term}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION: Narrativa Magnética ── */}
        {map.narrative && (
          <section className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Narrativa Magnética</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 md:p-10">
              <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {map.narrative}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="pt-12 border-t border-white/[0.04] text-center">
          <p className="text-zinc-700 text-xs tracking-widest uppercase">
            Gerado exclusivamente para @{map.client_username}
          </p>
        </footer>
      </main>
    </div>
  )
}
