"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Car, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Image as ImageIcon,
  Trash2,
  Gauge,
  RefreshCw,
  Mic,
  MicOff
} from "lucide-react"

interface PhotoAngle {
  id: string
  label: string
  preview: string | null
}

export default function ReceptionCCS() {
  const [immat, setImmat] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [kilometrage, setKilometrage] = useState("")
  const [motif, setMotif] = useState("")
  const [loading, setLoading] = useState(false)
  const [isScanningPlate, setIsScanningPlate] = useState(false)
  const [dossierCree, setDossierCree] = useState(false)

  // Gestion de la dictée vocale
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const plateCameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [angles, setAngles] = useState<PhotoAngle[]>([
    { id: "avant", label: "1. Face avant", preview: null },
    { id: "gauche", label: "2. Côté gauche", preview: null },
    { id: "droit", label: "3. Côté droit", preview: null },
    { id: "arriere", label: "4. Arrière / Coffre", preview: null },
    { id: "compteur", label: "5. Photo compteur", preview: null },
  ])

  // Initialisation de la reconnaissance vocale Web Speech API
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
            setMotif(prev => {
              const base = prev ? prev.trim() + " " : ""
              return base + currentTranscript
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
      alert("La dictée vocale n'est pas supportée par ce navigateur (privilégiez Chrome ou Safari mobile).")
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

  // Détection automatique lors de la saisie ou OCR
  const handlePlateChange = (val: string) => {
    const clean = val.toUpperCase().trim()
    setImmat(clean)
    if (clean === "AA-123-BB") {
      setVehicle("Peugeot 308 II - 1.5 BlueHDi 130 (DV5RC)")
    } else if (clean === "GR-608-BP") {
      setVehicle("Renault Clio IV - 1.5 dCi 90 (K9K)")
    } else if (clean.length >= 7 && !vehicle) {
      setVehicle("Peugeot 308 II - 1.5 BlueHDi 130")
    }
  }

  // Scan OCR de la plaque par photo
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
        if (data.immatriculation) {
          handlePlateChange(data.immatriculation)
        }
        if (data.modele_detecte && !vehicle) {
          setVehicle(data.modele_detecte)
        }
      } catch (err) {
        console.error(err)
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

  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!immat || !kilometrage) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setDossierCree(true)
    }, 700)
  }

  const resetForm = () => {
    setImmat("")
    setVehicle("")
    setKilometrage("")
    setMotif("")
    setAngles(prev => prev.map(a => ({ ...a, preview: null })))
    setDossierCree(false)
    setIsListening(false)
  }

  const totalPhotosPrises = angles.filter(a => a.preview !== null).length

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-4 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER CCS */}
      <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base md:text-lg">Réception & Tour de Véhicule</h1>
            <p className="text-xs text-slate-400">Conseiller Commercial Service (CCS)</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full font-semibold">
          Accueil Dépose
        </span>
      </header>

      {dossierCree ? (
        <div className="p-8 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
          <div>
            <h2 className="text-lg font-bold text-emerald-300">Dossier d'entrée transmis à l'atelier !</h2>
            <p className="text-xs text-slate-300 mt-1">
              Le véhicule <strong className="text-white">{immat}</strong> ({vehicle}) est synchronisé sur la tablette du mécanicien avec son tour de caisse.
            </p>
          </div>
          <div className="bg-[#0B0F17] p-4 rounded-xl border border-white/5 w-full text-xs font-mono text-slate-300 text-left space-y-1.5">
            <p>• Kilométrage compteur : <span className="text-emerald-400 font-bold">{kilometrage} km</span></p>
            <p>• Photos enregistrées : <span className="text-cyan-400 font-bold">{totalPhotosPrises} photo(s)</span></p>
            <p>• Motif client : <span className="text-slate-200">{motif || "Entretien courant"}</span></p>
          </div>
          <button
            onClick={resetForm}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition cursor-pointer"
          >
            Réceptionner le véhicule suivant
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateDossier} className="flex flex-col gap-4">
          
          {/* 1. SCAN & IDENTIFICATION DU VÉHICULE */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-400" /> 1. Identification Entrée
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  value={isScanningPlate ? "Scan en cours..." : immat}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="Plaque (ex: AA-123-BB)"
                  className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 font-mono uppercase text-blue-400 font-bold text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 pr-11"
                  required
                  disabled={isScanningPlate}
                />
                <button
                  type="button"
                  onClick={() => plateCameraInputRef.current?.click()}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-400 p-1 rounded-lg transition cursor-pointer"
                  title="Scanner la plaque par photo"
                >
                  {isScanningPlate ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={kilometrage}
                  onChange={(e) => setKilometrage(e.target.value)}
                  placeholder="Kilométrage compteur (km)"
                  className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 font-mono text-emerald-400 font-bold text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40 pr-10"
                  required
                />
                <Gauge className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Modèle et motorisation (ex: Peugeot 308 II - 1.5 BlueHDi)"
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </section>

          {/* 2. TOUR DE VÉHICULE NUMÉRIQUE */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" /> 2. Tour de Véhicule Numérique (Photos)
              </h2>
              <span className="text-xs font-mono text-cyan-400">
                {totalPhotosPrises}/5 prises
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Touchez un angle pour photographier l'état de la carrosserie.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {angles.map((angle) => (
                <div
                  key={angle.id}
                  onClick={() => triggerCamera(angle.id)}
                  className={`relative h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer overflow-hidden transition-all duration-200 ${
                    angle.preview 
                      ? "border-emerald-500 bg-emerald-950/20" 
                      : "border-slate-700/80 bg-[#0B0F17] hover:border-blue-500 hover:bg-slate-900"
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
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => removePhoto(angle.id, e)}
                          className="p-2 bg-rose-600/90 text-white rounded-lg hover:bg-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-emerald-300 truncate">
                        ✓ {angle.label}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <Camera className="w-5 h-5 text-slate-500" />
                      <span className="text-[11px] font-medium text-slate-300 leading-tight">
                        {angle.label}
                      </span>
                      <span className="text-[9px] text-blue-400 font-mono">+ Photographier</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. DEMANDE CLIENT AVEC DICTÉE VOCALE */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> 3. Demande & Symptômes Client
              </h2>

              {/* Bouton Micro Dictée */}
              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]"
                    : "bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-white/5"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Dictée en cours...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Mode vocal
                  </>
                )}
              </button>
            </div>

            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Saisissez ou dictez la demande (ex: Révision des 120 000 km + bruit métallique au passage de rapports)..."
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[90px]"
              required
            />
          </section>

          {/* BOUTON TRANSMISSION ATELIER */}
          <button
            type="submit"
            disabled={loading || !immat || !kilometrage}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              !loading && immat && kilometrage
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_25px_rgba(8,145,178,0.4)] cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Transmission en cours..." : "Transmettre le dossier à l'Atelier"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </main>
  )
}
