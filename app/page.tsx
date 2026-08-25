"use client"
import { useState, useRef, useEffect } from "react"
import { ShieldCheck, Wrench, Send, RefreshCw } from "lucide-react"

export default function Home() {
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Peugeot 3008 II - 1.5 BlueHDi")
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
      // Contexte invisible envoyé à Jack pour le premier message
      if (apiMessages.length === 1) {
        apiMessages[0].content = `[CONTEXTE : Véhicule ${vehicle} (${plate}), DTC ${dtc}, Symptômes: ${symptoms}] \n\n${apiMessages[0].content}`
      }

      const res = await fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.error ? `Erreur: ${data.error}` : data.response 
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de réseau. Impossible de contacter Jack." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-2xl mx-auto shadow-2xl">
      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Wrench className="w-5 h-5" /> Jack Copilot
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono">En ligne</span>
      </header>

      <section className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex gap-2">
          <input type="text" value={plate} onChange={e => setPlate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 font-mono uppercase text-center w-28 text-blue-400 text-sm focus:border-blue-500" placeholder="Plaque"/>
          <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm flex-1 focus:border-blue-500" placeholder="Modèle et Moteur"/>
        </div>
        <div className="flex gap-2">
          <input type="text" value={dtc} onChange={e => setDtc(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 font-mono text-sm w-28 text-amber-400 focus:border-amber-500" placeholder="Code DTC"/>
          <input type="text" value={symptoms} onChange={e => setSymptoms(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm flex-1 focus:border-blue-500" placeholder="Symptômes"/>
        </div>
        {messages.length === 0 && (
          <button onClick={() => handleSend("J'ai ce véhicule en atelier. Par quoi on commence ?")} className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition">
            <ShieldCheck className="w-5 h-5" /> Lancer le diagnostic
          </button>
        )}
      </section>

      <section className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">
            L'historique du diagnostic interactif apparaîtra ici.
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <span className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">{msg.role === "user" ? "Vous" : "Jack (Chef d'Atelier)"}</span>
            <div className={`p-3.5 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="self-start flex items-center gap-2 text-slate-400 text-sm p-3">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Jack réfléchit...
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      <section className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ex: C'est fait, j'ai 5V. On fait quoi ?"
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm flex-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={() => handleSend(input)} 
            disabled={loading || !input.trim()}
            className="bg-emerald-600 disabled:bg-slate-700 hover:bg-emerald-500 text-white p-3 rounded-lg flex justify-center items-center transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </section>
    </main>
  )
}
