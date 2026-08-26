"use client"
import { useState, useRef, useEffect } from "react"
import { ShieldCheck, Wrench, Send, RefreshCw, Camera, Youtube, ShoppingCart, Car } from "lucide-react"

export default function Home() {
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Peugeot 3008 II - 1.5 BlueHDi")
  const [mileage, setMileage] = useState("")
  const [dtc, setDtc] = useState("P0234")
  const [symptoms, setSymptoms] = useState("Perte de puissance sous charge")
  
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
      // Injection du contexte invisible pour le premier message
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE ATELIER : Véhicule ${vehicle} (Plaque: ${plate}), Kilométrage: ${mileage || 'Non précisé'} km, DTC: ${dtc}, Symptômes: ${symptoms}] \n\n${apiMessages[0].content}`
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

  // Générateurs de liens intelligents pour la Boîte à Outils
  const getYoutubeLink = () => `https://www.youtube.com/results?search_query=tuto+reparation+${encodeURIComponent(vehicle)}+${encodeURIComponent(dtc)}`
  const getPartsLink = () => `https://www.auto-doc.fr/search?keyword=${encodeURIComponent(vehicle)}+${encodeURIComponent(dtc)}`

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-2xl mx-auto shadow-2xl">
      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Wrench className="w-5 h-5" /> Jack Copilot
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono">Niveau 1 Actif</span>
      </header>

      {/* Bandeau de Saisie Rapide (Préparé pour OCR) */}
      <section className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input type="text" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono uppercase w-full text-blue-400 text-sm focus:border-blue-500 pr-10" placeholder="Plaque"/>
            <Camera className="w-4 h-4 text-slate-500 absolute right-3 top-3 cursor-pointer hover:text-blue-400 transition" />
          </div>
          <div className="relative flex-[2]">
            <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-blue-500 pr-10" placeholder="Modèle et Motorisation"/>
            <Car className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full text-emerald-400 focus:border-emerald-500 pr-10" placeholder="Km réel"/>
            <Camera className="w-4 h-4 text-slate-500 absolute right-3 top-3 cursor-pointer hover:text-emerald-400 transition" />
          </div>
        </div>

        <div className="flex gap-2">
          <input type="text" value={dtc} onChange={e => setDtc(e.target.value.toUpperCase())} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm w-28 text-amber-400 font-bold focus:border-amber-500" placeholder="Code DTC"/>
          <input type="text" value={symptoms} onChange={e => setSymptoms(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm flex-1 focus:border-blue-500" placeholder="Symptômes constatés"/>
        </div>
        
        {messages.length === 0 && (
          <button onClick={() => handleSend("J'ai ce véhicule en atelier. Par quoi on commence ?")} className="mt-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/30">
            <ShieldCheck className="w-5 h-5" /> Lancer le diagnostic IA
          </button>
        )}
      </section>

      {/* Zone de Chat Interactive */}
      <section className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-auto mb-auto">Le diagnostic pas-à-pas s'affichera ici.</div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <span className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">{msg.role === "user" ? "Vous" : "Jack (Chef d'Atelier)"}</span>
            <div className={`p-3.5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"}`}>
              {msg.content}
            </div>
            
            {/* Boîte à outils contextuelle */}
            {msg.role === "assistant" && !msg.content.includes("Erreur") && (
              <div className="flex gap-2 mt-2">
                <a href={getYoutubeLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold bg-red-950/50 text-red-400 border border-red-900/50 px-2 py-1.5 rounded hover:bg-red-900/50 transition">
                  <Youtube className="w-3 h-3" /> Tuto Vidéo
                </a>
                <a href={getPartsLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold bg-amber-950/50 text-amber-400 border border-amber-900/50 px-2 py-1.5 rounded hover:bg-amber-900/50 transition">
                  <ShoppingCart className="w-3 h-3" /> Pièces Associées
                </a>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="self-start flex items-center gap-2 text-slate-400 text-sm p-3 bg-slate-800/50 rounded-lg">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Jack consulte la base de données...
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Barre de saisie "Mains Libres" */}
      <section className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)} 
            placeholder="Ex: J'ai mesuré 5V, on fait quoi ? ou Plaquettes usées à 70%..." 
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm flex-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={() => handleSend(input)} 
            disabled={loading || !input.trim()} 
            className="bg-emerald-600 disabled:bg-slate-800 hover:bg-emerald-500 text-white p-3 rounded-lg flex justify-center items-center transition shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </section>
    </main>
  )
}
