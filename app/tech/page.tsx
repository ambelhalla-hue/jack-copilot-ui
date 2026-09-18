"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  Trash2 
} from "lucide-react"
import { getAllDossiers, getDossierById, updateDossierStatusAndData, saveDossierChatHistory } from "@/lib/supabase"

function AtelierTechContent() {
  const searchParams = useSearchParams()
  const requestedDossierId = searchParams?.get("dossierId")

  const [dossierId, setDossierId] = useState<string | null>(null)
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Véhicule Atelier")
  const [mileage, setMileage] = useState("120000")
  const [receptionMotif, setReceptionMotif] = useState("Diagnostic et révision")

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

  // Chargement du dossier
  useEffect(() => {
    const loadDossier = async () => {
      try {
        let active: any = null
        if (requestedDossierId) {
          active = await getDossierById(requestedDossierId)
        } else {
          const list = await getAllDossiers()
          if (list && list.length > 0) {
            active = list.find((d: any) => d.statut !== "cloture" && d.statut !== "facture") || list[0]
          }
        }

        if (active) {
          setDossierId(active.id)
          if (active.immatriculation) setPlate(active.immatriculation)
          if (active.vin) setVehicle(active.vin)
          if (active.kilometrage) setMileage(String(active.kilometrage))
          if (active.constats_technicien) {
            setReceptionMotif(active.constats_technicien)
            setPanneConstatee(active.constats_technicien)
          }
          if (active.chat_history && Array.isArray(active.chat_history) && active.chat_history.length > 0) {
            setMessages(active.chat_history)
          }
        }
      } catch (error) {
        console.error("Erreur liaison Supabase", error)
      }
    }
    loadDossier()
  }, [requestedDossierId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Dictée vocale
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
          for (let i = event.resultsIndex || 0; i < event.results.length; i++) {
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
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Envoi de message à Jack
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return
    const newMessages = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoadingDiag(true)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE ATELIER : ${vehicle} (${plate}), ${mileage} km, DTC: ${dtc}, Symptômes: ${symptoms}] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      const assistantReply = data.error ? `Erreur: ${data.error}` : data.response
      const updatedMessages = [...newMessages, { role: "assistant", content: assistantReply }]
      setMessages(updatedMessages)

      if (dossierId) {
        await saveDossierChatHistory(dossierId, updatedMessages).catch(() => {})
      }

      if (!data.error && data.response && !panneConstatee) {
        const firstLine = data.response.split("\n").find((l: string) => l.trim().length > 5) || ""
        setPanneConstatee(firstLine.replace(/[*#]/g, "").slice(0, 150))
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de communication avec Jack." }])
    } finally {
      setLoadingDiag(false)
    }
  }

  // Photo sous caisse / Valise
  const handleTechPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
            vehicleContext: `${vehicle} (${plate}, ${mileage} km)`,
            userNotes: symptoms || dtc ? `DTC: ${dtc} | ${symptoms}` : "Photo sous le pont"
          })
        })

        const data = await res.json()
        const visionText = data.result || "Aucune anomalie visible."

        const dtcMatch = visionText.match(/CODES DÉTECTÉS\s*:\s*([^\n\r]+)/i)
        if (dtcMatch && dtcMatch[1]) {
          setDtc(dtcMatch[1].trim())
        }

        const organeMatch = visionText.match(/ORGANES IDENTIFIÉS\s*:\s*([^\n\r]+)/i)
        const anomalieMatch = visionText.match(/ANOMALIE CONSTATÉE\s*:\s*([^\n\r]+)/i)
        if (organeMatch && anomalieMatch) {
          setPanneConstatee(`Remplacement : ${organeMatch[1].trim()} (${anomalieMatch[1].trim()})`)
        } else if (dtcMatch && dtcMatch[1]) {
          setPanneConstatee(`Traitement défaut valise : ${dtcMatch[1].trim()}`)
        }

        const newMessages = [
          ...messages,
          { role: "user", content: "📷 [Photo sous caisse / valise transmise à Jack]" },
          { role: "assistant", content: visionText }
        ]
        setMessages(newMessages)

        if (dossierId) {
          await saveDossierChatHistory(dossierId, newMessages).catch(() => {})
        }
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erreur analyse visuelle." }])
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
      handleSend("Mesure conforme (5V). Faisceau et ligne validés. Que contrôle-t-on ensuite ?")
    } else {
      setVoltage("0.04 V (Non conforme)")
      handleSend("Mesure non conforme (0V). Ligne coupée ou masse absente. Où chercher la cause commune ?")
    }
  }

  const handleGenerateAndSendToChef = async () => {
    const basePanne = panneConstatee.trim() || (dtc ? `Traitement défaut ${dtc}` : "Entretien et contrôles atelier")
    setLoadingDevis(true)

    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId,
          vehicle,
          immat: plate,
          kilometrage: mileage,
          panne_constatee: basePanne,
          options_travaux: "Contrôles atelier réalisés"
        })
      })

      const data = await res.json()
      if (!data.error && data.devis) {
        if (dossierId) {
          await updateDossierStatusAndData(dossierId, {
            statut: "devis_genere",
            constats_technicien: basePanne,
            devis_ia: data.devis
          })
        }
        setDevisTransmis(true)
      } else {
        alert("Erreur lors de la génération du devis.")
      }
    } catch {
      alert("Erreur de connexion au serveur.")
    } finally {
      setLoadingDevis(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-3 md:p-5 gap-4">
      {/* HEADER ATELIER */}
      <header className="p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {plate}
              </span>
              <h1 className="font-bold text-slate-100 text-sm md:text-base">{vehicle}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{mileage} km</strong> • CCS : <span className="text-slate-300">{receptionMotif}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full font-semibold">
          Poste Technicien
        </span>
      </header>

      {/* 1. CONTRÔLES SÉCURITÉ */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-emerald-400" /> 1. Contrôles Express Sécurité
          </h2>
          <span className="text-[11px] text-slate-500">Cliquez pour alterner</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { key: "pneusAV", label: "Pneus AV" },
            { key: "plaquettesAV", label: "Plaquettes AV" },
            { key: "disquesAV", label: "Disques AV" },
            { key: "batterie", label: "Batterie 12V" }
          ].map(item => {
            const val = quickChecks[item.key]
            return (
              <div key={item.key} className="bg-[#0B0F17] p-2 rounded-xl border border-white/5 flex flex-col justify-between gap-1.5">
                <span className="text-[11px] text-slate-300 font-medium">{item.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = val === "bon" ? "a_prevoir" : val === "a_prevoir" ? "urgent" : "bon"
                    setQuickChecks(prev => ({ ...prev, [item.key]: nextVal }))
                  }}
                  className={`py-1 px-2 rounded text-[10px] font-mono font-bold uppercase transition text-center ${
                    val === "bon" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800" :
                    val === "a_prevoir" ? "bg-amber-950/60 text-amber-400 border border-amber-800" :
                    "bg-rose-950/60 text-rose-400 border border-rose-800 animate-pulse"
                  }`}
                >
                  {val === "bon" ? "✓ Bon" : val === "a_prevoir" ? "⚠ À prévoir" : "✖ Urgent"}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. DIAGNOSTIC, VISION & MESURES */}
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
              className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 font-bold flex items-center gap-2 cursor-pointer transition"
            >
              {loadingVision ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <Camera className="w-4 h-4 text-cyan-400" />}
              {loadingVision ? "Analyse Jack Vision..." : "Photo Pièce / Valise"}
            </button>
          </div>
        </div>

        {techPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {techPhotos.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-cyan-500/40 shrink-0">
                <img src={url} alt="Pièce sous pont" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeTechPhoto(i)}
                  className="absolute top-0.5 right-0.5 p-1 bg-black/80 rounded text-rose-400 hover:text-rose-300"
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
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 font-mono text-xs w-36 text-amber-400 font-bold" 
            placeholder="Codes DTC"
          />
          <input 
            type="text" 
            value={symptoms} 
            onChange={e => setSymptoms(e.target.value)} 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 text-slate-200" 
            placeholder="Symptômes ou pièce suspectée..."
          />
        </div>

        {/* Historique du chat avec Jack */}
        <div className="min-h-[140px] max-h-[240px] overflow-y-auto bg-[#0B0F17]/80 rounded-xl p-3 border border-white/5 flex flex-col gap-2.5 text-xs">
          {messages.length === 0 ? (
            <div className="text-slate-500 text-center my-auto">
              Photographiez une pièce défectueuse sous le pont ou posez votre question technique à Jack.
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
          {(loadingDiag || loadingVision) && (
            <div className="text-cyan-400 flex items-center gap-1.5 text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {loadingVision ? "Jack Vision ausculte la photo..." : "Jack analyse..."}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Multimètre rapide */}
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
            <CheckCircle2 className="w-3.5 h-3.5" /> 5V Conforme
          </button>
          <button 
            type="button" 
            onClick={() => handleMeasure(false)} 
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Non Conforme
          </button>
        </div>

        {/* Champ de saisie et dictée vocale */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)} 
            placeholder="Posez une question ou commentez la pièce..." 
            className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1 text-slate-200"
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

      {/* 3. CONSTAT & TRANSMISSION */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> 3. Constat & Transmission au Chef
        </h2>

        {devisTransmis ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            <h3 className="font-bold text-xs text-emerald-300">Dossier transmis à la Tour de Contrôle !</h3>
            <button 
              onClick={() => setDevisTransmis(false)} 
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Modifier ou compléter le constat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={panneConstatee}
              onChange={(e) => setPanneConstatee(e.target.value)}
              rows={2}
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 w-full font-mono"
              placeholder="Constat pré-rempli automatiquement dès que Jack valide une pièce ou un code..."
            />

            <button
              type="button"
              onClick={handleGenerateAndSendToChef}
              disabled={loadingDevis}
              className="py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg cursor-pointer"
            >
              {loadingDevis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Génération du chiffrage...
                </>
              ) : (
                <>
                  Générer le devis & Transmettre au Chef
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

export default function AtelierTech() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-cyan-400 font-mono text-sm gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Chargement de l'Atelier...
      </div>
    }>
      <AtelierTechContent />
    </Suspense>
  )
}
