"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, User, Flame, ExternalLink, Play, Type, FileText,
  Save, Loader2, CalendarDays, Target,
  Users, Sparkles, Share2, Check,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type {
  MapData,
  HeadlineExample,
  ViralTermExample,
  TabAudios,
  ScriptRewrite,
  ScriptRewriteAnalyzed,
} from "@/types/map"
import { TAB_IDS, type MapTabId } from "@/lib/constants"
import { EditableField } from "./EditableField"
import { EditableScript } from "./EditableScript"

const TABS = [
  { id: TAB_IDS.nucleo, label: "Núcleo", icon: Target },
  { id: TAB_IDS.virais, label: "Termos Virais", icon: Flame },
  { id: TAB_IDS.referencias, label: "Referências", icon: Users },
  { id: TAB_IDS.headlines, label: "Headlines", icon: Type },
  { id: TAB_IDS.roteiro, label: "Roteiro", icon: FileText },
  { id: TAB_IDS.playbook, label: "Próximos Passos", icon: CalendarDays },
] as const

const TAB_AUDIO_LABELS: Record<MapTabId, string> = {
  [TAB_IDS.nucleo]: "Núcleo de Influência",
  [TAB_IDS.virais]: "Termos Virais",
  [TAB_IDS.referencias]: "Referências Estratégicas",
  [TAB_IDS.headlines]: "Estruturas de Headline",
  [TAB_IDS.roteiro]: "Estruturas de Roteiro",
  [TAB_IDS.playbook]: "Seu Playbook de 15 Dias",
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function isAnalyzedScriptRewrite(script: unknown): script is ScriptRewriteAnalyzed {
  if (!script || typeof script !== "object") return false
  return "elements" in script && Array.isArray((script as ScriptRewriteAnalyzed).elements)
}

function TabAudioPlayer({ url, tabId, image }: { url: string; tabId: MapTabId; image?: string | null }) {
  const label = TAB_AUDIO_LABELS[tabId] || "esta seção"
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => setPlaying(false)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnd)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause() } else { audio.play() }
    setPlaying(!playing)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="mb-8 rounded-2xl border border-[var(--gold)]/20 bg-gradient-to-br from-[#1a1a1f] to-[#0f0f13] p-4 sm:p-5">
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Image */}
        {image ? (
          <img
            src={image}
            alt="Elias Maman"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 shadow-lg"
          />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-xl font-bold text-zinc-950">E</span>
          </div>
        )}

        {/* Right side */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Title */}
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-white leading-tight truncate">
              Explicação do Elias sobre {label}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Elias Maman</p>
          </div>

          {/* Controls + progress */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer"
            >
              {playing ? (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <rect x="0" y="0" width="4" height="14" rx="1" fill="#050507" />
                  <rect x="8" y="0" width="4" height="14" rx="1" fill="#050507" />
                </svg>
              ) : (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <path d="M0 1.5C0 0.7 0.8 0.2 1.5 0.6L11.5 6.1C12.2 6.5 12.2 7.5 11.5 7.9L1.5 13.4C0.8 13.8 0 13.3 0 12.5V1.5Z" fill="#050507" />
                </svg>
              )}
            </button>

            {/* Time + bar */}
            <div className="flex-1 min-w-0 space-y-1">
              <div
                className="h-1.5 bg-zinc-800 rounded-full cursor-pointer group relative"
                onClick={seek}
              >
                <div
                  className="h-full bg-[var(--gold)] rounded-full relative transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{duration ? formatTime(duration) : "0:00"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MapView({ mapData, tabAudios = {}, speakerImage }: { mapData: MapData; tabAudios?: TabAudios; speakerImage?: string | null }) {
  const searchParams = useSearchParams()
  const viewOnly = searchParams.get("v") === "1"

  const [activeTab, setActiveTab] = useState<MapTabId>(TAB_IDS.nucleo)
  const [headlineExamples, setHeadlineExamples] = useState<HeadlineExample[]>(
    mapData.action_plan?.headline_examples ?? []
  )
  const [viralTermExamples, setViralTermExamples] = useState<ViralTermExample[]>(
    mapData.action_plan?.viral_term_examples ?? []
  )
  const [scriptRewrites, setScriptRewrites] = useState<ScriptRewrite[]>(
    mapData.action_plan?.script_rewrites ?? []
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [clientUpdatedAt, setClientUpdatedAt] = useState<string | null>(mapData.updated_at)

  function copyLink() {
    const url = new URL(window.location.href)
    url.searchParams.set("v", "1")
    navigator.clipboard.writeText(url.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const profile = mapData.extracted_profile
  const beneficios = profile?.beneficios ?? []
  const crencasCentrais = profile?.crencas_centrais ?? []
  const solucoesAlternativas = profile?.solucoes_alternativas ?? []
  const nucleoFields = profile ? [
    { label: "Especialidade", value: profile.termo_proprio || profile.especialidade, color: "text-white" },
    { label: "Público Alvo", value: profile.publico_alvo, color: "text-white" },
    { label: "Dor que Resolve", value: profile.dor_principal || profile.dor, color: "text-white" },
    { label: "Inimigo Comum", value: profile.nome_inimigo ? `${profile.inimigo} ("${profile.nome_inimigo}")` : profile.inimigo, color: "text-red-400" },
    profile.solucao ? { label: "Solução", value: profile.solucao, color: "text-emerald-400" } : null,
    beneficios.length > 0 ? { label: "Benefícios", value: beneficios.join(" • "), color: "text-emerald-400" } : null,
    { label: "Desejo / Transformação", value: profile.desejo, color: "text-emerald-400" },
    profile.mentira_crenca_errada ? { label: "Mentira que o Público Acredita", value: profile.mentira_crenca_errada, color: "text-orange-400" } : null,
    profile.problema_filosofico ? { label: "Indignação", value: profile.problema_filosofico, color: "text-orange-400" } : null,
    { label: "Nova Crença", value: profile.nova_crenca, color: "text-[var(--gold-light)]" },
    crencasCentrais.length > 0 ? { label: "Crenças Centrais", value: crencasCentrais.join(" | "), color: "text-[var(--gold-light)]" } : null,
    profile.nome_metodo ? { label: "Método", value: profile.nome_metodo, color: "text-[var(--gold)]" } : null,
    solucoesAlternativas.length > 0 ? { label: "O que já tentaram", value: solucoesAlternativas.join("; "), color: "text-zinc-400" } : null,
    profile.provas_cases ? { label: "Provas / Cases", value: profile.provas_cases, color: "text-zinc-400" } : null,
  ].filter(Boolean) as { label: string; value: string; color: string }[] : []

  const nucleoAudio = tabAudios[TAB_IDS.nucleo]
  const viraisAudio = tabAudios[TAB_IDS.virais]
  const referenciasAudio = tabAudios[TAB_IDS.referencias]
  const headlinesAudio = tabAudios[TAB_IDS.headlines]
  const roteiroAudio = tabAudios[TAB_IDS.roteiro]
  const playbookAudio = tabAudios[TAB_IDS.playbook]

  const save = useCallback(async () => {
    if (!clientUpdatedAt) {
      setConflictError(false)
      setSaveError("Não foi possível validar a versão do mapa. Recarregue a página e tente novamente.")
      return
    }

    setSaving(true)
    setConflictError(false)
    setSaveError(null)
    try {
      const response = await fetch(`/api/maps/${mapData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_updated_at: clientUpdatedAt,
          action_plan: {
            headline_examples: headlineExamples,
            viral_term_examples: viralTermExamples,
            script_rewrites: scriptRewrites,
            playbook: mapData.action_plan?.playbook || null,
          },
        }),
      })

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => null) as { error?: string } | null

        if (response.status === 409) {
          setConflictError(true)
          setSaveError("Este mapa foi editado em outra sessão. Recarregue para atualizar antes de salvar novamente.")
        } else if (response.status === 404) {
          setSaveError("Mapa não encontrado. Recarregue a página.")
        } else {
          setSaveError(payload?.error || "Falha ao salvar alterações.")
        }
        return
      }

      const payload = await response
        .json()
        .catch(() => null) as { map?: { updated_at?: string | null } } | null

      if (payload?.map?.updated_at) {
        setClientUpdatedAt(payload.map.updated_at)
      }

      setDirty(false)
    } catch (err) {
      console.error("Failed to save:", err)
      setSaveError("Erro de conexão ao salvar. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }, [headlineExamples, viralTermExamples, scriptRewrites, mapData.id, mapData.action_plan?.playbook, clientUpdatedAt])

  function updateHeadline(index: number, newValue: string) {
    const updated = [...headlineExamples]
    updated[index] = { ...updated[index], filled_example: newValue }
    setHeadlineExamples(updated)
    setDirty(true)
  }

  function updateViralTerm(index: number, newValue: string) {
    const updated = [...viralTermExamples]
    updated[index] = { ...updated[index], headline_example: newValue }
    setViralTermExamples(updated)
    setDirty(true)
  }

  function updateScriptRewrite(index: number, newValue: string) {
    const updated = [...scriptRewrites]
    if (typeof updated[index] !== "string") return
    updated[index] = newValue
    setScriptRewrites(updated)
    setDirty(true)
  }

  function updateScriptElementField(
    scriptIndex: number,
    elementIndex: number,
    field: "modeled_example" | "structure",
    newValue: string
  ) {
    const updated = [...scriptRewrites]
    const script = updated[scriptIndex]
    if (!script || typeof script === "string" || !isAnalyzedScriptRewrite(script)) return
    const elements = [...script.elements]
    elements[elementIndex] = { ...elements[elementIndex], [field]: newValue }
    updated[scriptIndex] = { ...script, elements }
    setScriptRewrites(updated)
    setDirty(true)
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[var(--gold)]/20">
      <div className="noise-overlay" />

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--gold)]/[0.03] blur-[150px] rounded-full glow-ambient" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] blur-[150px] rounded-full glow-ambient" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header with profile + back */}
      <header className="sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
          {!viewOnly && (
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors shrink-0 no-print">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {mapData.client_data.profilePicUrl ? (
              <img
                src={mapData.client_data.profilePicUrl}
                alt={mapData.client_data.fullName || mapData.client_username}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--gold)]/30 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center ring-1 ring-white/10 shrink-0">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {mapData.client_data.fullName || profile?.nome || mapData.client_username}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">@{mapData.client_username}</p>
            </div>
          </div>

          {!viewOnly && (
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-[var(--gold)] transition-colors shrink-0 no-print cursor-pointer"
              title="Copiar link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Compartilhar</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[57px] z-40 bg-[#050507]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer shrink-0
                    ${isActive
                      ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ TAB: Núcleo de Influência ═══ */}
        {activeTab === TAB_IDS.nucleo && (
          <div className="space-y-12 animate-fade-up">
            {typeof nucleoAudio === "string" && (
              <TabAudioPlayer url={nucleoAudio} tabId={TAB_IDS.nucleo} image={speakerImage} />
            )}
            {/* Núcleo de Influência */}
            {profile && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                  Núcleo de Influência
                </h2>

                <div className="premium-border rounded-2xl">
                  <div className="bg-[#0a0a0f] rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
                    {profile.nome && (
                      <div className="text-center pb-6 border-b border-white/[0.06]">
                        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Nome</p>
                        <p className="text-2xl font-bold gold-shimmer">{profile.nome}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {nucleoFields.map((field, i) => (
                        <div key={i}>
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
            )}

            {/* Narrativa Magnética */}
            {mapData.narrative && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Target className="w-5 h-5 text-[var(--gold)]" />
                  Narrativa Magnética
                </h2>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-8 md:p-10">
                  <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed text-sm sm:text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {mapData.narrative.replace(/(Qual|E qual) d(ess|est)as.*?(\?|!)/gi, '').trim()}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══ TAB: Termos Virais ═══ */}
        {activeTab === TAB_IDS.virais && (
          <div className="space-y-10 animate-fade-up">
            {typeof viraisAudio === "string" && (
              <TabAudioPlayer url={viraisAudio} tabId={TAB_IDS.virais} image={speakerImage} />
            )}
            {/* Termos Virais */}
            {(mapData.viral_terms.length > 0 || viralTermExamples.length > 0) ? (
              <>
                <section>
                  <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Termos Virais
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {mapData.viral_terms.map((term, i) => (
                      <span key={i} className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full px-5 py-2.5 text-sm font-medium">
                        <Flame className="w-3.5 h-3.5" />
                        {term}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Exemplos de como usar */}
                {viralTermExamples.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                      Exemplos de Como Usar
                    </h2>
                    <div className="space-y-4">
                      {viralTermExamples.map((item, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 space-y-3">
                          <div>
                            <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-1.5">Termo Viral</p>
                            <span className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full px-4 py-1.5 text-sm font-medium">
                              <Flame className="w-3.5 h-3.5" />
                              {item.viral_term}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] text-[var(--gold)] uppercase tracking-widest mb-1.5">Exemplo de como aplicar na headline</p>
                            {viewOnly ? (
                              <p className="text-sm text-zinc-100 font-medium">{item.headline_example}</p>
                            ) : (
                              <EditableField
                                value={item.headline_example}
                                onChange={(val) => updateViralTerm(i, val)}
                                className="text-sm text-zinc-100 font-medium"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Flame className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Nenhum termo viral cadastrado</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Referências ═══ */}
        {activeTab === TAB_IDS.referencias && (
          <div className="space-y-10 animate-fade-up">
            {typeof referenciasAudio === "string" && (
              <TabAudioPlayer
                url={referenciasAudio}
                tabId={TAB_IDS.referencias}
                image={speakerImage}
              />
            )}
            {/* Perfis de Referência */}
            {mapData.references_data.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Users className="w-5 h-5 text-[var(--gold)]" />
                  Perfis para Modelar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mapData.references_data.map((ref, i) => (
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

            {/* Vídeos de Referência */}
            {mapData.video_examples.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Play className="w-5 h-5 text-purple-400" />
                  Vídeos de Referência
                </h2>
                <div className="space-y-3">
                  {mapData.video_examples.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[var(--gold)]/30 rounded-xl p-4 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Play className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-sm text-zinc-300 font-mono truncate flex-1">{url}</p>
                      <ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-[var(--gold)] transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {mapData.references_data.length === 0 && mapData.video_examples.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Nenhuma referência cadastrada</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Headlines ═══ */}
        {activeTab === TAB_IDS.headlines && (
          <div className="space-y-10 animate-fade-up">
            {typeof headlinesAudio === "string" && (
              <TabAudioPlayer url={headlinesAudio} tabId={TAB_IDS.headlines} image={speakerImage} />
            )}
            {headlineExamples.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-400" />
                  Estruturas de Headline
                </h2>
                <div className="space-y-5">
                  {headlineExamples.map((item, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="section-number">{i + 1}</div>
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Estrutura</span>
                      </div>
                      <p className="text-base sm:text-lg text-white font-semibold leading-relaxed mb-4">
                        {item.structure}
                      </p>
                      <div className="border-t border-white/[0.06] pt-3">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">Exemplo aplicado</p>
                        {viewOnly ? (
                          <p className="text-sm text-zinc-400 italic">{item.filled_example}</p>
                        ) : (
                          <EditableField
                            value={item.filled_example}
                            onChange={(val) => updateHeadline(i, val)}
                            className="text-sm text-zinc-400 italic"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : mapData.headline_structures.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-400" />
                  Estruturas de Headline
                </h2>
                <div className="space-y-5">
                  {mapData.headline_structures.map((headline, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="section-number">{i + 1}</div>
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Estrutura</span>
                      </div>
                      <p className="text-base sm:text-lg text-white font-semibold leading-relaxed">
                        {headline}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-16">
                <Type className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Nenhuma headline cadastrada</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Roteiro ═══ */}
        {activeTab === TAB_IDS.roteiro && (
          <div className="space-y-10 animate-fade-up">
            {typeof roteiroAudio === "string" && (
              <TabAudioPlayer url={roteiroAudio} tabId={TAB_IDS.roteiro} image={speakerImage} />
            )}
            {scriptRewrites.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Estrutura de Roteiro com Exemplo
                </h2>
                <div className="space-y-6">
                  {scriptRewrites.map((script, i) => {
                    if (typeof script === "string") {
                      return (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="section-number">{i + 1}</div>
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Roteiro</span>
                          </div>
                          {viewOnly ? (
                            <p className="text-sm text-zinc-300 leading-[1.8] whitespace-pre-wrap">{script}</p>
                          ) : (
                            <EditableScript
                              value={script}
                              onChange={(val) => updateScriptRewrite(i, val)}
                            />
                          )}
                        </div>
                      )
                    }

                    return (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-6">
                        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
                          <div className="section-number">{i + 1}</div>
                          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Roteiro</span>
                        </div>
                        <div className="space-y-6">
                          {script.elements.map((el, j) => (
                            <div key={j}>
                              <p className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest mb-1.5">
                                {el.element_type || "Elemento"}
                              </p>
                              <p className="text-[11px] text-zinc-600 italic mb-2.5 pb-2.5 border-b border-white/[0.05]">
                                {el.structure || "—"}
                              </p>
                              {viewOnly ? (
                                <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                                  {el.modeled_example || "—"}
                                </p>
                              ) : (
                                <EditableField
                                  value={el.modeled_example}
                                  onChange={(val) => updateScriptElementField(i, j, "modeled_example", val)}
                                  className="text-sm text-zinc-200 leading-relaxed font-medium"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Nenhum roteiro cadastrado</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Próximos Passos (Playbook) ═══ */}
        {activeTab === TAB_IDS.playbook && (
          <div className="animate-fade-up">
            {typeof playbookAudio === "string" && (
              <TabAudioPlayer url={playbookAudio} tabId={TAB_IDS.playbook} image={speakerImage} />
            )}
            {mapData.action_plan?.playbook ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-[var(--gold)]" />
                  Playbook de 15 Dias
                </h2>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-4 border-b border-white/[0.06]">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Seu planejamento personalizado</p>
                      <p className="text-xs text-zinc-500">Siga este playbook dia a dia para máximo resultado</p>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed text-sm sm:text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {mapData.action_plan.playbook}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            ) : (
              <div className="text-center py-16">
                <CalendarDays className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Playbook não gerado</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating save button */}
      {!viewOnly && saveError && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-50 rounded-xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-100 shadow-lg">
          <p>{saveError}</p>
          {conflictError && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center rounded-md border border-red-300/50 px-3 py-1.5 text-xs font-semibold text-red-50 hover:bg-red-900/60 transition-colors cursor-pointer"
            >
              Recarregar mapa
            </button>
          )}
        </div>
      )}

      {dirty && !viewOnly && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50">
          <button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      )}
    </div>
  )
}
