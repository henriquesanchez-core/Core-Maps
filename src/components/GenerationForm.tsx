"use client"

import { useState } from "react"
import { Loader2, Plus, ArrowRight } from "lucide-react"

export function GenerationForm() {
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [resultId, setResultId] = useState<string | null>(null)

  const steps = [
    "Instagram",
    "Referências",
    "Extrair Perfil",
    "Narrativa",
    "Mapa Final"
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResultId(null)
    setCurrentStep(0)
    setProgressMsg("Iniciando geração...")

    const formData = new FormData(e.currentTarget)
    const payload = {
      clientUsername: formData.get("clientUsername"),
      referenceProfiles: formData.get("referenceProfiles"),
      viralTerm: formData.get("viralTerm"),
      transcription: formData.get("transcription"),
      viralFormat: formData.get("viralFormat"),
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === "progress") {
              setProgressMsg(data.message)
              setCurrentStep(data.step)
            } else if (data.type === "done") {
              setCurrentStep(5)
              setProgressMsg("Concluído!")
              setResultId(data.id)
            } else if (data.type === "error") {
              setProgressMsg("Erro: " + data.message)
            }
          } catch(e) {}
        }
      }
    } catch (err: any) {
      setProgressMsg("Erro ao processar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-zinc-100">
        <Plus className="w-5 h-5 text-blue-400" />
        Novo CoreMap
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">@ do Instagram do Cliente</label>
            <input 
              required
              name="clientUsername"
              type="text" 
              placeholder="ex: htsanchez" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Termo Viral</label>
            <input 
              name="viralTerm"
              type="text" 
              placeholder="ex: negócio invisível" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Perfis de Referência (1 por linha)</label>
          <textarea 
            name="referenceProfiles"
            rows={3}
            placeholder="https://instagram.com/ref1..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Transcrição da Call de Diagnóstico</label>
          <textarea 
            name="transcription"
            rows={6}
            placeholder="Cole aqui a transcrição da chamada para a extração do núcleo de influência..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Formato Viral / Insumos Adicionais</label>
          <textarea 
            name="viralFormat"
            rows={3}
            placeholder="Detalhes ou inspiração para o roteiro..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Gerar CoreMap Master
            </>
          )}
        </button>
      </form>

      {/* Progress View */}
      {(loading || currentStep > 0) && (
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <div className="flex gap-2 justify-between mb-4 flex-wrap">
            {steps.map((s, i) => {
              const active = currentStep >= i + 1;
              return (
                <div key={i} className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${active ? 'bg-blue-500/20 text-blue-400 border py-0 px-0' : 'bg-zinc-800 text-zinc-500'}`}>
                    {i + 1}
                  </div>
                  <span className="hidden sm:inline">{s}</span>
                </div>
              )
            })}
          </div>
          <p className="text-center font-mono text-sm text-zinc-300 animate-pulse">{progressMsg}</p>
        </div>
      )}

      {/* Result View */}
      {resultId && (
        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center animate-in fade-in zoom-in duration-500">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Mapa Gerado com Sucesso!</h3>
          <a href={`/maps/${resultId}`} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 px-6 rounded-md transition-colors">
            Acessar o CoreMap <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  )
}
