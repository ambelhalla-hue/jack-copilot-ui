"use client"

import { useState } from "react"
import { ShieldCheck, AlertTriangle, CheckCircle2, Wrench, RefreshCw, Send, Car } from "lucide-react"

export default function Home() {
  const [plate, setPlate] = useState("GR-608-BP")
  const [motorisation, setMotorisation] = useState("Renault Clio IV - 1.5 dCi 90 (K9K)")
  const [dtc, setDtc] = useState("P0401")
  const [symptoms, setSymptoms] = useState("À-coups à l'accélération, fumée noire, vanne EGR encrassée")
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
          plate: plate,
          motorisation: motorisation,
          dtc: dtc,
          symptoms: symptoms
        })
      })
      const data = await res.json()
      if (data.error) {
        setJackResponse(`Erreur : ${data.error}`)
      } else {
        setJackResponse(data.response || JSON.stringify(data))
      }
    } catch {
      setJackResponse("Erreur de communication avec le serveur API.")
    } finally {
      setLoading(false)
    }
  }

  const handleMeasure = (conform: boolean) => {
    if (conform) {
      setVoltage("5.02 V (Conforme)")
      setJackResponse("Mesure conforme (5V). Faisceau et alimentation validés. Passons au contrôle physique de l'actionneur.")
    } else {
      setVoltage("0.04 V (Non conforme)")
      setJackResponse("Mesure non conforme. Absence de tension. Vérifiez le fusible d'alimentation ou le faisceau broche 3.")
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-2xl mx-auto flex flex-col gap-4 font-sans">
      <header className="flex justify-between items-center py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Wrench className="w-5 h-5" /> Jack Copilot
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono">OBD-II Connecté</span>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={plate} 
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 font-mono uppercase font-bold text-center w-36 text-blue-400" 
            placeholder="AA-123-BB"
          />
          <div className="flex-1 relative flex items-center">
            <input 
              type="text" 
              value={motorisation} 
              onChange={(e) => setMotorisation(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm w-full text-slate-200" 
              placeholder="Modèle et motorisation"
            />
            <Car className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={dtc} 
            onChange={(e) => setDtc(e.target.value.toUpperCase())}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 font-mono text-sm w-28 text-amber-400 font-bold" 
            placeholder="Code DTC"
          />
          <input 
            type="text" 
            value={symptoms} 
            onChange={(e) => setSymptoms(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm flex-1 text-slate-200" 
            placeholder="Symptômes constatés"
          />
        </div>

        <button 
          onClick={handleLaunchDiag} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded flex justify-center items-center gap-2 transition"
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
          {jackResponse || "Saisissez les informations de la panne et cliquez sur Analyser avec Jack."}
        </div>
      </section>

      <section className="bg-black border border-slate-800 rounded-lg p-3 text-center">
        <span className="text-xs text-slate-500 block mb-1">Affichage Multimètre</span>
        <div className="font-mono text-xl text-emerald-400 font-bold">{voltage}</div>
      </section>

      <section className="grid grid-cols-2 gap-3 mt-auto pt-2">
        <button 
          onClick={() => handleMeasure(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition"
        >
          <CheckCircle2 className="w-5 h-5" /> Mesure Conforme (5V)
        </button>
        <button 
          onClick={() => handleMeasure(false)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition"
        >
          <AlertTriangle className="w-5 h-5" /> Mesure Non Conforme
        </button>
      </section>
    </main>
  )
}
