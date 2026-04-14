"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Map, Zap, Trash2, Pencil, Check, X,
  FolderPlus, Folder, FolderOpen, MoreVertical, GripVertical,
} from "lucide-react"

interface MapItem {
  id: string
  client_username: string
  name: string | null
  folder_id: string | null
  created_at: string
}

interface FolderItem {
  id: string
  name: string
  created_at: string
}

export function MapSidebar({ initialMaps, initialFolders }: { initialMaps: MapItem[]; initialFolders: FolderItem[] }) {
  const [maps, setMaps] = useState(initialMaps)
  const [folders, setFolders] = useState(initialFolders)
  const [editingMapId, setEditingMapId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id)))

  function toggleFolder(folderId: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(folderId) ? next.delete(folderId) : next.add(folderId)
      return next
    })
  }

  // ── Map actions ──

  async function renameMap(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const res = await fetch(`/api/maps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      setMaps(prev => prev.map(m => m.id === id ? { ...m, name: trimmed } : m))
    }
    setEditingMapId(null)
  }

  async function deleteMap(id: string) {
    if (!confirm("Tem certeza que deseja excluir este mapa? Essa ação não pode ser desfeita.")) return
    const res = await fetch(`/api/maps/${id}`, { method: "DELETE" })
    if (res.ok) {
      setMaps(prev => prev.filter(m => m.id !== id))
    }
    setMenuOpenId(null)
  }

  async function moveMap(mapId: string, folderId: string | null) {
    const res = await fetch(`/api/maps/${mapId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    })
    if (res.ok) {
      setMaps(prev => prev.map(m => m.id === mapId ? { ...m, folder_id: folderId } : m))
    }
    setMenuOpenId(null)
  }

  // ── Folder actions ──

  async function createFolder() {
    const trimmed = newFolderName.trim()
    if (!trimmed) return
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      const { folder } = await res.json()
      setFolders(prev => [...prev, folder])
      setExpandedFolders(prev => new Set([...prev, folder.id]))
    }
    setNewFolderName("")
    setShowNewFolder(false)
  }

  async function renameFolder(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: trimmed } : f))
    }
    setEditingFolderId(null)
  }

  async function deleteFolder(id: string) {
    if (!confirm("Excluir esta pasta? Os mapas dentro dela serão movidos para fora.")) return
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" })
    if (res.ok) {
      setFolders(prev => prev.filter(f => f.id !== id))
      setMaps(prev => prev.map(m => m.folder_id === id ? { ...m, folder_id: null } : m))
    }
    setMenuOpenId(null)
  }

  // ── Render helpers ──

  const unfolderedMaps = maps.filter(m => !m.folder_id)

  function renderMapCard(m: MapItem) {
    const displayName = m.name || `@${m.client_username}`
    const isEditing = editingMapId === m.id
    const isMenuOpen = menuOpenId === m.id

    return (
      <div key={m.id} className="group relative">
        {isEditing ? (
          <div className="bg-zinc-950 border border-blue-500/30 rounded-xl p-3 space-y-2">
            <input
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && renameMap(m.id, editDraft)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => renameMap(m.id, editDraft)} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 cursor-pointer">
                <Check className="w-3 h-3" /> OK
              </button>
              <button onClick={() => setEditingMapId(null)} className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer">
                <X className="w-3 h-3" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link href={`/maps/${m.id}`} className="flex-1 min-w-0">
              <div className="bg-zinc-950 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-xl p-3 transition-all hover:border-blue-500/30 cursor-pointer">
                <p className="font-medium text-zinc-200 flex items-center gap-2 text-sm truncate">
                  <Map className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {displayName}
                </p>
                <p className="text-[11px] text-zinc-600 mt-1 ml-5.5">
                  @{m.client_username} · {new Date(m.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Link>

            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpenId(isMenuOpen ? null : m.id)}
                className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                  <div className="absolute right-0 top-8 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 w-48">
                    <button
                      onClick={() => { setEditDraft(m.name || m.client_username); setEditingMapId(m.id); setMenuOpenId(null) }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Renomear
                    </button>

                    {folders.length > 0 && (
                      <div className="border-t border-zinc-800 my-1" />
                    )}
                    {m.folder_id && (
                      <button
                        onClick={() => moveMap(m.id, null)}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Remover da pasta
                      </button>
                    )}
                    {folders.filter(f => f.id !== m.folder_id).map(f => (
                      <button
                        key={f.id}
                        onClick={() => moveMap(m.id, f.id)}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5 text-yellow-500" /> Mover para {f.name}
                      </button>
                    ))}

                    <div className="border-t border-zinc-800 my-1" />
                    <button
                      onClick={() => deleteMap(m.id)}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderFolderCard(f: FolderItem) {
    const isExpanded = expandedFolders.has(f.id)
    const isEditing = editingFolderId === f.id
    const isMenuOpen = menuOpenId === `folder-${f.id}`
    const folderMaps = maps.filter(m => m.folder_id === f.id)

    return (
      <div key={f.id} className="space-y-1">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-blue-500/30 rounded-lg p-2">
              <input
                value={editDraft}
                onChange={e => setEditDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && renameFolder(f.id, editDraft)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none"
                autoFocus
              />
              <button onClick={() => renameFolder(f.id, editDraft)} className="text-emerald-400 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditingFolderId(null)} className="text-zinc-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <>
              <button
                onClick={() => toggleFolder(f.id)}
                className="flex-1 flex items-center gap-2 text-left text-sm font-medium text-zinc-300 hover:text-zinc-100 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                {isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />}
                {f.name}
                <span className="text-[11px] text-zinc-600 ml-auto">{folderMaps.length}</span>
              </button>
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpenId(isMenuOpen ? null : `folder-${f.id}`)}
                  className="p-1 text-zinc-600 hover:text-zinc-300 rounded hover:bg-zinc-800 cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 top-7 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 w-44">
                      <button
                        onClick={() => { setEditDraft(f.name); setEditingFolderId(f.id); setMenuOpenId(null) }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Renomear
                      </button>
                      <button
                        onClick={() => deleteFolder(f.id)}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir pasta
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {isExpanded && (
          <div className="ml-4 space-y-1.5 border-l border-zinc-800 pl-3">
            {folderMaps.length === 0 ? (
              <p className="text-[11px] text-zinc-600 py-2 pl-1">Pasta vazia</p>
            ) : (
              folderMaps.map(renderMapCard)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
          <Zap className="w-5 h-5 text-yellow-500" />
          Mapas
        </h3>
        <button
          onClick={() => setShowNewFolder(true)}
          className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          title="Nova pasta"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {showNewFolder && (
        <div className="mb-3 flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-lg p-2">
          <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
          <input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && createFolder()}
            placeholder="Nome da pasta"
            className="flex-1 bg-transparent text-sm text-zinc-100 focus:outline-none placeholder:text-zinc-600"
            autoFocus
          />
          <button onClick={createFolder} className="text-emerald-400 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName("") }} className="text-zinc-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="space-y-2">
        {/* Folders */}
        {folders.map(renderFolderCard)}

        {/* Separator if there are both folders and unfoldered maps */}
        {folders.length > 0 && unfolderedMaps.length > 0 && (
          <div className="border-t border-zinc-800 my-2" />
        )}

        {/* Unfoldered maps */}
        {unfolderedMaps.map(renderMapCard)}

        {maps.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">Nenhum mapa gerado ainda.</p>
        )}
      </div>
    </div>
  )
}
