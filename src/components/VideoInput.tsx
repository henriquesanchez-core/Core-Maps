"use client"

import { useState } from "react"
import { Plus, X, Play } from "lucide-react"

export interface VideoExample {
  title: string
  url: string
}

interface VideoInputProps {
  label: string
  videos: VideoExample[]
  onChange: (videos: VideoExample[]) => void
}

export function VideoInput({ label, videos, onChange }: VideoInputProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  function add() {
    const trimTitle = title.trim()
    const trimUrl = url.trim()
    if (!trimUrl) return
    onChange([...videos, { title: trimTitle || trimUrl, url: trimUrl }])
    setTitle("")
    setUrl("")
  }

  function remove(index: number) {
    onChange(videos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>

      {/* Existing videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v, i) => (
            <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
              <Play className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{v.title}</p>
                <p className="text-[11px] text-zinc-500 truncate">{v.url}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-zinc-600 hover:text-red-400 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do vídeo (ex: Exemplo de gancho emocional)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Cole o link do vídeo..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          />
          <button
            type="button"
            onClick={add}
            disabled={!url.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white rounded-lg px-3 py-2 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
