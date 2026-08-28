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
  Trash2
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

export default function AtelierTech() {
  const [dossierId, setDossierId] = useState<string | null>(null)
  const [plate, setPlate] = useState("AA-123-BB")
  const [vehicle, setVehicle] = useState("Peugeot 308 II - 1.5 BlueHDi 130")
  const [mileage, setMileage] = useState("120000")
  const [receptionMotif, setReceptionMotif] = useState("Inspection demandée")

  // Chargement du dossier actif depuis Supabase
  useEffect(() => {
    const loadDossier = async () => {
      try {
        const list = await getAllDossiers()
        if (list && list.length > 0) {
          const active = list.find((d: any) => d.statut !== "valide_chef" && d.statut !== "valide_client") || list[0]
          setDossierId(active.id)
          if (active.immatriculation) setPlate(active.immatriculation)
          if (active.vin) setVehicle(active.vin)
          if (active.kilometrage) setMileage(active.kilometrage)
          if (active.motifCCS) setReceptionMotif(active.motifCCS)
        }
      } catch (error) {
        console.error("Erreur de liaison Supabase", error)
      }
    }
    loadDossier()
  }, [])

  const [dtc, setDtc] = useState("P0234")
  const [symptoms, setSymptoms] = useState("Perte de puissance sous charge")
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState("")
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [voltage, setVoltage] = useState("Attente de mesure...")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const [quickChecks, setQuickChecks] = useState({
    pneusAV: "bon", pneusAR: "bon", plaquettesAV: "bon", plaquettesAR: "bon",
    disquesAV: "bon", disquesAR: "bon", batterie: "bon"
  })

  const [techPhotos, setTechPhotos] = useState<string[]>([])
  const techPhotoInputRef = useRef<HTMLInputElement>(null)

  const [panneConstatee, setPanneConstatee] = useState("")
  const [loadingDevis, setLoadingDevis] = useState(false)
  const [devisTransmis, setDevisTransmis] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false // Empêche la répétition des syllabes
        recognition.lang = "fr-FR"

        recognition.onresult = (event: any) => {
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
    if (!textToSend.trim()) return
    const newMessages = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    setInput("")
    setLoadingDiag(true)

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
      
      const data = await res.json()
      const assistantText = data.error ? `Erreur: ${data.error}` : data.response
      setMessages(prev => [...prev, { role: "assistant", content: assistantText }])

      // Auto-remplissage du constat si Jack formule sa recommandation
      if (!data.error && data.response) {
        setPanneConstatee(data.response.slice(0, 300))
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion au serveur de diagnostic." }])
    } finally {
      setLoadingDiag(false)
    }
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

  const handleTechPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setTechPhotos(prev => [...prev, previewUrl])
    }
  }

  const removeTechPhoto = (idx: number) => {
    setTechPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { dossierId, vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const tauxT1 = 75.00
    const tauxT2 = 95.00

    const userPrompt = `Génère le chiffrage en JSON STRICT (sans markdown, sans texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - ${kilometrage || "120000"} km
Panne mécanique : ${panne_constatee || "Remplacement pièces"}
Contrôles sécurité : ${options_travaux || "Non spécifié"}

RÈGLES :
1. Crée une ligne dans "pieces_principales" pour la panne ET pour chaque anomalie signalée.
2. Disques à remplacer = Disques ET plaquettes obligatoires.
3. Rédige dans "constat_court" UNIQUEMENT la liste des pièces à remplacer (ex: "À remplacer : Amortisseurs AV + Coupelles").

Format JSON attendu :
{
  "constat_court": "À remplacer : Amortisseurs avant + Coupelles",
  "pieces_principales": [
    { "id": "1", "designation": "Jeu d'amortisseurs avant", "ref": "OEM-AMORT", "quantite": 1, "prix_unitaire_ht": 160.00 },
    { "id": "2", "designation": "Kit coupelles de suspension avant", "ref": "OEM-COUP", "quantite": 1, "prix_unitaire_ht": 45.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Kit visserie neuve & fournitures atelier", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 12.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Remplacement amortisseurs avant et réglage géométrie", "heures": 2.20, "taux_horaire_ht": ${tauxT2} }
  ]
}`

    let devis: any = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        }
      )

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText) devis = JSON.parse(rawText)
    } catch (e) {
      console.error("Erreur parsing IA", e)
    }

    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        constat_court: panne_constatee || "Remplacement pièces défectueuses",
        pieces_principales: [
          { id: "1", designation: panne_constatee || "Organe principal de rechange", ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 120.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures atelier & consommables", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 8.50 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Main-d'œuvre intervention atelier", heures: 1.20, taux_horaire_ht: tauxT1 }
        ]
      }
    }

    const totalPiecesHT = (devis.pieces_principales || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalFournituresHT = (devis.peripheriques || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalMoHT = (devis.main_oeuvre || []).reduce((acc: number, m: any) => acc + (Number(m.heures || 0) * Number(m.taux_horaire_ht || tauxT1)), 0)

    const totalHT = totalPiecesHT + totalFournituresHT + totalMoHT
    const tva = totalHT * 0.20
    const totalTTC = totalHT + tva

    const devisComplet = {
      ...devis,
      totaux: {
        totalPiecesHT,
        totalFournituresHT,
        totalMoHT,
        totalHT,
        tva,
        totalTTC,
        totalTTC_circulaire: totalTTC * 0.78
      }
    }

    const constatFinal = devis.constat_court || panne_constatee

    if (supabaseUrl && supabaseAnonKey && dossierId) {
      fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${dossierId}`, {
        method: "PATCH",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          statut: "devis_genere",
          constats_technicien: constatFinal,
          devis_ia: devisComplet
        })
      }).catch(err => console.error("Erreur mise a jour Supabase :", err))
    }

    return NextResponse.json({
      constat_court: constatFinal,
      devis: devisComplet
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur calcul devis." }, { status: 500 })
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

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-3 md:p-5 gap-4 selection:bg-blue-500/30">
      
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
              Compteur : <strong className="text-emerald-400">{mileage} km</strong> • Motif CCS : <span className="text-slate-300">{receptionMotif}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full font-semibold self-end md:self-auto">
          Poste Technicien
        </span>
      </header>

      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-emerald-400" /> 1. Contrôles Express Sécurité
          </h2>
          <span className="text-[11px] text-slate-500">Cliquez pour alterner le statut</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {checkItems.map((item) => {
            const val = (quickChecks as any)[item.key]
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

      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> 3. Constat Final & Transmission au Chef
        </h2>

        {devisTransmis ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-xs md:text-sm text-emerald-300">Dossier et contrôles transmis au Chef d'Atelier !</h3>
            <p className="text-[11px] text-slate-300">
              Le chiffrage complet a été calculé par l'IA et attend validation sur la tour de contrôle.
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
              rows={3}
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
              placeholder="Constat automatique généré par Jack..."
            />

            <button
              type="button"
              onClick={handleGenerateAndSendToChef}
              disabled={loadingDevis}
              className={`py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                !loadingDevis
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {loadingDevis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Génération et envoi base de données...
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
