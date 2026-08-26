"use client"
import { useState, useRef, useEffect } from "react"
import { ShieldCheck, Wrench, Send, RefreshCw, Camera, Video, ShoppingCart, Car, Cpu } from "lucide-react"

export default function Home() {
  const [plate, setPlate] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [mileage, setMileage] = useState("")
  const [dtc, setDtc] = useState("")
  const [symptoms, setSymptoms] = useState("")
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return

    const newMessages = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE ATELIER : Véhicule ${vehicle || 'Non précisé'} (Plaque: ${plate || 'Non précisée'}), Kilométrage: ${mileage || 'Non précisé'} km, DTC: ${dtc || 'Non précisé'}, Symptômes: ${symptoms || 'Non précisés'}] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.error ? `Erreur: ${data.error}` : data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion au réseau de l'atelier." }])
    } finally {
      setLoading(false)
    }
  }

  const extractPiece = (text: string) => {
    const match = text.match(/\[PIECE_CIBLE:\s*(.+?)\]/i)
    return match ? match[1].trim() : dtc
  }

  const cleanText = (text: string) => {
    return text.replace(/\[PIECE_CIBLE:\s*(.+?)\]/i, "").trim()
  }

  const getYoutubeLink = (text: string) => {
    const searchTerms = `tuto reparation ${vehicle} ${extractPiece(text)} en francais`
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`
  }
  
  const getPartsLink = (text: string) => {
    return `https://www.auto-doc.fr/search?keyword=${encodeURIComponent(vehicle)}+${encodeURIComponent(extractPiece(text))}`
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-2xl mx-auto shadow-2xl relative selection:bg-blue-500/30">
      
      {/* HEADER: Glassmorphism effect */}
      <header className="sticky top-0 z-50 flex justify-between items-center p-4 border-b border-white/5 bg-[#0B0F17]/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight">
          <Cpu className="w-6 h-6 text-cyan-400" /> Jack Copilot
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400/90 uppercase tracking-widest font-semibold">Connecté</span>
        </div>
      </header>

      {/* DASHBOARD INPUTS: Premium Cards */}
      <section className="p-5 flex flex-col gap-4 bg-gradient-to-b from-white/[0.02] to-transparent border-b border-white/5">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <input type="text" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="bg-[#111827] border border-slate-700/60 rounded-xl px-4 py-3 font-mono uppercase w-full text-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-300 pr-10 shadow-inner" placeholder="Plaque"/>
            <Camera className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 cursor-pointer group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="relative flex-[2]">
            <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} className="bg-[#111827] border border-slate-700/60 rounded-xl px-4 py-3 text-sm w-full text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-300 pr-10 shadow-inner" placeholder="Modèle et Motorisation"/>
            <Car className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
          </div>
          <div className="relative flex-1 group">
            <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} className="bg-[#111827] border border-slate-700/60 rounded-xl px-4 py-3 text-sm w-full font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 pr-10 shadow-inner" placeholder="Km réel"/>
            <Camera className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 cursor-pointer group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>

        <div className="flex gap-3">
          <input type="text" value={dtc} onChange={e => setDtc(e.target.value.toUpperCase())} className="bg-[#111827] border border-slate-700/60 rounded-xl px-4 py-3 font-mono text-sm w-32 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all duration-300 shadow-inner" placeholder="Ex: P0234"/>
          <input type="text" value={symptoms} onChange={e => setSymptoms(e.target.value)} className="bg-[#111827] border border-slate-700/60 rounded-xl px-4 py-3 text-sm flex-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-300 shadow-inner" placeholder="Symptômes constatés"/>
        </div>
        
        {messages.length === 0 && (
          <button onClick={() => handleSend("J'ai ce véhicule en atelier. Par quoi on commence ?")} className="mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] border border-white/10 group">
            <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Lancer le diagnostic IA
          </button>
        )}
      </section>

      {/* CHAT AREA */}
      <section className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-[300px] scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-slate-500/60 text-sm mt-auto mb-auto font-medium">
            Entrez les paramètres du véhicule pour initialiser le système.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col max-w-[88%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <span className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">{msg.role === "user" ? "Mécanicien" : "Jack (IA)"}</span>
            <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-md ${msg.role === "user" ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm" : "bg-[#1A2332] border border-slate-700/50 text-slate-200 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]"}`}>
              {msg.role === "assistant" ? cleanText(msg.content) : msg.content}
            </div>
            
            {msg.role === "assistant" && !msg.content.includes("Erreur") && (
              <div className="flex gap-3 mt-3">
                <a href={getYoutubeLink(msg.content)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors shadow-sm">
                  <Video className="w-3.5 h-3.5" /> Tutoriel Vidéo
                </a>
                <a href={getPartsLink(msg.content)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors shadow-sm">
                  <ShoppingCart className="w-3.5 h-3.5" /> Catalogue Pièces
                </a>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="self-start flex items-center gap-3 text-cyan-400 text-sm p-4 bg-[#1A2332]/80 backdrop-blur border border-cyan-900/30 rounded-2xl rounded-tl-sm shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin" /> Traitement des données en cours...
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* FOOTER INPUT */}
      <section className="p-4 bg-[#0B0F17]/90 backdrop-blur-md border-t border-white/5">
        <div className="flex gap-2 relative">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)} 
            placeholder="Ex: J'ai mesuré 5V, on fait quoi ?" 
            className="bg-[#111827] border border-slate-700/60 rounded-xl px-5 py-3.5 text-sm flex-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner"
          />
          <button 
            onClick={() => handleSend(input)} 
            disabled={loading || !input.trim()} 
            className="bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-emerald-500 text-white p-3.5 rounded-xl flex justify-center items-center transition-all shadow-[0_0_15px_rgba(5,150,105,0.2)] hover:shadow-[0_0_20px_rgba(5,150,105,0.4)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </section>
    </main>
  )
}
