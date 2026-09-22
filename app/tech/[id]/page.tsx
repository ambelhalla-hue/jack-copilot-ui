"use client"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { 
  Wrench, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  RefreshCw, 
  Video, 
  ShoppingCart, 
  ChevronUp, 
  ChevronDown,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2
} from "lucide-react"
import { getDossierById, updateDossierStatusAndData, supabase } from "@/lib/supabase"
import { auditInterventionSafety } from "@/lib/safetyEngine"

export default function AtelierTechIntervention({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const dossierId = resolvedParams.id

  const [loadingInit, setLoadingInit] = useState(true)
  const [plate, setPlate] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [mileage, setMileage] = useState("0")
  
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  // Reconnaissance et Synthèse Vocale
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Chargement du dossier sélectionné
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }

      try {
        const dossier = await getDossierById(dossierId)
        if (dossier) {
          setPlate(dossier.immatriculation)
          setVehicle(dossier.vin || "Véhicule client")
          setMileage(dossier.kilometrage ? dossier.kilometrage.toString() : "0")

          if (dossier.chat_history && dossier.chat_history.length > 0) {
            setMessages(dossier.chat_history)
          } else {
            setMessages([
              {
                role: "assistant",
                content: `Véhicule ${dossier.immatriculation} sur le pont. Demande client : "${dossier.constats_technicien || 'Contrôle'}". Renseigne le code DTC ou le problème relevé.`
              }
            ])
          }
        }
      } catch (err) {
        console.error("Erreur chargement dossier:", err)
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [dossierId])

  // Initialisation reconnaissance vocale
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = "fr-FR"
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(prev => (prev ? `${prev} ` : "") + transcript)
          setIsListening(false)
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Synthèse vocale Jack
  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()

    const cleanSpeech = text
      .replace(/\[PIECE_CIBLE\s*:\s*.*?\]/gi, "")
      .replace(/\[OUTIL_CIBLE\s*:\s*.*?\]/gi, "")
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    utterance.lang = "fr-FR"
    utterance.rate = 1.05
    window.speechSynthesis.speak(utterance)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Dictée vocale non supportée sur ce navigateur.")
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

  const extractTag = (text: string, tag: "PIECE_CIBLE" | "OUTIL_CIBLE") => {
    const regex = new RegExp(`\\[${tag}\\s*:\\s*(.*?)\\]`, "i")
    const match = text.match(regex)
    return match ? match[1].trim() : null
  }

  const cleanDisplayContent = (text: string) => {
    return text
      .replace(/\[PIECE_CIBLE\s*:\s*.*?\]/gi, "")
      .replace(/\[OUTIL_CIBLE\s*:\s*.*?\]/gi, "")
      .trim()
  }

  // Envoi d'un message + Persistance dans le dossier
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return

    const newMessages = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      if (apiMessages.length === 2) {
        apiMessages[0].content = `[CONTEXTE : Véhicule ${vehicle} (${plate}), Kilométrage: ${mileage} km] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      const reply = data.error ? `Erreur: ${data.error}` : data.response
      const updatedHistory = [...newMessages, { role: "assistant", content: reply }]
      setMessages(updatedHistory)

      if (!data.error) {
        speakText(reply)
      }

      // Sauvegarde continue dans le dossier Supabase
      await updateDossierStatusAndData(dossierId, {
        chat_history: updatedHistory,
        constats_technicien: reply.slice(0, 500)
      })

    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Liaison interrompue avec Jack." }])
    } finally {
      setLoading(false)
    }
  }

  // Clôture du dossier ➔ Déplacement vers les Archives
  const handleCloseIntervention = async () => {
    if (!confirm("Confirmer la fin d'intervention ? Le véhicule passera dans les archives.")) return
    setClosing(true)

    try {
      await updateDossierStatusAndData(dossierId, {
        statut: "termine",
        chat_history: messages
      })
      router.push("/")
    } catch (err: any) {
      alert("Erreur lors de la clôture : " + err.message)
      setClosing(false)
    }
  }

  if (loadingInit) {
    return (
      <main className="h-screen w-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Chargement du dossier d'atelier...
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* BANDEAU SUPÉRIEUR COMPACT */}
      <header className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <button 
            type="button" 
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white bg-slate-950 shrink-0"
            title="Retour au Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs font-bold px-2 py-1 bg-blue-950 border border-blue-700/60 text-blue-400 rounded shrink-0">
            {plate}
          </span>
          <p className="text-xs text-slate-200 font-medium truncate">
            {vehicle}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-1.5 rounded-lg border text-xs ${speechEnabled ? "border-emerald-800 text-emerald-400 bg-emerald-950/60" : "border-slate-800 text-slate-500 bg-slate-950"}`}
            title={speechEnabled ? "Voix Jack activée" : "Voix Jack coupée"}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-1 rounded">
            {mileage} km
          </span>
        </div>
      </header>

      {/* ZONE DE CONVERSATION XXL */}
      <section className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const piece = msg.role === "assistant" ? extractTag(msg.content, "PIECE_CIBLE") : null
          const outil = msg.role === "assistant" ? extractTag(msg.content, "OUTIL_CIBLE") : null
          const textClean = cleanDisplayContent(msg.content)

          return (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[88%] ${msg.role === "user" ? "self-end items-end ml-auto" : "self-start items-start mr-auto"}`}
            >
              <span className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">
                {msg.role === "user" ? "Mécano" : "Jack"}
              </span>

              <div 
                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                }`}
              >
                {textClean}
              </div>

              {/* BOUTONS D'ACTION MARCHANDS */}
              {msg.role === "assistant" && idx > 0 && !msg.content.includes("Erreur") && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <a 
                    href={`https://www.youtube.com/results?search_query=tuto+remplacement+${encodeURIComponent(piece || vehicle)}+${encodeURIComponent(vehicle)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-950/40 text-red-400 border border-red-900/60 px-2.5 py-1 rounded-lg hover:bg-red-900/40"
                  >
                    <Video className="w-3.5 h-3.5" /> Tuto Vidéo
                  </a>

                  {piece && (
                    <a 
                      href={`https://www.auto-doc.fr/search?keyword=${encodeURIComponent(piece)}+${encodeURIComponent(vehicle)}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 px-2.5 py-1 rounded-lg hover:bg-emerald-900/40"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> {piece}
                    </a>
                  )}

                  {outil && (
                    <a 
                      href={`https://www.amazon.fr/s?k=${encodeURIComponent(outil)}&tag=jackcopilot-21`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-900/60 px-2.5 py-1 rounded-lg hover:bg-amber-900/40"
                    >
                      <Wrench className="w-3.5 h-3.5" /> {outil} (24h)
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="self-start flex items-center gap-2 text-slate-400 text-xs p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> Jack analyse les données...
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* TIROIR BAS RETRACTABLE AVEC BOUTON CLÔTURE */}
      <div className="bg-slate-900 border-t border-slate-800 shrink-0">
        <button 
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full py-1.5 px-4 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200"
        >
          <span className="flex items-center gap-2 font-mono">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> Nomenclature & Clôture
          </span>
          {drawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {drawerOpen && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-xs font-mono space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Main-d'œuvre barémée (Taux 75 €/h)</span>
              <span className="text-emerald-400 font-bold">1,40 h • 105,00 €</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Fournitures & consommables</span>
              <span className="text-emerald-400 font-bold">18,50 €</span>
            </div>

            {/* AUDIT SÉCURITÉ DÉTERMINISTE (P4) */}
            {(() => {
              const detectedParts = messages
                .filter(m => m.role === "assistant")
                .map(m => extractTag(m.content, "PIECE_CIBLE") || "")
                .filter(Boolean)
              
              const audit = auditInterventionSafety(detectedParts)
              if (audit.warnings.length === 0 && audit.mandatoryParts.length === 0) return null

              return (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Garde-fou Sécurité Métier
                  </span>
                  {audit.warnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-rose-300 font-sans leading-tight">
                      • {w}
                    </p>
                  ))}
                  {audit.mandatoryParts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] text-amber-300 font-mono pt-1">
                      <span>+ {p.designation}</span>
                      <span className="bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">Inclus d'office</span>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* BOUTON CLÔTURE INTERVENTION */}
            <button 
              onClick={handleCloseIntervention}
              disabled={closing}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg font-sans font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              {closing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terminer l'intervention (Archiver)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* BARRE DE COMMANDE SOUS LE POUCE */}
        <div className="p-3 flex items-center gap-2">
          <button 
            type="button"
            className="p-3 bg-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center shrink-0"
            title="Prendre une photo de la valise ou de la pièce"
          >
            <Camera className="w-5 h-5" />
          </button>

          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder={isListening ? "Jack écoute..." : "Ex : 0 V sur la pin 3 / durite percée..."} 
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm flex-1 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button 
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition ${
              isListening 
                ? "bg-rose-600 text-white animate-pulse" 
                : "bg-slate-800 text-blue-400 hover:text-blue-300"
            }`}
            title="Dicter en mains sales"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => handleSend(input)} 
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center shrink-0 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </main>
  )
}
