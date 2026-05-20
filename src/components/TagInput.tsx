"use client"

import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"

interface TagInputProps {
  label: string
  placeholder: string
  tags: string[]
  onChange: (tags: string[]) => void
  minItems?: number
  maxItems?: number
  maxChars?: number
  multiline?: boolean
  name?: string
}

export function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  minItems,
  maxItems,
  maxChars,
  multiline = false,
  name,
}: TagInputProps) {
  const [input, setInput] = useState("")

  const atMaxItems = typeof maxItems === "number" && tags.length >= maxItems
  const overCharLimit = typeof maxChars === "number" && input.length > maxChars
  const canAdd = !atMaxItems && !overCharLimit && input.trim().length > 0

  function addTag() {
    if (atMaxItems || overCharLimit) return
    const value = input.trim()
    if (!value) return
    if (!multiline && tags.includes(value)) {
      setInput("")
      return
    }
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

  function handleChange(value: string) {
    if (typeof maxChars === "number" && value.length > maxChars) {
      setInput(value.slice(0, maxChars))
      return
    }
    setInput(value)
  }

  const showMinWarning = minItems && tags.length > 0 && tags.length < minItems
  const showMaxWarning = atMaxItems
  const showCharCount = typeof maxChars === "number" && input.length > maxChars * 0.8

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        {label}
        {minItems && (
          <span className="text-zinc-600 text-xs">(mín. {minItems})</span>
        )}
        {typeof maxItems === "number" && (
          <span className="text-zinc-600 text-xs ml-auto">
            {tags.length}/{maxItems}
          </span>
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
            name={name ? `${name}_input` : undefined}
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={atMaxItems ? `Limite de ${maxItems} itens atingido` : placeholder}
            rows={3}
            maxLength={maxChars}
            disabled={atMaxItems}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        ) : (
          <input
            type="text"
            name={name ? `${name}_input` : undefined}
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={atMaxItems ? `Limite de ${maxItems} itens atingido` : placeholder}
            maxLength={maxChars}
            disabled={atMaxItems}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )}
        <button
          type="button"
          onClick={addTag}
          disabled={!canAdd}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 rounded-lg transition-colors text-sm font-medium shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {showMinWarning && (
        <p className="text-amber-500/80 text-xs">
          Adicione pelo menos {minItems} {minItems === 1 ? 'item' : 'itens'} ({tags.length}/{minItems})
        </p>
      )}
      {showMaxWarning && (
        <p className="text-red-400/80 text-xs">
          Limite máximo de {maxItems} itens atingido. Remova um item para adicionar outro.
        </p>
      )}
      {showCharCount && !atMaxItems && (
        <p className="text-zinc-500 text-xs">
          {input.length}/{maxChars} caracteres
        </p>
      )}
    </div>
  )
}
