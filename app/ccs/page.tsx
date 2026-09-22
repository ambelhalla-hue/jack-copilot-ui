"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Car, 
  Camera, 
  ArrowRight, 
  ShieldAlert, 
  Trash2, 
  Gauge, 
  RefreshCw, 
  Mic, 
  MicOff,
  ArrowLeft
} from "lucide-react"
import { insertDossierAtelier, supabase } from "@/lib/supabase"

interface PhotoAngle {
  id: string
  label: string
  preview: string | null
}

export default function ReceptionCCS() {
  const router = useRouter()
  const [immat, setImmat] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [kilometrage, setKilometrage] = useState("")
  const [motif, setMotif] = useState("")
  const [loading, setLoading] = useState(false)
  const [isScanningPlate, setIsScanningPlate] = useState(false)

  // Vérification de session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth")
    })
  }, [])

  // Reconnaissance vocale native
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const plateCameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [angles, setAngles] = useState<PhotoAngle[]>([
    { id: "avant", label: "Face avant", preview: null },
    { id: "gauche", label: "Côté gauche", preview: null },
    { id: "droit", label: "Côté droit", preview: null },
    { id: "arriere", label: "Arrière", preview: null },
    { id: "compteur", label: "Compteur", preview: null },
  ])

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
            setMotif(prev => (prev ? prev.trim() + " " : "") + currentTranscript)
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

  const handlePlateChange = (val: string) => {
    const clean = val.toUpperCase().trim()
    setImmat(clean)
    if (clean === "AA-123-BB") {
      setVehicle("Peugeot 3008 II - 1.5 BlueHDi (DV5RC)")
    } else if (clean.length >= 7 && !vehicle) {
      setVehicle("Véhicule client")
    }
  }

  const handleScanPlateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanningPlate(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String })
        })
        const data = await res.json()
        if (data.immatriculation) handlePlateChange(data.immatriculation)
        if (data.modele_detecte && !vehicle) setVehicle(data.modele_detecte)
      } catch (err) {
        console.error("Erreur OCR:", err)
      } finally {
        setIsScanningPlate(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (angleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setAngles(prev => prev.map(a => a.id === angleId ? { ...a, preview: previewUrl } : a))
    }
  }

  const triggerCamera = (angleId: string) => {
    fileInputRefs.current[angleId]?.click()
  }

  const removePhoto = (angleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAngles(prev => prev.map(a => a.id === angleId ? { ...a, preview: null } : a))
  }

  // Création du dossier et bascule immédiate vers Jack Copilot
  const handleCreateAndStartDiag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!immat || !kilometrage) return

    setLoading(true)
    try {
      const nouveauDossier = await insertDossierAtelier({
        immatriculation: immat,
        vin: vehicle || "Modèle non spécifié",
        kilometrage: parseInt(kilometrage) || 0,
        statut: "en_diagnostic",
        constats_technicien: motif || "Entrée atelier",
        photos_tour_vehicule: angles.map(a => a.preview).filter(Boolean) as string[]
      })

      // Redirection directe vers Jack sous le pont
      if (nouveauDossier?.id) {
        router.push(`/tech/${nouveauDossier.id}`)
      } else {
        router.push("/")
      }
    } catch (err: any) {
      alert("Erreur lors de la création du dossier : " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-xl mx-auto p-4 gap-4">
      
      {/* HEADER AVEC RETOUR DASHBOARD */}
      <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          title="Retour au Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-white">Réception Véhicule</h1>
          <p className="text-[10px] text-slate-400">Prise en charge directe</p>
        </div>
        <div className="w-8" />
      </header>

      <form onSubmit={handleCreateAndStartDiag} className="flex flex-col gap-4">
        
        {/* 1. PLAQUE & COMPTEUR */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-blue-400" /> 1. Identification
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={plateCameraInputRef}
                onChange={handleScanPlateFile}
                className="hidden"
              />
              <input
                type="text"
                value={isScanningPlate ? "Scan..." : immat}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="AA-123-BB"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 font-mono uppercase text-blue-400 font-bold text-sm w-full focus:outline-none focus:border-blue-500 pr-9 text-center"
                required
                disabled={isScanningPlate}
              />
              <button
                type="button"
                onClick={() => plateCameraInputRef.current?.click()}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-400"
                title="Scanner la plaque"
              >
                {isScanningPlate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)}
                placeholder="Km compteur"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 font-mono text-emerald-400 font-bold text-sm w-full focus:outline-none focus:border-emerald-500 pr-8 text-right"
                required
              />
              <Gauge className="w-4 h-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <input
            type="text"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="Modèle et motorisation (ex: Peugeot 3008 II - 1.5 BlueHDi)"
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </section>

        {/* 2. PHOTOS FACULTATIVES DU TOUR DE CAISSE */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" /> 2. Photos état des lieux
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {angles.filter(a => a.preview !== null).length}/5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {angles.map((angle) => (
              <div
                key={angle.id}
                onClick={() => triggerCamera(angle.id)}
                className={`relative h-16 rounded-xl border border-dashed flex flex-col items-center justify-center p-1 text-center cursor-pointer overflow-hidden transition ${
                  angle.preview 
                    ? "border-emerald-500 bg-emerald-950/20" 
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={(el) => { fileInputRefs.current[angle.id] = el }}
                  onChange={(e) => handleFileChange(angle.id, e)}
                  className="hidden"
                />

                {angle.preview ? (
                  <>
                    <img 
                      src={angle.preview} 
                      alt={angle.label} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => removePhoto(angle.id, e)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded text-rose-400 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-[9px] text-slate-400 leading-tight">
                    {angle.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. MOTIF CLIENT AVEC DICTÉE VOCALE */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 3. Demande / Panne constatée
            </span>

            <button
              type="button"
              onClick={toggleListening}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-slate-800 text-blue-400 hover:bg-slate-700"
              }`}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span className="text-[10px]">{isListening ? "Écoute..." : "Dictée"}</span>
            </button>
          </div>

          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex : Voyant moteur allumé + perte de puissance après 2500 tr/min..."
            className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 min-h-[70px]"
            required
          />
        </section>

        {/* BOUTON ENREGISTRER ET ATTAQUER DIRECTEMENT */}
        <button
          type="submit"
          disabled={loading || !immat || !kilometrage}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>Enregistrer et attaquer le diag</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>
    </main>
  )
}
