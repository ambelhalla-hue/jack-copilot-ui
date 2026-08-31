"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Wrench, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Camera, 
  Mic, 
  MicOff, 
  ArrowRight, 
  Disc, 
  Trash2,
  ArrowLeft,
  Car,
  Clock
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

export default function AtelierTech() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)

  // États locaux de travail (réinitialisés à blanc par dossier)
  const [dtc, setDtc] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState("")
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [loadingVision, setLoadingVision] = useState(false)
  const [voltage, setVoltage] = useState("Attente de mesure...")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const [quickChecks, setQuickChecks] = useState<Record<string, string>>({
    pneusAV: "bon",
    pneusAR: "bon",
    plaquettesAV: "bon",
    disquesAV: "bon",
    plaquettesAR: "bon",
    disquesAR: "bon",
    batterie: "bon"
  })

  const [techPhotos, setTechPhotos] = useState<string[]>([])
  const techPhotoInputRef = useRef<HTMLInputElement>(null)

  const [panneConstatee, setPanneConstatee] = useState("")
  const [loadingDevis, setLoadingDevis] = useState(false)
  const [devisTransmis, setDevisTransmis] = useState(false)

  // Chargement de la file d'attente active (exclusion des dossiers terminés)
  const loadDossiersList = async () => {
    try {
      setLoadingList(true)
      const list = await getAllDossiers()
      if (list && Array.isArray(list)) {
        // Ne conserve que les véhicules en attente de diag ou d'intervention
        const enCours = list.filter((d: any) => 
          d.statut !== "valide_chef" && 
          d.statut !== "valide_client" && 
          d.statut !== "termine" &&
          d.statut !== "cloture"
        )
        setDossiers(enCours)
      }
    } catch (error) {
      console.error("Erreur chargement file d'attente", error)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadDossiersList()
  }, [])

  // Fonction de sélection et remise à zéro complète
  const handleSelectDossier = (dossier: any) => {
    setSelectedDossier(dossier)
    // Remise à zéro stricte de tous les champs
    setDtc("")
    setSymptoms("")
    setMessages([])
    setInput("")
    setVoltage("Attente de mesure...")
    setQuickChecks({
      pneusAV: "bon",
      pneusAR: "bon",
      plaquettesAV: "bon",
      disquesAV: "bon",
      plaquettesAR: "bon",
      disquesAR: "bon",
      batterie: "bon"
    })
    setTechPhotos([])
    setPanneConstatee("")
    setDevisTransmis(false)
  }

  const checkLabels: Record<string, string> = {
    pneusAV: "Pneus avant",
    pneusAR: "Pneus arrière",
    plaquettesAV: "Plaquettes de frein avant",
    disquesAV: "Disques de frein avant",
    plaquettesAR: "Plaquettes de frein arrière",
    disquesAR: "Disques/Tambours arrière",
    batterie: "Batterie 12V"
  }

  const getSecurityAnomalies = () => {
    const list: string[] = []
    Object.entries(quickChecks).forEach(([key, val]) => {
      if (val === "urgent") list.push(`${checkLabels[key]} (URGENT)`)
      if (val === "a_prevoir") list.push(`${checkLabels[key]} (À PRÉVOIR)`)
    })
    return list
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "fr-FR"

        recognition.onresult = (event: any) => {
          let currentTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          if (currentTranscript.trim()) {
            setInput(prev => (prev ? prev.trim() + " " : "") + currentTranscript)
          }
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Dictée vocale non disponible.")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !selectedDossier) return
    const newMessages = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoadingDiag(true)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE ATELIER : Véhicule ${selectedDossier.vin || "Véhicule"} (${selectedDossier.immatriculation}), ${selectedDossier.kilometrage || "0"} km, DTC: ${dtc}, Symptômes: ${symptoms}] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      const reply = data.error ? `Erreur: ${data.error}` : data.response
      setMessages(prev => [...prev, { role: "assistant", content: reply }])

      // Auto-remplissage du constat si une pièce cible est identifiée
      const targetMatch = reply.match(/\[PIECE_CIBLE:\s*([^\]]+)\]/i)
      if (targetMatch && targetMatch[1]) {
        setPanneConstatee(`Remplacement ${targetMatch[1].trim()}`)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion au serveur." }])
    } finally {
      setLoadingDiag(false)
    }
  }

  const handleTechPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedDossier) return

    const previewUrl = URL.createObjectURL(file)
    setTechPhotos(prev => [...prev, previewUrl])
    setLoadingVision(true)

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string
        const res = await fetch("/api/diag-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type || "image/jpeg",
            vehicleContext: `${selectedDossier.vin} (${selectedDossier.immatriculation})`,
            userNotes: `Symptômes : ${symptoms}`
          })
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          setMessages(prev => [
            ...prev,
            { role: "user", content: "📷 [Scan écran valise Diagbox]" },
            { role: "assistant", content: `⚠️ Jack Vision : ${data.error || "Échec analyse."}` }
          ])
        } else {
          const visionText = data.result || "Aucun code détecté."
          const dtcMatch = visionText.match(/CODES DÉTECTÉS\s*:\s*([^\n\r]+)/i)
          if (dtcMatch && dtcMatch[1]) {
            setDtc(dtcMatch[1].trim())
            setPanneConstatee(`Intervention suite au défaut ${dtcMatch[1].trim()}`)
          }

          setMessages(prev => [
            ...prev,
            { role: "user", content: "📷 [Scan écran valise Diagbox]" },
            { role: "assistant", content: visionText }
          ])
        }
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erreur scan photo." }])
      } finally {
        setLoadingVision(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeTechPhoto = (idx: number) => {
    setTechPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMeasure = (conform: boolean) => {
    if (conform) {
      setVoltage("5.02 V (Conforme)")
      handleSend("Mesure conforme (5V). Faisceau et alimentation validés. Quelle est la suite ?")
    } else {
      setVoltage("0.04 V (Non conforme)")
      handleSend("Mesure non conforme. Absence de tension relevée. Que vérifier ensuite ?")
    }
  }

  const handleGenerateAndSendToChef = async () => {
    if (!selectedDossier) return
    const anomalies = getSecurityAnomalies()
    let basePanne = panneConstatee.trim()
    if (!basePanne) {
      basePanne = dtc ? `Intervention défaut ${dtc} (${symptoms || "Contrôles réalisés"})` : "Contrôles périodiques atelier"
    }

    setLoadingDevis(true)

    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: selectedDossier.id,
          vehicle: selectedDossier.vin || "Véhicule Atelier",
          immat: selectedDossier.immatriculation,
          kilometrage: selectedDossier.kilometrage || "0",
          panne_constatee: basePanne,
          options_travaux: anomalies.length > 0 ? anomalies.join(", ") : "Contrôles conformes"
        })
      })

      const data = await res.json()
      if (!data.error && data.devis) {
        await updateDossierStatusAndData(selectedDossier.id, {
          statut: "devis_genere",
          constats_technicien: data.constat_court || basePanne,
          devis_ia: data.devis
        })
        setDevisTransmis(true)
      } else {
        alert("Erreur lors de la génération du devis.")
      }
    } catch {
      alert("Erreur réseau transmission.")
    } finally {
      setLoadingDevis(false)
    }
  }

  const checkItems = [
    { key: "pneusAV", label: "Pneus AV" },
    { key: "pneusAR", label: "Pneus AR" },
    { key: "plaquettesAV", label: "Plaquettes AV" },
    { key: "disquesAV", label: "Disques AV" },
    { key: "plaquettesAR", label: "Plaquettes AR" },
    { key: "disquesAR", label: "Disques/Tambours AR" },
    { key: "batterie", label: "Batterie 12V" },
  ]

  // VUE 1 : FILE D'ATTENTE ATELIER (CHOIX DU VÉHICULE)
  if (!selectedDossier) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-3 md:p-6 gap-5">
        <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base md:text-lg">File d'Attente Atelier</h1>
              <p className="text-xs text-slate-400">Sélectionnez le véhicule à prendre en charge sur votre pont</p>
            </div>
          </div>
          <button
            onClick={loadDossiersList}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin text-cyan-400" : ""}`} /> Actualiser
          </button>
        </header>

        <section className="flex flex-col gap-3">
          {loadingList ? (
            <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> Chargement des réceptions CCS...
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs bg-[#111827]/40 border border-white/5 rounded-2xl p-6">
              Aucun véhicule en attente de diagnostic.
            </div>
          ) : (
            dossiers.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDossier(d)}
                className="bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-950/60 border border-blue-800/40 rounded-xl text-blue-400 group-hover:scale-105 transition">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                        {d.immatriculation}
                      </span>
                      <h2 className="font-bold text-slate-100 text-sm md:text-base">{d.vin || "Modèle non renseigné"}</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Motif CCS : <span className="text-slate-200 font-medium">{d.constats_technicien || "Inspection générale"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {d.kilometrage ? `${Number(d.kilometrage).toLocaleString("fr-FR")} km` : "--- km"}
                  </span>
                  <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition">
                    Prendre en charge <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    )
  }

  // VUE 2 : FICHE DE TRAVAIL DU TECHNICIEN (RÉINITIALISÉE À BLANC)
  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-3 md:p-5 gap-4 selection:bg-blue-500/30">
      <header className="p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDossier(null)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Changer de véhicule"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {selectedDossier.immatriculation}
              </span>
              <h1 className="font-bold text-slate-100 text-sm md:text-base">{selectedDossier.vin}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{selectedDossier.kilometrage || 0} km</strong> • Motif CCS : <span className="text-slate-300">{selectedDossier.constats_technicien || "Inspection"}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedDossier(null)}
          className="text-[10px] font-mono uppercase px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-full font-semibold self-end md:self-auto cursor-pointer"
        >
          Changer de dossier
        </button>
      </header>

      {/* 1. CONTRÔLES EXPRESS */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-emerald-400" /> 1. Contrôles Express Sécurité
          </h2>
          <span className="text-[11px] text-slate-500">Cliquez pour alterner le statut</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {checkItems.map((item) => {
            const val = quickChecks[item.key]
            return (
              <div key={item.key} className="bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 flex flex-col justify-between gap-2">
                <span className="text-[11px] text-slate-300 font-medium leading-tight">{item.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = val === "bon" ? "a_prevoir" : val === "a_prevoir" ? "urgent" : "bon"
                    setQuickChecks(prev => ({ ...prev, [item.key]: nextVal }))
                  }}
                  className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold uppercase transition cursor-pointer text-center ${
                    val === "bon"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                      : val === "a_prevoir"
                      ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                      : "bg-rose-950/60 text-rose-400 border border-rose-800 animate-pulse"
                  }`}
                >
                  {val === "bon" ? "✓ Conforme" : val === "a_prevoir" ? "⚠ À prévoir" : "✖ Urgent"}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. DIAGNOSTIC */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" /> 2. Diagnostic & Mesures Jack
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={techPhotoInputRef}
              onChange={handleTechPhotoCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => techPhotoInputRef.current?.click()}
              disabled={loadingVision}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs text-cyan-400 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {loadingVision ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {loadingVision ? "Scan en cours..." : `Photo Diagbox (${techPhotos.length})`}
            </button>
          </div>
        </div>

        {techPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {techPhotos.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/40 shrink-0">
                <img src={url} alt="Preuve" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeTechPhoto(i)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 rounded text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input 
            type="text" 
            value={dtc} 
            onChange={e => setDtc(e.target.value.toUpperCase())} 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 font-mono text-xs w-48 text-amber-400 font-bold focus:border-amber-500" 
            placeholder="Codes DTC (ex: P0234)"
          />
          <input 
            type="text" 
            value={symptoms} 
            onChange={e => setSymptoms(e.target.value)} 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 text-slate-200 focus:border-blue-500" 
            placeholder="Symptômes relevés"
          />
        </div>

        <div className="min-h-[140px] max-h-[220px] overflow-y-auto bg-[#0B0F17]/80 rounded-xl p-3 border border-white/5 flex flex-col gap-2.5 text-xs">
          {messages.length === 0 ? (
            <div className="text-slate-500 text-center my-auto">Lancez le diagnostic ou photographiez l'écran de la valise.</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col max-w-[90%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
                <div className={`p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {(loadingDiag || loadingVision) && (
            <div className="text-cyan-400 flex items-center gap-1.5 text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyse des données...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="bg-black border border-slate-800 rounded-xl p-2 text-center">
            <span className="text-[10px] text-slate-500 block">Multimètre</span>
            <div className="font-mono text-sm text-emerald-400 font-bold">{voltage}</div>
          </div>
          <button 
            type="button" 
            onClick={() => handleMeasure(true)} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Conforme (5V)
          </button>
          <button 
            type="button" 
            onClick={() => handleMeasure(false)} 
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Non Conforme
          </button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)} 
            placeholder="Dictez ou tapez votre constat à Jack..." 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 text-slate-200 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isListening ? "bg-rose-600 text-white animate-pulse" : "bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-white/10"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button 
            type="button" 
            onClick={() => handleSend(input)} 
            disabled={loadingDiag || !input.trim()} 
            className="bg-blue-600 disabled:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. CONSTAT FINAL AUTOMATISÉ */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" /> 3. Constat Final & Transmission au Chef
          </h2>
          {getSecurityAnomalies().length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-300 rounded">
              +{getSecurityAnomalies().length} anomalie(s)
            </span>
          )}
        </div>

        {devisTransmis ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-xs md:text-sm text-emerald-300">Dossier transmis au Chef d'Atelier !</h3>
            <p className="text-[11px] text-slate-300">Nomenclature complète et barèmes de temps calculés.</p>
            <button onClick={() => setDevisTransmis(false)} className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer">
              Modifier le constat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={panneConstatee}
              onChange={(e) => setPanneConstatee(e.target.value)}
              rows={2}
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
              placeholder="Constat pré-rempli automatiquement par Jack..."
            />

            <button
              type="button"
              onClick={handleGenerateAndSendToChef}
              disabled={loadingDevis}
              className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              {loadingDevis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Génération du chiffrage complet...
                </>
              ) : (
                <>
                  Générer le devis complet & Transmettre au Chef
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
