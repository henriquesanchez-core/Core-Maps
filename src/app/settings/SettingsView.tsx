"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Trash2,
  Volume2,
  Loader2,
  LogOut,
  Target,
  Flame,
  Users,
  Lightbulb,
  Video,
  BookOpen,
} from "lucide-react"
import Link from "next/link"

const TAB_META: Record<string, { label: string; icon: React.ElementType }> = {
  nucleo: { label: "Núcleo Estratégico", icon: Target },
  virais: { label: "Termos Virais", icon: Flame },
  referencias: { label: "Referências", icon: Users },
  headlines: { label: "Headlines", icon: Lightbulb },
  roteiro: { label: "Roteiros", icon: Video },
  playbook: { label: "Playbook 15 Dias", icon: BookOpen },
}

const TABS = Object.keys(TAB_META)

interface Props {
  initialAudios: Record<string, string | null>
}

export function SettingsView({ initialAudios }: Props) {
  const router = useRouter()
  const [audios, setAudios] = useState(initialAudios)
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleUpload(tabId: string, file: File) {
    setUploading(tabId)
    try {
      const form = new FormData()
      form.append("tab_id", tabId)
      form.append("file", file)

      const res = await fetch("/api/settings/audio", { method: "POST", body: form })
      const data = await res.json()

      if (res.ok) {
        setAudios((prev) => ({ ...prev, [tabId]: data.audio_url }))
      } else {
        alert(data.error || "Erro no upload")
      }
    } catch {
      alert("Erro ao enviar áudio")
    } finally {
      setUploading(null)
    }
  }

  async function handleDelete(tabId: string) {
    if (!confirm("Remover áudio desta aba?")) return
    setDeleting(tabId)
    try {
      const res = await fetch("/api/settings/audio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab_id: tabId }),
      })
      if (res.ok) {
        setAudios((prev) => ({ ...prev, [tabId]: null }))
      }
    } catch {
      alert("Erro ao remover")
    } finally {
      setDeleting(null)
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-zinc-100">Configurações</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-500 hover:text-red-400 transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* Audio section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[var(--gold)]" />
              Áudios Explicativos
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Configure um áudio de introdução para cada aba do mapa estratégico.
            </p>
          </div>

          <div className="grid gap-4">
            {TABS.map((tabId) => {
              const meta = TAB_META[tabId]
              const Icon = meta.icon
              const url = audios[tabId]
              const isUploading = uploading === tabId
              const isDeleting = deleting === tabId

              return (
                <div
                  key={tabId}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Tab info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[var(--gold)]" />
                    </div>
                    <span className="font-medium text-zinc-200 truncate">
                      {meta.label}
                    </span>
                  </div>

                  {/* Audio controls */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {url ? (
                      <>
                        <audio
                          src={url}
                          controls
                          className="h-8 max-w-[200px]"
                        />
                        <button
                          onClick={() => fileRefs.current[tabId]?.click()}
                          disabled={isUploading}
                          className="text-xs text-zinc-400 hover:text-[var(--gold)] transition-colors cursor-pointer"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Trocar"
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(tabId)}
                          disabled={isDeleting}
                          className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => fileRefs.current[tabId]?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors text-zinc-400 cursor-pointer"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? "Enviando..." : "Enviar Áudio"}
                      </button>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={(el) => { fileRefs.current[tabId] = el }}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(tabId, file)
                        e.target.value = ""
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
