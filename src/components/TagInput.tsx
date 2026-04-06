"use client"

import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"

interface TagInputProps {
  label: string
  placeholder: string
  tags: string[]
  onChange: (tags: string[]) => void
  minItems?: number
  multiline?: boolean
}

export function TagInput({ label, placeholder, tags, onChange, minItems, multiline = false }: TagInputProps) {
  const [input, setInput] = useState("")

  function addTag() {
    const value = input.trim()
    if (!value) return
    if (tags.includes(value)) { setInput(""); return }
    onChange([...tags, value])
    setInput("")
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const showMinWarning = minItems && tags.length > 0 && tags.length < minItems

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        {label}
        {minItems && (
          <span className="text-zinc-600 text-xs">(mín. {minItems})</span>
        )}
      </label>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 ${multiline ? 'bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm' : 'bg-zinc-800/80 border border-zinc-700/50 rounded-full px-3 py-1 text-sm'} text-zinc-200`}
            >
              <span className={multiline ? 'whitespace-pre-wrap' : ''}>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-zinc-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y text-sm"
          />
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        )}
        <button
          type="button"
          onClick={addTag}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 rounded-lg transition-colors text-sm font-medium shrink-0 cursor-pointer"
        >
          +
        </button>
      </div>

      {showMinWarning && (
        <p className="text-amber-500/80 text-xs">
          Adicione pelo menos {minItems} {minItems === 1 ? 'item' : 'itens'} ({tags.length}/{minItems})
        </p>
      )}
    </div>
  )
}
