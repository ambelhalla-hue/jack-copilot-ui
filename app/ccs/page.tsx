"use client"

import { useState } from "react"
import { 
  Car, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  UploadCloud, 
  FileText, 
  ShieldAlert, 
  PlusCircle, 
  Image as ImageIcon 
} from "lucide-react"

export default function ReceptionCCS() {
  const [immat, setImmat] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [kilometrage, setKilometrage] = useState("")
  const [motif, setMotif] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dossierCree, setDossierCree] = useState(false)

  // Simulation de détection automatique lors de la saisie de plaque
  const handlePlateChange = (val: string) => {
    const clean = val.toUpperCase()
    setImmat(clean)
    if (clean === "AA-123-BB") {
      setVehicle("Peugeot 308 II - 1.5 BlueHDi 130 (DV5RC)")
    } else if (clean === "GR-608-BP") {
      setVehicle("Renault Clio IV - 1.5 dCi 90 (K9K)")
    }
  }

  // Simulation d'ajout de photo du tour de caisse
  const handleAddPhoto = () => {
    const angleLabels = ["Face avant", "Côté gauche", "Côté droit", "Arrière & Coffre"]
    const nextLabel = angleLabels[photos.length] || `Photo dégât ${photos.length + 1}`
    setPhotos(prev => [...prev, nextLabel])
  }

  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!immat || !kilometrage) return

    setLoading(true)
    // Simulation de création et insertion immédiate
    setTimeout(() => {
      setLoading(false)
      setDossierCree(true)
    }, 800)
  }

  const resetForm = () => {
    setImmat("")
    setVehicle("")
    setKilometrage("")
    setMotif("")
    setPhotos([])
    setDossierCree(false)
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-2xl mx-auto p-4 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER CCS */}
      <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base">Espace Réception CCS</h1>
            <p className="text-xs text-slate-400">Création du dossier & Tour de véhicule</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-semibold">
          Accueil Client
        </span>
      </header>

      {dossierCree ? (
        <div className="p-8 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          <div>
            <h2 className="text-lg font-bold text-emerald-300">Dossier atelier créé avec succès !</h2>
            <p className="text-xs text-slate-300 mt-1">
              Le véhicule <strong className="text-white">{immat}</strong> ({vehicle || "Modèle standard"}) est maintenant visible sur la tablette des techniciens.
            </p>
          </div>
          <div className="bg-[#0B0F17] p-3 rounded-xl border border-white/5 w-full text-xs font-mono text-slate-400 text-left space-y-1">
            <p>• Kilométrage compteur : <span className="text-slate-200">{kilometrage} km</span></p>
            <p>• Photos enregistrées : <span className="text-slate-200">{photos.length} vue(s)</span></p>
            <p>• Statut : <span className="text-cyan-400 font-bold">En attente technicien</span></p>
          </div>
          <button
            onClick={resetForm}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition cursor-pointer"
          >
            Réceptionner un nouveau véhicule
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateDossier} className="flex flex-col gap-4">
          
          {/* IDENTIFICATION VÉHICULE */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-400" /> 1. Identification Entrée
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={immat}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="Immatriculation (ex: AA-123-BB)"
                  className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 font-mono uppercase text-blue-400 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 pr-10"
                  required
                />
                <Camera className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              <div>
                <input
                  type="number"
                  value={kilometrage}
                  onChange={(e) => setKilometrage(e.target.value)}
                  placeholder="Kilométrage réel"
                  className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 font-mono text-emerald-400 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </div>
            </div>

            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Modèle et Motorisation exacte"
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </section>

          {/* TOUR DU VÉHICULE / PHOTOS */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" /> 2. Tour de Véhicule Numérique
              </h2>
              <span className="text-xs font-mono text-cyan-400">{photos.length}/4 angles clés</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {photos.map((label, index) => (
                <div key={index} className="bg-[#0B0F17] border border-emerald-500/30 p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px] font-medium text-slate-300">{label}</span>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">Enregistré</span>
                </div>
              ))}

              {photos.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-[#0B0F17]/50 p-4 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-400 transition cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">Prendre photo</span>
                </button>
              )}
            </div>
          </section>

          {/* MOTIF DE DÉPOSE / DEMANDE CLIENT */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> 3. Demande & Symptômes Client
            </h2>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Révision des 120 000 km + Bruit métallique lors des passages de rapports..."
              className="bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[90px]"
              required
            />
          </section>

          {/* BOUTON VALIDATION RECEPTION */}
          <button
            type="submit"
            disabled={loading || !immat || !kilometrage}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              !loading && immat && kilometrage
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Création du dossier en cours..." : "Transmettre le dossier à l'Atelier"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </main>
  )
}
