"use client"

import { useState } from "react"
import { ShieldCheck, AlertTriangle, CheckCircle2, Wrench, RefreshCw, Send } from "lucide-react"

export default function Home() {
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Peugeot 3008 II - 1.5 BlueHDi 130 (DV5RC)")
  const [dtc, setDtc] = useState("P0234")
  const [symptoms, setSymptoms] = useState("Perte de puissance sous charge, voyant moteur")
  const [loading, setLoading] = useState(false)
  const [jackResponse, setJackResponse] = useState("")
  const [voltage, setVoltage] = useState("Attente...")

  const handleLaunchDiag = async () => {
    setLoading(true)
    setJackResponse("")
    try {
      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Véhicule: ${vehicle} (Plaque: ${plate}), Code DTC: ${dtc}, Symptômes: ${symptoms}`
          }]
        })
      })
      const data = await res.text()
      setJackResponse(data)
    } catch {
      setJackResponse("Erreur de communication avec l'assistant. Vérifiez la clé API.")
    } finally {
      setLoading(false)
    }
  }

  const handleMeasure = (conform: boolean) => {
    if (conform) {
      setVoltage("5.02 V (Conforme)")
      setJackResponse("Mesure conforme (5V). Faisceau et alimentation validés. Contrôle suivant : étanchéité de la commande pneumatique de suralimentation.")
    } else {
      setVoltage("0.04 V (Non conforme)")
      setJackResponse("Mesure non conforme. Absence de tension. Vérifiez le fusible d'alimentation ou une coupure sur le faisceau broche 3.")
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-2xl mx-auto flex flex-col gap-4 font-sans">
      <header className="flex justify-between items-center py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Wrench className="w-5 h-5" /> Jack Copilot
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded">OBD-II Connecté</span>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={plate} 
            onChange={(e) => setPlate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1 font-mono uppercase font-bold text-center w-36 text-blue-400" 
            placeholder="AA-123-BB"
          />
          <input 
            type="text" 
            value={vehicle} 
            onChange={(e) => setVehicle(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-sm flex-1"
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={dtc} 
            onChange={(e) => setDtc(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1 font-mono text-sm w-28 text-amber-400" 
            placeholder="Code DTC"
          />
          <input 
            type="text" 
            value={symptoms} 
            onChange={(e) => setSymptoms(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-sm flex-1" 
            placeholder="Symptômes"
          />
        </div>
        <button 
          onClick={handleLaunchDiag} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded flex justify-center items-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
          Analyser avec Jack
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Analyse Chef d'Atelier
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-slate-200">
          {jackResponse || "Saisissez les informations de panne et lancez l'analyse pour démarrer le protocole de diagnostic."}
        </div>
      </section>

      <section className="bg-black border border-slate-800 rounded-lg p-3 text-center">
        <span className="text-xs text-slate-500 block mb-1">Affichage Multimètre</span>
        <div className="font-mono text-xl text-emerald-400 font-bold">{voltage}</div>
      </section>

      <section className="grid grid-cols-2 gap-3 mt-auto pt-4">
        <button 
          onClick={() => handleMeasure(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-1 text-sm"
        >
          <CheckCircle2 className="w-5 h-5" /> Mesure Conforme (5V)
        </button>
        <button 
          onClick={() => handleMeasure(false)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-1 text-sm"
        >
          <AlertTriangle className="w-5 h-5" /> Mesure Non Conforme
        </button>
      </section>
    </main>
  )
}
