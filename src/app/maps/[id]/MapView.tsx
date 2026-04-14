"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, User, Flame, ExternalLink, Play, Type, FileText,
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

// ───────────────────────────────────────────────
// Map Intro Screen (shown to clients on ?v=1)
// ───────────────────────────────────────────────
function MapIntroScreen({
  mapData,
  onEnter,
}: {
  mapData: MapData
  onEnter: () => void
}) {
  const profile = mapData.extracted_profile
  const name = mapData.client_data?.fullName || profile?.nome || `@${mapData.client_username}`
  const especialidade = mapData.client_data?.fullName
    ? (profile?.especialidade || "")
    : (profile?.especialidade || "")
  const avatarUrl = mapData.client_data?.profilePicUrl || null

  return (
    <div className="fixed inset-0 z-[100] bg-[#050507] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[var(--gold)]/[0.04] blur-[180px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.03] blur-[140px] rounded-full" />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">
        {/* Badge */}
        <div
          className="intro-reveal"
          style={{ animationDelay: "0ms" }}
        >
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--gold)] border border-[var(--gold)]/30 rounded-full px-4 py-1.5 bg-[var(--gold)]/5">
            <Sparkles className="w-3 h-3" />
            Mapa Estratégico Personalizado
          </span>
        </div>

        {/* Avatar */}
        <div
          className="intro-reveal intro-float"
          style={{ animationDelay: "100ms" }}
        >
          <div className="profile-ring">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-[#050507]"
              />
            ) : (
              <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center ring-4 ring-[#050507]">
                <span className="text-3xl font-bold text-zinc-950">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name + Specialty */}
        <div
          className="intro-reveal space-y-1"
          style={{ animationDelay: "250ms" }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold gold-shimmer leading-tight">{name}</h1>
          {especialidade && (
            <p className="text-zinc-500 text-sm sm:text-base">{especialidade}</p>
          )}
        </div>

        {/* Divider */}
        <div
          className="intro-reveal w-16 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent"
          style={{ animationDelay: "350ms" }}
        />

        {/* Subtitle */}
        <div
          className="intro-reveal"
          style={{ animationDelay: "450ms" }}
        >
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-sm">
            Seja bem-vindo à sua jornada para{" "}
            <span className="text-white font-semibold">sair do anonimato</span>{" "}
            e se tornar{" "}
            <span className="text-[var(--gold-light)] font-semibold">autoridade dentro do seu nicho</span>.
          </p>
        </div>

        {/* CTA Button */}
        <div
          className="intro-reveal"
          style={{ animationDelay: "600ms" }}
        >
          <button
            autoFocus
            onClick={onEnter}
            className="group mt-2 flex items-center gap-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] hover:from-[var(--gold)] hover:to-[var(--gold-light)] text-zinc-950 font-bold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-[var(--gold)]/20 hover:shadow-[var(--gold)]/40 transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            Iniciar Jornada
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

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

function EditableMarkdown({ value, onChange, minHeight = "200px" }: { value: string; onChange: (v: string) => void; minHeight?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full bg-white/5 border border-[var(--gold)]/30 text-zinc-300 leading-relaxed text-sm sm:text-base rounded-lg p-4 focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          style={{ minHeight }}
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={save} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
            <Check className="w-3.5 h-3.5" /> Confirmar
          </button>
          <button onClick={() => { setDraft(value); setEditing(false) }} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 cursor-pointer transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-loose text-base">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {value}
        </ReactMarkdown>
      </div>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-all no-print"
      >
        Editar
      </button>
    </div>
  )
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
                className="h-1.5 bg-zinc-800 rounded-full cursor-pointer group relative py-2 -my-2"
                onClick={seek}
              >
                <div className="h-1.5 bg-zinc-800 rounded-full relative overflow-visible">
                  <div
                    className="h-full bg-[var(--gold)] rounded-full relative transition-all"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="audio-thumb absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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

  // ── Intro screen state (only for client-shared links) ──
  const introKey = `map_intro_seen_${mapData.id}`
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    if (viewOnly && !sessionStorage.getItem(introKey)) {
      setShowIntro(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnterMap() {
    sessionStorage.setItem(introKey, "1")
    setShowIntro(false)
    window.scrollTo({ top: 0, behavior: "instant" })
  }

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

  function copyLink() {
    const url = new URL(window.location.href)
    url.searchParams.set("v", "1")
    navigator.clipboard.writeText(url.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const profile = mapData.extracted_profile

  // Hide empty tabs in viewOnly mode
  const visibleTabs = viewOnly
    ? TABS.filter((tab) => {
        if (tab.id === TAB_IDS.nucleo) return !!profile
        if (tab.id === TAB_IDS.virais) return (mapData.viral_terms.length > 0 || (mapData.action_plan?.viral_term_examples ?? []).length > 0)
        if (tab.id === TAB_IDS.referencias) return (mapData.references_data.length > 0 || mapData.video_examples.length > 0)
        if (tab.id === TAB_IDS.headlines) return ((mapData.action_plan?.headline_examples ?? []).length > 0 || mapData.headline_structures.length > 0)
        if (tab.id === TAB_IDS.roteiro) return (mapData.action_plan?.script_rewrites ?? []).length > 0
        if (tab.id === TAB_IDS.playbook) return !!mapData.action_plan?.playbook
        return true
      })
    : [...TABS]

  const [editedProfile, setEditedProfile] = useState(() => profile ? { ...profile } : null)
  const [editedNarrative, setEditedNarrative] = useState(mapData.narrative || "")
  const [editedPlaybook, setEditedPlaybook] = useState(mapData.action_plan?.playbook || "")

  function updateProfileField(key: string, value: string) {
    if (!editedProfile) return
    setEditedProfile({ ...editedProfile, [key]: value })
    setDirty(true)
  }

  const nucleoGridFields = editedProfile ? [
    { label: "Especialidade", key: "especialidade", value: editedProfile.especialidade || "", color: "text-white", multiline: false },
    { label: "Público Alvo", key: "publico_alvo", value: editedProfile.publico_alvo || "", color: "text-white", multiline: false },
    { label: "Dor que Resolve", key: "dor_principal", value: editedProfile.dor_principal || editedProfile.dor || "", color: "text-white", multiline: true },
    { label: "Inimigo Comum", key: "inimigo", value: editedProfile.inimigo || "", color: "text-red-400", multiline: true },
    { label: "Solução", key: "solucao", value: editedProfile.solucao || "", color: "text-emerald-400", multiline: true },
    { label: "Desejo / Transformação", key: "desejo", value: editedProfile.desejo || "", color: "text-emerald-400", multiline: true },
  ] : []

  const nucleoHighlight = editedProfile ? {
    label: "Nova Crença", key: "nova_crenca", value: editedProfile.nova_crenca || "", color: "text-[var(--gold-light)]", multiline: true,
  } : null

  const nucleoAudio = tabAudios[TAB_IDS.nucleo]
  const viraisAudio = tabAudios[TAB_IDS.virais]
  const referenciasAudio = tabAudios[TAB_IDS.referencias]
  const headlinesAudio = tabAudios[TAB_IDS.headlines]
  const roteiroAudio = tabAudios[TAB_IDS.roteiro]
  const playbookAudio = tabAudios[TAB_IDS.playbook]

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const response = await fetch(`/api/maps/${mapData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_plan: {
            headline_examples: headlineExamples,
            viral_term_examples: viralTermExamples,
            script_rewrites: scriptRewrites,
            playbook: editedPlaybook || null,
          },
          extracted_profile: editedProfile,
          narrative: editedNarrative,
        }),
      })

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => null) as { error?: string } | null

        if (response.status === 404) {
          setSaveError("Mapa não encontrado. Recarregue a página.")
        } else {
          setSaveError(payload?.error || "Falha ao salvar alterações.")
        }
        return
      }

      setDirty(false)
    } catch (err) {
      console.error("Failed to save:", err)
      setSaveError("Erro de conexão ao salvar. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }, [headlineExamples, viralTermExamples, scriptRewrites, mapData.id, editedPlaybook, editedProfile, editedNarrative])

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

  // ── If the intro is active, render it exclusively ──
  // This must be placed AFTER all hooks to prevent React hook violations.
  if (showIntro) {
    return <MapIntroScreen mapData={mapData} onEnter={handleEnterMap} />
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
          <div className="tab-scroll-container">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer shrink-0
                      ${isActive
                        ? "bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 shadow-sm shadow-[var(--gold)]/10"
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
        </div>
      </nav>

      {/* Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ TAB: Núcleo de Influência ═══ */}
        {activeTab === TAB_IDS.nucleo && (
          <div className="space-y-12 tab-content-enter">
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
                    {editedProfile?.nome && (
                      <div className="text-center pb-6 border-b border-white/[0.06]">
                        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Nome</p>
                        {viewOnly ? (
                          <p className="text-2xl font-bold gold-shimmer">{editedProfile.nome}</p>
                        ) : (
                          <EditableField
                            value={editedProfile.nome}
                            onChange={(val) => updateProfileField("nome", val)}
                            className="text-2xl font-bold gold-shimmer justify-center"
                          />
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {nucleoGridFields.map((field, i) => (
                        <div key={i}>
                          <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-2">
                            {field.label}
                          </p>
                          {viewOnly ? (
                            <p className={`text-[15px] leading-relaxed font-normal ${field.color}`}>
                              {field.value || <span className="text-zinc-700 italic">Não informado</span>}
                            </p>
                          ) : (
                            <EditableField
                              value={field.value || ""}
                              onChange={(val) => updateProfileField(field.key, val)}
                              className={`text-[15px] leading-relaxed font-normal ${field.color}`}
                              multiline={field.multiline}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Nova Crença — full width highlight */}
                    {nucleoHighlight && nucleoHighlight.value && (
                      <div className="mt-6 pt-6 border-t border-white/[0.06]">
                        <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-2">
                          {nucleoHighlight.label}
                        </p>
                        {viewOnly ? (
                          <p className="text-lg leading-relaxed font-semibold text-[var(--gold-light)]">
                            &ldquo;{nucleoHighlight.value}&rdquo;
                          </p>
                        ) : (
                          <EditableField
                            value={nucleoHighlight.value}
                            onChange={(val) => updateProfileField(nucleoHighlight.key, val)}
                            className="text-lg leading-relaxed font-semibold text-[var(--gold-light)]"
                            multiline
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Fechamento de Reels — Conector + Apresentação Magnética */}
            {(editedNarrative || mapData.narrative) && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Target className="w-5 h-5 text-[var(--gold)]" />
                  Fechamento de Reels
                </h2>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-8 md:p-10">
                  {!viewOnly ? (
                    <EditableMarkdown
                      value={editedNarrative}
                      onChange={(val) => { setEditedNarrative(val); setDirty(true) }}
                    />
                  ) : (
                    <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-loose text-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {editedNarrative
                          .replace(/## CRENÇAS CENTRAIS[\s\S]*?(?=## CONECTORES|$)/i, '')
                          .replace(/(Qual|E qual) d(ess|est)as.*?(\?|!)/gi, '')
                          .trim()}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══ TAB: Termos Virais ═══ */}
        {activeTab === TAB_IDS.virais && (
          <div className="space-y-12 tab-content-enter">
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
          <div className="space-y-12 tab-content-enter">
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
                  {mapData.video_examples.map((item, i) => {
                    const videoUrl = typeof item === "string" ? item : item.url
                    const videoTitle = typeof item === "string" ? null : item.title
                    return (
                      <a
                        key={i}
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[var(--gold)]/30 rounded-xl p-4 transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {videoTitle && (
                            <p className="text-sm text-zinc-200 font-medium truncate">{videoTitle}</p>
                          )}
                          <p className="text-[11px] text-zinc-500 font-mono truncate">{videoUrl}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-[var(--gold)] transition-colors shrink-0" />
                      </a>
                    )
                  })}
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
          <div className="space-y-12 tab-content-enter">
            {typeof headlinesAudio === "string" && (
              <TabAudioPlayer url={headlinesAudio} tabId={TAB_IDS.headlines} image={speakerImage} />
            )}
            {headlineExamples.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Type className="w-5 h-5 text-[var(--gold)]" />
                  Estruturas de Headline
                </h2>
                <div className="space-y-5">
                  {headlineExamples.map((item, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 sm:p-6">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="section-number">{i + 1}</div>
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Headline</span>
                      </div>
                      {/* Exemplo aplicado — o principal que o cliente usa */}
                      <div className="mb-4">
                        {viewOnly ? (
                          <p className="text-base sm:text-lg text-zinc-100 font-medium leading-relaxed">{item.filled_example}</p>
                        ) : (
                          <EditableField
                            value={item.filled_example}
                            onChange={(val) => updateHeadline(i, val)}
                            className="text-base sm:text-lg text-zinc-100 font-medium leading-relaxed"
                          />
                        )}
                      </div>
                      {/* Estrutura — referência secundária */}
                      <div className="border-t border-white/[0.06] pt-3">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Estrutura</p>
                        <p className="text-sm text-zinc-400">{item.structure}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : mapData.headline_structures.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Type className="w-5 h-5 text-[var(--gold)]" />
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
          <div className="space-y-12 tab-content-enter">
            {typeof roteiroAudio === "string" && (
              <TabAudioPlayer url={roteiroAudio} tabId={TAB_IDS.roteiro} image={speakerImage} />
            )}
            {scriptRewrites.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--gold)]" />
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
          <div className="tab-content-enter">
            {typeof playbookAudio === "string" && (
              <TabAudioPlayer url={playbookAudio} tabId={TAB_IDS.playbook} image={speakerImage} />
            )}
            {(editedPlaybook || mapData.action_plan?.playbook) ? (
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
                  {!viewOnly ? (
                    <EditableMarkdown
                      value={editedPlaybook}
                      onChange={(val) => { setEditedPlaybook(val); setDirty(true) }}
                      minHeight="300px"
                    />
                  ) : (
                    <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-loose text-base">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {editedPlaybook}
                      </ReactMarkdown>
                    </div>
                  )}
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
