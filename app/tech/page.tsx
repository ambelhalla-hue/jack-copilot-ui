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
  ArrowLeft
} from "lucide-react"
import { getAllDossiers, type DossierAtelier } from "@/lib/supabase"

interface MessageTurn {
  role: "user" | "model"
  content: string
}

interface QuickCheckStatus {
  [key: string]: "bon" | "usure" | "critique"
}

export default function AtelierTech() {
  const [dossiers, setDossiers] = useState<DossierAtelier[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedDossier, setSelectedDossier] = useState<DossierAtelier | null>(null)

  const [plate, setPlate] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [mileage, setMileage] = useState("")
  const [receptionMotif, setReceptionMotif] = useState("")

  const [dtc, setDtc] = useState("P0234")
  const [symptoms, setSymptoms] = useState("")
  const [messages, setMessages] = useState<MessageTurn[]>([])
  const [input, setInput] = useState("")
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [voltage, setVoltage] = useState("Attente de mesure...")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const [quickChecks, setQuickChecks] = useState<QuickCheckStatus>({
    pneusAV: "bon",
    pneusAR: "bon",
    plaquettesAV: "bon",
    disquesAV: "bon",
    plaquettesAR: "bon",
    disquesAR: "bon",
    batterie: "bon",
  })

  const [techPhotos, setTechPhotos] = useState<string[]>([])
  const techPhotoInputRef = useRef<HTMLInputElement>(null)

  const [panneConstatee, setPanneConstatee] = useState("")
  const [loadingDevis, setLoadingDevis] = useState(false)
  const [devisTransmis, setDevisTransmis] = useState(false)
  const [diagError, setDiagError] = useState<string | null>(null)

  const checkLabels: Record<string, string> = {
    pneusAV: "Pneus AV",
    pneusAR: "Pneus AR",
    plaquettesAV: "Plaquettes AV",
    disquesAV: "Disques AV",
    plaquettesAR: "Plaquettes AR",
    disquesAR: "Disques/Tambours AR",
    batterie: "Batterie 12V",
  }

  const getSecurityAnomalies = (): string[] => {
    const list: string[] = []
    Object.entries(quickChecks).forEach(([key, val]) => {
      if (val === "urgent") list.push(`${checkLabels[key]} (URGENT)`)
      if (val === "a_prevoir") list.push(`${checkLabels[key]} (À PRÉVOIR)`)
    })
    return list
  }

  const loadDossiersList = async (): Promise<void> => {
    setLoadingList(true)
    try {
      const list = await getAllDossiers()
      setDossiers(list || [])
    } catch (err) {
      console.error("Erreur chargement Supabase:", err)
      setDossiers([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadDossiersList()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || 
                                  (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = "fr-FR"

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript.trim()) {
            setInput(prev => {
              const cleanPrev = prev.trim()
              return cleanPrev ? `${cleanPrev} ${finalTranscript.trim()}` : finalTranscript.trim()
            })
          }
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  const toggleListening = (): void => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSelectVehicle = (d: DossierAtelier): void => {
    setSelectedDossier(d)
    setPlate(d.immatriculation)
    setVehicle(d.vin || "Véhicule client")
    setMileage(d.kilometrage ? d.kilometrage.toString() : "")
    setReceptionMotif(d.constats_technicien || "Entretien courant")
    setSymptoms(d.constats_technicien || "")
    setPanneConstatee(d.constats_technicien || "")
    setMessages([])
    setDiagError(null)
  }

  const handleBackToList = (): void => {
    setSelectedDossier(null)
    loadDossiersList()
  }

  const handleSend = async (textToSend: string): Promise<void> => {
    if (!textToSend.trim()) return

    const newMessages: MessageTurn[] = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoadingDiag(true)
    setDiagError(null)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE ATELIER : Véhicule ${vehicle} (${plate}), ${mileage} km, DTC: ${dtc}, Symptômes: ${symptoms}] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json() as Record<string, unknown>
      const errorMsg = typeof data.error === 'string' ? data.error : undefined
      const responseMsg = typeof data.response === 'string' ? data.response : undefined
      
      setMessages(prev => [...prev, { role: "model", content: errorMsg ? `Erreur: ${errorMsg}` : responseMsg || "Pas de réponse" }])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue"
      setMessages(prev => [...prev, { role: "model", content: "Erreur de connexion au serveur de diagnostic." }])
      setDiagError(errorMsg)
    } finally {
      setLoadingDiag(false)
    }
  }

  const handleMeasure = (conform: boolean): void => {
    if (conform) {
      setVoltage("5.02 V (Conforme)")
      handleSend("Mesure conforme (5V). Faisceau et alimentation validés. Quelle est la suite ?")
    } else {
      setVoltage("0.04 V (Non conforme)")
      handleSend("Mesure non conforme. Absence de tension relevée. Que vérifier ensuite ?")
    }
  }

  const handleTechPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setTechPhotos(prev => [...prev, previewUrl])
    }
  }

  const removeTechPhoto = (idx: number): void => {
    setTechPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleGenerateAndSendToChef = async (): Promise<void> => {
    setLoadingDevis(true)
    setDiagError(null)
    const anomalies = getSecurityAnomalies()
    
    let basePanne = panneConstatee.trim()
    if (!basePanne || basePanne.length < 2) {
      basePanne = `Intervention défaut ${dtc} (${symptoms})`
    }

    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: selectedDossier?.id || null,
          vehicle: vehicle || "Véhicule Atelier",
          immat: plate || "AA-123-BB",
          kilometrage: mileage || "100000",
          panne_constatee: basePanne,
          options_travaux: anomalies.length > 0 ? anomalies.join(", ") : "Contrôles conformes"
        })
      })

      const data = await res.json() as Record<string, unknown>

      if (data && data.devis) {
        setDevisTransmis(true)
      } else {
        const errorMsg = typeof data?.error === 'string' ? data.error : "Réponse invalide"
        setDiagError(errorMsg)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue"
      setDiagError(errorMsg)
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

  if (!selectedDossier) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-4 md:p-6 gap-5">
        <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base md:text-lg">File d'Attente Atelier</h1>
              <p className="text-xs text-slate-400">Sélectionnez le véhicule à prendre en charge</p>
            </div>
          </div>
          <button
            onClick={loadDossiersList}
            disabled={loadingList}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin text-cyan-400" : ""}`} /> Actualiser
          </button>
        </header>

        {loadingList ? (
          <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> Chargement des véhicules...
          </div>
        ) : dossiers.length === 0 ? (
          <div className="text-center py-12 bg-[#111827]/40 border border-white/5 rounded-2xl text-slate-400 text-xs">
            Aucun véhicule en attente. Créez une entrée sur l'écran Réception (/ccs).
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dossiers.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectVehicle(d)}
                className="bg-[#111827]/80 border border-white/10 hover:border-cyan-500/50 p-4 rounded-2xl flex justify-between items-center gap-4 cursor-pointer transition-all duration-200 shadow-lg group hover:bg-slate-900"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-950 border border-blue-700/50 text-blue-400 rounded-lg">
                      {d.immatriculation}
                    </span>
                    <h3 className="font-bold text-slate-200 text-sm truncate group-hover:text-cyan-300">
                      {d.vin || "Véhicule client"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    Motif : <span className="text-slate-300">{d.constats_technicien || "Non précisé"}</span>
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{d.kilometrage ? `${d.kilometrage.toLocaleString("fr-FR")} km` : "Km non renseigné"}</span>
                    <span>• {d.photos_tour_vehicule?.length || 0} photo(s) CCS</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform">
                  Prendre en charge <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-3 md:p-5 gap-4 selection:bg-blue-500/30">
      
      <header className="p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToList}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition cursor-pointer"
            title="Changer de véhicule"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {plate}
              </span>
              <h1 className="font-bold text-slate-100 text-sm md:text-base">{vehicle}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{mileage} km</strong> • Motif : <span className="text-slate-300">{receptionMotif}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full font-semibold">
          Poste Technicien
        </span>
      </header>

      {/* 1. POINTS DE CONTRÔLE EXPRESS */}
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

      {/* 2. RECHERCHE DE PANNE & PHOTOS DIAGBOX */}
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
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs text-cyan-400 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" /> Photo Diagbox ({techPhotos.length})
            </button>
          </div>
        </div>

        {techPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {techPhotos.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/40 shrink-0">
                <img src={url} alt="Preuve diag" className="w-full h-full object-cover" />
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
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 font-mono text-xs w-28 text-amber-400 font-bold focus:border-amber-500" 
            placeholder="Code DTC"
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
            <div className="text-slate-500 text-center my-auto">
              Lancez le diagnostic ou posez une question technique à Jack.
            </div>
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
          {loadingDiag && (
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
            placeholder="Dictez ou tapez votre question à Jack..." 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 text-slate-200 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isListening ? "bg-rose-600 text-white animate-pulse" : "bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-white/10"
            }`}
            title="Activer la dictée vocale"
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

      {/* 3. CONSTAT & TRANSMISSION AU CHEF */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> 3. Constat Final & Transmission au Chef
        </h2>

        {devisTransmis ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-xs md:text-sm text-emerald-300">Dossier et contrôles transmis au Chef d'Atelier !</h3>
            <p className="text-[11px] text-slate-300">
              Le chiffrage complet a été calculé et attend validation sur la tour de contrôle.
            </p>
            <button
              onClick={() => setDevisTransmis(false)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
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
              placeholder="Ex: Remplacement amortisseurs avant + coupelles..."
            />

            <button
              type="button"
              onClick={handleGenerateAndSendToChef}
              disabled={loadingDevis || !panneConstatee.trim()}
              className={`py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                !loadingDevis && panneConstatee.trim()
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {loadingDevis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Transmission du devis en cours...
                </>
              ) : (
                <>
                  Générer le devis IA & Transmettre au Chef
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
