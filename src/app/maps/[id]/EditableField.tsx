"use client"

import { useState } from "react"
import { Pencil, Check } from "lucide-react"

interface EditableFieldProps {
  value: string
  onChange: (newValue: string) => void
  className?: string
}

export function EditableField({ value, onChange, className = "" }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 edit-controls">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="flex-1 bg-white/5 border border-[var(--gold)]/30 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          autoFocus
        />
        <button onClick={save} className="text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0">
          <Check className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={`group flex items-start gap-2 ${className}`}>
      <span className="flex-1">{value}</span>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-[var(--gold)] transition-all no-print edit-controls cursor-pointer shrink-0 mt-0.5"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
