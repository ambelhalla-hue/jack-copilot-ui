"use client"

import { auditInterventionSafety } from "@/lib/safetyEngine"
import { useState, useRef, useEffect } from "react"
import { 
  Wrench, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  RefreshCw, 
  Youtube, 
  ShoppingCart, 
  ChevronUp, 
  ChevronDown,
  Car
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function MobileCockpit() {
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Peugeot 3008 II - 1.5 BlueHDi (DV5RC)")
  const [mileage, setMileage] = useState("160000")
  
  // P2 : Persistance - ID de session unique
  const [sessionId, setSessionId] = useState<string>("")
  
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "assistant",
      content: "Atelier connecté. Renseigne le code DTC ou le problème constaté sous le pont."
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // P3 : Reconnaissance et Synthèse Vocale
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialisation ID session & SpeechRecognition
  useEffect(() => {
    setSessionId(`diag_${Date.now()}`)

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

  // P3 : Lecture à voix haute de la réponse de Jack
  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()

    // Nettoyage des balises pour la voix
    const cleanSpeech = text
      .replace(/\[PIECE_CIBLE\s*:\s*.*?\]/gi, "")
      .replace(/\[OUTIL_CIBLE\s*:\s*.*?\]/gi, "")
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    utterance.lang = "fr-FR"
    utterance.rate = 1.05 // Débit direct d'atelier
    window.speechSynthesis.speak(utterance)
  }

  // P3 : Bascule écoute micro
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Dictée vocale non supportée sur ce navigateur (utilisez Chrome).")
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

  // P1 : Parsing des balises d'affiliation
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

  // Envoi du message + P2 : Sauvegarde incrémentale Supabase
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

      // Lecture vocale Jack
      if (!data.error) {
        speakText(reply)
      }

      // P2 : Enregistrement dans dossiers_atelier (chat_history)
      if (supabase && sessionId) {
        supabase
          .from("dossiers_atelier")
          .upsert({
            id: sessionId,
            immatriculation: plate,
            kilometrage: parseInt(mileage) || 0,
            chat_history: updatedHistory,
            constats_technicien: reply.slice(0, 500),
            statut: "en_diagnostic",
            updated_at: new Date().toISOString()
          })
          .then(({ error }: any) => {
            if (error) console.error("Erreur persistance Supabase:", error.message)
          })
      }

    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Liaison interrompue avec Jack." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen w-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* BANDEAU SUPÉRIEUR COMPACT */}
      <header className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-xs font-bold px-2 py-1 bg-blue-950 border border-blue-700/60 text-blue-400 rounded shrink-0">
            {plate}
          </span>
          <p className="text-xs text-slate-200 font-medium truncate">
            {vehicle}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
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

              {/* P1 : BOUTONS MARCHANDS ET TUTO CIBLÉS */}
              {msg.role === "assistant" && idx > 0 && !msg.content.includes("Erreur") && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <a 
                    href={`https://www.youtube.com/results?search_query=tuto+remplacement+${encodeURIComponent(piece || vehicle)}+${encodeURIComponent(vehicle)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-950/40 text-red-400 border border-red-900/60 px-2.5 py-1 rounded-lg hover:bg-red-900/40"
                  >
                    <Youtube className="w-3.5 h-3.5" /> Tuto Vidéo
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

      {/* TIROIR BAS RETRACTABLE */}
      <div className="bg-slate-900 border-t border-slate-800 shrink-0">
        <button 
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full py-1.5 px-4 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200"
        >
          <span className="flex items-center gap-2 font-mono">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> Nomenclature & Devis estimé
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
            <button className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-sans font-bold text-xs">
              Partager Devis Client (PDF / SMS)
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
