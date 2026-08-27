"use client"

import { useState } from "react"
import { 
  ShieldCheck, 
  Car, 
  Clock, 
  PackageCheck, 
  Droplet, 
  Edit3, 
  Send, 
  CheckSquare2, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Wrench,
  ChevronRight
} from "lucide-react"

export default function DashboardChefAtelier() {
  // Liste des dossiers en atelier
  const [dossiers, setDossiers] = useState([
    {
      id: "1",
      immat: "AA-123-BB",
      vehicle: "Peugeot 308 II - 1.5 BlueHDi 130 (DV5RC)",
      kilometrage: "120 000 km",
      motifCCS: "Bruit métallique lors des passages de rapports + à-coups",
      constatTech: "Remplacement boîte de vitesses 6 rapports et kit embrayage bi-masse (butée fuyante, volant moteur marqué)",
      statut: "attente_validation",
      tempsTotal: "6,50 h",
      restitutionEstimee: "18h00 (+4h vs standard)"
    }
  ])

  const [selectedDossier, setSelectedDossier] = useState(dossiers[0])

  // Checklist de vérification des 3 blocs
  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  const [isTransmitted, setIsTransmitted] = useState(false)

  const toggleBlock = (blockKey: "mainParts" | "peripherals" | "labor") => {
    setCheckedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))
  }

  const allValidated = checkedBlocks.mainParts && checkedBlocks.peripherals && checkedBlocks.labor

  const handleValidateAndTransmit = () => {
    if (!allValidated) return
    setIsTransmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-4xl mx-auto p-3 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER CHEF D'ATELIER */}
      <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base md:text-lg">Supervision & Validation Chef d'Atelier</h1>
            <p className="text-xs text-slate-400">Contrôle qualité des chiffrages & Transmission synchrone</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-semibold">
          Tour de Contrôle
        </span>
      </header>

      {/* DOSSIER SÉLECTIONNÉ */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
              {selectedDossier.immat}
            </span>
            <h2 className="font-bold text-slate-100 text-sm md:text-base">{selectedDossier.vehicle}</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            Compteur : {selectedDossier.kilometrage}
          </span>
        </div>

        {/* Retours croisés CCS et Technicien */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-400" /> Saisie Réception CCS
            </span>
            <p className="text-slate-300">{selectedDossier.motifCCS}</p>
          </div>
          <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-400" /> Constat Mécanicien sur Pont
            </span>
            <p className="text-slate-300">{selectedDossier.constatTech}</p>
          </div>
        </div>
      </section>

      {isTransmitted ? (
        <section className="p-8 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="text-lg font-bold text-emerald-300">Devis validé et synchronisé !</h2>
          <p className="text-xs text-slate-300 max-w-md">
            Le Conseiller Commercial Service (CCS) a reçu la notification sur son poste et le SMS interactif contenant le lien du devis a été préparé pour le client.
          </p>
          <button
            onClick={() => {
              setIsTransmitted(false)
              setCheckedBlocks({ mainParts: false, peripherals: false, labor: false })
            }}
            className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Réinitialiser la validation
          </button>
        </section>
      ) : (
        <>
          {/* BARRE D'INSTRUCTION */}
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-400">
              Vérifiez chaque bloc technique généré par l'IA avant transmission :
            </p>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {Object.values(checkedBlocks).filter(Boolean).length}/3 Blocs validés
            </span>
          </div>

          {/* BLOC 1 : PIÈCES PRINCIPALES */}
          <section
            onClick={() => toggleBlock("mainParts")}
            className={`cursor-pointer transition-all duration-200 p-4 rounded-2xl border flex flex-col gap-3 ${
              checkedBlocks.mainParts
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PackageCheck className={`w-4 h-4 ${checkedBlocks.mainParts ? "text-emerald-400" : "text-blue-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">
                  Bloc 1 : Mécanique & Pièces Principales
                </h3>
              </div>
              {checkedBlocks.mainParts ? (
                <CheckSquare2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-600" />
              )}
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>1x Boîte de vitesses mécanique 6 rapports (Échange standard)</span>
                <span className="text-slate-400 flex items-center gap-2">Réf: 2231.XX <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>1x Kit d'embrayage avec mécanisme bi-masse</span>
                <span className="text-slate-400 flex items-center gap-2">Réf: 2052.P3 <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
            </div>
          </section>

          {/* BLOC 2 : PÉRIPHÉRIQUES & FLUIDES */}
          <section
            onClick={() => toggleBlock("peripherals")}
            className={`cursor-pointer transition-all duration-200 p-4 rounded-2xl border flex flex-col gap-3 ${
              checkedBlocks.peripherals
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplet className={`w-4 h-4 ${checkedBlocks.peripherals ? "text-emerald-400" : "text-amber-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">
                  Bloc 2 : Périphériques & Fluides (Nomenclature Exhaustive)
                </h3>
              </div>
              {checkedBlocks.peripherals ? (
                <CheckSquare2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-600" />
              )}
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>2x Joints à lèvres sortie de boîte (D/G)</span>
                <span className="text-slate-400 flex items-center gap-2">PSA B71 <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>1x Butée hydraulique concentrique (CSC)</span>
                <span className="text-slate-400 flex items-center gap-2">Inclus <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>2L Huile de transmission 75W-80 (Norme PSA B71 2330)</span>
                <span className="text-slate-400 flex items-center gap-2">Bidons 2L <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>1x Kit visserie neuve volant moteur (Usage unique PSA)</span>
                <span className="text-slate-400 flex items-center gap-2">6 vis <Edit3 className="w-3 h-3 text-blue-400" /></span>
              </div>
            </div>
          </section>

          {/* BLOC 3 : MAIN-D'ŒUVRE & BARÈMES */}
          <section
            onClick={() => toggleBlock("labor")}
            className={`cursor-pointer transition-all duration-200 p-4 rounded-2xl border flex flex-col gap-3 ${
              checkedBlocks.labor
                ? "bg-emerald-950/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "bg-[#111827]/70 border-white/10 hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${checkedBlocks.labor ? "text-emerald-400" : "text-cyan-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">
                  Bloc 3 : Main-d'Œuvre & Barèmes Constructeur
                </h3>
              </div>
              {checkedBlocks.labor ? (
                <CheckSquare2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-600" />
              )}
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>Dépose / Repose Boîte de Vitesses</span>
                <span className="text-emerald-400 font-bold">5,20 h</span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>Remplacement Embrayage & Volant Moteur</span>
                <span className="text-emerald-400 font-bold">0,80 h</span>
              </div>
              <div className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                <span>Purge commande hydraulique & Essai dynamique</span>
                <span className="text-emerald-400 font-bold">0,50 h</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-slate-400 text-[11px] font-sans">
                <span>Total barémé : <strong className="text-slate-100">{selectedDossier.tempsTotal}</strong></span>
                <span>Restitution prévue : <strong className="text-cyan-400">{selectedDossier.restitutionEstimee}</strong></span>
              </div>
            </div>
          </section>

          {/* BOUTON D'ACTION PRINCIPAL */}
          <button
            onClick={handleValidateAndTransmit}
            disabled={!allValidated}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              allValidated
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <Send className="w-5 h-5" />
            {allValidated
              ? "Valider et transmettre au CCS / Client"
              : "Cochez les 3 blocs de contrôle pour autoriser l'envoi"}
          </button>
        </>
      )}
    </main>
  )
}
