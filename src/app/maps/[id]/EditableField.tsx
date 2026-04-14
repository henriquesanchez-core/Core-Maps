"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"

interface EditableFieldProps {
  value: string
  onChange: (newValue: string) => void
  className?: string
  multiline?: boolean
}

export function EditableField({ value, onChange, className = "", multiline = false }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2 edit-controls">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full bg-white/5 border border-[var(--gold)]/30 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] min-h-[80px] resize-y"
            autoFocus
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-full bg-white/5 border border-[var(--gold)]/30 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button onClick={save} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> OK
          </button>
          <button onClick={() => { setDraft(value); setEditing(false) }} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 cursor-pointer text-xs">
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="flex-1">{value || <span className="text-zinc-700 italic">Não informado</span>}</span>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="text-zinc-600 hover:text-[var(--gold)] transition-colors no-print edit-controls cursor-pointer shrink-0 mt-0.5"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
