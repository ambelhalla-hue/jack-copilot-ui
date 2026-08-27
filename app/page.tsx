"use client"

import { useState } from "react"
import { 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  Square, 
  CheckSquare2, 
  Edit3, 
  Send, 
  Car, 
  Clock, 
  PackageCheck, 
  Droplet, 
  Layers 
} from "lucide-react"

export default function ChecklistChefAtelier() {
  // Véhicule & Opération
  const vehicle = "Peugeot 308 II - 1.5 BlueHDi 130 (DV5RC)"
  const operation = "Remplacement Boîte de Vitesses & Embrayage"
  const immat = "AA-123-BB"

  // États des blocs validés
  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  // États d'envoi
  const [isTransmitted, setIsTransmitted] = useState(false)

  // Bascule de validation par bloc
  const toggleBlock = (blockKey: "mainParts" | "peripherals" | "labor") => {
    setCheckedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))
  }

  // Vérifie si tout est validé
  const allValidated = checkedBlocks.mainParts && checkedBlocks.peripherals && checkedBlocks.labor

  const handleTransmit = () => {
    if (!allValidated) return
    setIsTransmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-3xl mx-auto p-4 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER : Véhicule & Statut */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {immat}
              </span>
              <h1 className="font-bold text-slate-100 text-base md:text-lg">{vehicle}</h1>
            </div>
            <p className="text-xs font-medium text-cyan-400 mt-0.5">{operation}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[11px] font-mono uppercase px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Contrôle Chef d'Atelier
          </span>
        </div>
      </header>

      {/* MESSAGE SUCCÈS SI TRANSMIS */}
      {isTransmitted ? (
        <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="text-lg font-bold text-emerald-300">Devis validé et transmis avec succès !</h2>
          <p className="text-sm text-slate-300 max-w-md">
            Le dossier a été notifié en temps réel au Conseiller Commercial Service (CCS) et le lien interactif a été envoyé au client par SMS.
          </p>
          <button 
            onClick={() => setIsTransmitted(false)}
            className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Revenir à l'écran de contrôle
          </button>
        </div>
      ) : (
        <>
          {/* INSTRUCTIONS */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-400">
              Vérifiez la conformité constructeur de chaque bloc avant transmission.
            </p>
            <span className="text-xs font-mono text-cyan-400">
              {Object.values(checkedBlocks).filter(Boolean).length}/3 Blocs validés
            </span>
          </div>

          {/* BLOC 1 : PIÈCES PRINCIPALES */}
          <section 
            onClick={() => toggleBlock("mainParts")}
            className={`cursor-pointer transition-all duration-300 p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-3.5 ${
              checkedBlocks.mainParts 
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]" 
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700 shadow-lg"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <PackageCheck className={`w-5 h-5 ${checkedBlocks.mainParts ? "text-emerald-400" : "text-blue-400"}`} />
                <h2 className="font-bold text-sm md:text-base text-slate-100">
                  Bloc 1 : Mécanique & Pièces Principales
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {checkedBlocks.mainParts ? (
                  <CheckSquare2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Square className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>1x Boîte de vitesses 6 rapports (Échange Standard)</span>
                <span className="text-slate-400 flex items-center gap-2">Réf: 2231.XX <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>1x Kit d'embrayage avec mécanisme bi-masse</span>
                <span className="text-slate-400 flex items-center gap-2">Réf: 2052.P3 <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
            </div>
          </section>

          {/* BLOC 2 : PÉRIPHÉRIQUES & FLUIDES */}
          <section 
            onClick={() => toggleBlock("peripherals")}
            className={`cursor-pointer transition-all duration-300 p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-3.5 ${
              checkedBlocks.peripherals 
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]" 
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700 shadow-lg"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Droplet className={`w-5 h-5 ${checkedBlocks.peripherals ? "text-emerald-400" : "text-amber-400"}`} />
                <h2 className="font-bold text-sm md:text-base text-slate-100">
                  Bloc 2 : Périphériques & Fluides (Nomenclature Exhaustive)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {checkedBlocks.peripherals ? (
                  <CheckSquare2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Square className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>2x Joints à lèvres de sortie de pont (D/G)</span>
                <span className="text-slate-400 flex items-center gap-2">Inclus <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>1x Butée hydraulique d'embrayage (CSC)</span>
                <span className="text-slate-400 flex items-center gap-2">Inclus <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>2L Huile de transmission 75W-80 (Norme PSA B71 2330)</span>
                <span className="text-slate-400 flex items-center gap-2">Bidons 2L <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>1x Kit visserie neuve volant moteur (Usage unique)</span>
                <span className="text-slate-400 flex items-center gap-2">6 vis <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-cyan-300 cursor-pointer" /></span>
              </div>
            </div>
          </section>

          {/* BLOC 3 : MAIN-D'ŒUVRE & TEMPS BARÉMÉ */}
          <section 
            onClick={() => toggleBlock("labor")}
            className={`cursor-pointer transition-all duration-300 p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-3.5 ${
              checkedBlocks.labor 
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]" 
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700 shadow-lg"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Clock className={`w-5 h-5 ${checkedBlocks.labor ? "text-emerald-400" : "text-cyan-400"}`} />
                <h2 className="font-bold text-sm md:text-base text-slate-100">
                  Bloc 3 : Main-d'Œuvre & Barèmes Constructeur
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {checkedBlocks.labor ? (
                  <CheckSquare2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Square className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>Dépose / Repose Boîte de Vitesses</span>
                <span className="text-emerald-400 font-bold">5,20 h</span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>Remplacement Embrayage & Volant Moteur</span>
                <span className="text-emerald-400 font-bold">0,80 h</span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/60 p-2.5 rounded-xl border border-white/5">
                <span>Purge circuit hydraulique & Essai dynamique</span>
                <span className="text-emerald-400 font-bold">0,50 h</span>
              </div>
              <div className="flex justify-between items-center pt-1 px-1 font-sans text-xs">
                <span className="text-slate-400">Total barémé : <strong className="text-slate-200">6,50 h</strong></span>
                <span className="text-slate-400">Outillage : <strong className="text-cyan-300">Poutre support moteur + Pige</strong></span>
              </div>
            </div>
          </section>

          {/* BOUTON FINAL DE VALIDATION */}
          <div className="pt-2">
            <button
              onClick={handleTransmit}
              disabled={!allValidated}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
                allValidated 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer scale-[1.01]" 
                  : "bg-slate-800/60 border border-white/5 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
              {allValidated 
                ? "Valider et transmettre au CCS (Envoi client)" 
                : "Cochez les 3 blocs pour activer la transmission"}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
