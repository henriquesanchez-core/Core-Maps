"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, User, Flame, ExternalLink, Play, Type, FileText,
  Save, Loader2, Download, ChevronDown, ChevronUp, CalendarDays,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { MapData, HeadlineExample, ViralTermExample } from "@/types/map"
import { EditableField } from "./EditableField"
import { EditableScript } from "./EditableScript"

export function MapView({ mapData }: { mapData: MapData }) {
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
    { label: "Desejo / Transformaç��o", value: profile.desejo, color: "text-emerald-400" },
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
  }, [headlineExamples, viralTermExamples, scriptRewrites, mapData.id])

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

  let sectionIndex = 0

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[var(--gold)]/20">
      <div className="noise-overlay" />

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--gold)]/[0.03] blur-[150px] rounded-full glow-ambient" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] blur-[150px] rounded-full glow-ambient" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06] no-print">
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
          <div className="profile-ring w-[120px] h-[120px]">
            {mapData.client_data.profilePicUrl ? (
              <img
                src={mapData.client_data.profilePicUrl}
                alt={mapData.client_data.fullName || mapData.client_username}
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
              {mapData.client_data.fullName || profile?.nome || mapData.client_username}
            </h1>
            <p className="text-zinc-500 font-mono text-sm">@{mapData.client_username}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--gold)]/40" />
            <span className="gold-shimmer text-sm font-semibold tracking-[0.2em] uppercase">
              Mapa Estratégico Personalizado
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--gold)]/40" />
          </div>
        </section>

        {/* ── SECTION 1: Núcleo de Influência ── */}
        {profile && (
          <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Núcleo de Influência</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

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
        )}

        {/* ── SECTION 2: Refer��ncias ── */}
        {mapData.references_data.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Referências</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

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

        {/* ── SECTION 3: Vídeos de Referência ── */}
        {mapData.video_examples.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Vídeos de Referência</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

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

        {/* ── SECTION 4: Narrativa Magnética ── */}
        {mapData.narrative && (
          <section className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Narrativa Magnética</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 md:p-10">
              <div className="prose prose-invert prose-premium max-w-none text-zinc-300 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {mapData.narrative}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 5: Headlines ── */}
        {(headlineExamples.length > 0 || viralTermExamples.length > 0 || mapData.headline_structures.length > 0) && (
          <section className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Headlines</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            {/* Estruturas Preenchidas */}
            {headlineExamples.length > 0 && (
              <div className="mb-10">
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-blue-400" />
                  Estruturas Preenchidas
                </p>
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
              </div>
            )}

            {/* Headlines sem AI (fallback para mapas antigos) */}
            {headlineExamples.length === 0 && mapData.headline_structures.length > 0 && (
              <div className="mb-10">
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-blue-400" />
                  Estruturas de Headline
                </p>
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
              </div>
            )}

            {/* Headlines com Termos Virais */}
            {viralTermExamples.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Headlines com Termos Virais
                </p>
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
              </div>
            )}

            {/* Termos virais sem AI (fallback) */}
            {viralTermExamples.length === 0 && mapData.viral_terms.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-semibold mb-4 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Termos Virais
                </p>
                <div className="flex flex-wrap gap-3">
                  {mapData.viral_terms.map((term, i) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full px-5 py-2.5 text-sm font-medium">
                      <Flame className="w-3.5 h-3.5" />
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 6: Roteiros ── */}
        {(scriptRewrites.length > 0 || mapData.script_examples.length > 0) && (
          <section className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Roteiros</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="space-y-6">
              {scriptRewrites.length > 0 ? (
                scriptRewrites.map((script, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-zinc-500 uppercase tracking-widest">Roteiro {i + 1}</span>
                    </div>

                    {/* Estrutura original colapsável */}
                    {mapData.script_examples[i] && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleScript(i)}
                          className="flex items-center gap-1.5 text-[11px] text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors cursor-pointer no-print"
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
        )}

        {/* ── SECTION 7: Playbook de 15 Dias ── */}
        {mapData.action_plan?.playbook && (
          <section className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 mb-8">
              <span className="section-number">{++sectionIndex}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Playbook de 15 Dias</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

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
        )}

        {/* ── FOOTER ── */}
        <footer className="pt-12 border-t border-white/[0.04] text-center">
          <p className="text-zinc-700 text-xs tracking-widest uppercase">
            Gerado exclusivamente para @{mapData.client_username}
          </p>
        </footer>
      </main>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-3 no-print">
        {dirty && (
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
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] text-[#050507] font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>
    </div>
  )
}
