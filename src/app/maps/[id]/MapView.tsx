"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, User, Flame, ExternalLink, Play, Type, FileText,
  Save, Loader2, ChevronDown, ChevronUp, CalendarDays, Target,
  Users, Sparkles,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { MapData, HeadlineExample, ViralTermExample } from "@/types/map"
import { EditableField } from "./EditableField"
import { EditableScript } from "./EditableScript"

const TABS = [
  { id: "nucleo", label: "Núcleo", icon: Target },
  { id: "virais", label: "Termos Virais", icon: Flame },
  { id: "referencias", label: "Referências", icon: Users },
  { id: "headlines", label: "Headlines", icon: Type },
  { id: "roteiro", label: "Roteiro", icon: FileText },
  { id: "playbook", label: "Próximos Passos", icon: CalendarDays },
] as const

type TabId = (typeof TABS)[number]["id"]

export function MapView({ mapData }: { mapData: MapData }) {
  const [activeTab, setActiveTab] = useState<TabId>("nucleo")
  const [headlineExamples, setHeadlineExamples] = useState<HeadlineExample[]>(
    mapData.action_plan?.headline_examples ?? []
  )
  const [viralTermExamples, setViralTermExamples] = useState<ViralTermExample[]>(
    mapData.action_plan?.viral_term_examples ?? []
  )
  const [scriptRewrites, setScriptRewrites] = useState<string[]>(
    mapData.action_plan?.script_rewrites ?? []
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [expandedScripts, setExpandedScripts] = useState<Record<number, boolean>>({})

  const profile = mapData.extracted_profile
  const nucleoFields = profile ? [
    { label: "Especialidade", value: profile.especialidade, color: "text-white" },
    { label: "Público Alvo", value: profile.publico_alvo, color: "text-white" },
    { label: "Dor que Resolve", value: profile.dor, color: "text-white" },
    { label: "Inimigo Comum", value: profile.inimigo, color: "text-red-400" },
    { label: "Desejo / Transformação", value: profile.desejo, color: "text-emerald-400" },
    { label: "Nova Crença", value: profile.nova_crenca, color: "text-[var(--gold-light)]" },
  ] : []

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/maps/${mapData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_plan: {
            headline_examples: headlineExamples,
            viral_term_examples: viralTermExamples,
            script_rewrites: scriptRewrites,
            playbook: mapData.action_plan?.playbook || null,
          },
        }),
      })
      setDirty(false)
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setSaving(false)
    }
  }, [headlineExamples, viralTermExamples, scriptRewrites, mapData.id, mapData.action_plan?.playbook])

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
    updated[index] = newValue
    setScriptRewrites(updated)
    setDirty(true)
  }

  function toggleScript(index: number) {
    setExpandedScripts(prev => ({ ...prev, [index]: !prev[index] }))
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
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
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

          <span className="text-zinc-600 text-[10px] tracking-widest uppercase hidden sm:block shrink-0">
            Mapa Estratégico
          </span>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[57px] z-40 bg-[#050507]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer shrink-0
                    ${isActive
                      ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* ═══ TAB: Núcleo de Influência ═══ */}
        {activeTab === "nucleo" && (
          <div className="space-y-12 animate-fade-up">
            {/* Núcleo de Influência */}
            {profile && (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                  Núcleo de Influência
                </h2>

                <div className="premium-border rounded-2xl">
                  <div className="bg-[#0a0a0f] rounded-2xl p-8 space-y-6">
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
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 md:p-10">
                  <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {mapData.narrative}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══ TAB: Termos Virais ═══ */}
        {activeTab === "virais" && (
          <div className="space-y-10 animate-fade-up">
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
                        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
                          <div>
                            <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-1.5">Termo Viral</p>
                            <span className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full px-4 py-1.5 text-sm font-medium">
                              <Flame className="w-3.5 h-3.5" />
                              {item.viral_term}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] text-[var(--gold)] uppercase tracking-widest mb-1.5">Exemplo de como aplicar na headline</p>
                            <EditableField
                              value={item.headline_example}
                              onChange={(val) => updateViralTerm(i, val)}
                              className="text-sm text-zinc-100 font-medium"
                            />
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
        {activeTab === "referencias" && (
          <div className="space-y-10 animate-fade-up">
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
        {activeTab === "headlines" && (
          <div className="space-y-10 animate-fade-up">
            {/* Estruturas de Headline */}
            {headlineExamples.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-400" />
                  Estruturas de Headline
                </h2>
                <div className="space-y-4">
                  {headlineExamples.map((item, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                      <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-2">Estrutura</p>
                      <p className="text-sm text-zinc-400 mb-4 font-mono">{item.structure}</p>
                      <p className="text-[11px] text-[var(--gold)] uppercase tracking-widest mb-2">Exemplo Preenchido</p>
                      <EditableField
                        value={item.filled_example}
                        onChange={(val) => updateHeadline(i, val)}
                        className="text-sm text-zinc-100 font-medium"
                      />
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
                <div className="space-y-3">
                  {mapData.headline_structures.map((headline, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Type className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed pt-1">{headline}</p>
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
        {activeTab === "roteiro" && (
          <div className="space-y-10 animate-fade-up">
            {(scriptRewrites.length > 0 || mapData.script_examples.length > 0) ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Roteiros
                </h2>
                <div className="space-y-6">
                  {scriptRewrites.length > 0 ? (
                    scriptRewrites.map((script, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-zinc-500 uppercase tracking-widest">Roteiro {i + 1}</span>
                        </div>

                        {mapData.script_examples[i] && (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleScript(i)}
                              className="flex items-center gap-1.5 text-[11px] text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors cursor-pointer"
                            >
                              {expandedScripts[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Estrutura Original
                            </button>
                            {expandedScripts[i] && (
                              <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                                <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap font-mono">{mapData.script_examples[i]}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-[var(--gold)] uppercase tracking-widest mb-2">Roteiro Personalizado</p>
                        <EditableScript
                          value={script}
                          onChange={(val) => updateScriptRewrite(i, val)}
                        />
                      </div>
                    ))
                  ) : (
                    mapData.script_examples.map((script, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-zinc-500 uppercase tracking-widest">Roteiro {i + 1}</span>
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{script}</p>
                      </div>
                    ))
                  )}
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
        {activeTab === "playbook" && (
          <div className="animate-fade-up">
            {mapData.action_plan?.playbook ? (
              <section>
                <h2 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-[var(--gold)]" />
                  Playbook de 15 Dias
                </h2>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Seu planejamento personalizado</p>
                      <p className="text-xs text-zinc-500">Siga este playbook dia a dia para máximo resultado</p>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed">
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
      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
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
