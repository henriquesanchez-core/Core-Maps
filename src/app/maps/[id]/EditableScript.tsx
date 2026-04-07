"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"

interface EditableScriptProps {
  value: string
  onChange: (newValue: string) => void
  className?: string
}

export function EditableScript({ value, onChange, className = "" }: EditableScriptProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    onChange(draft)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2 edit-controls">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full bg-white/5 border border-[var(--gold)]/30 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] resize-y min-h-[120px]"
          rows={8}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={cancel} className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button onClick={save} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 cursor-pointer">
            <Check className="w-3.5 h-3.5" /> Salvar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative ${className}`}>
      <p className="text-sm text-zinc-300 leading-[1.8] whitespace-pre-wrap">{value}</p>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-[var(--gold)] transition-all no-print edit-controls cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
