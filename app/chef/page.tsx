"use client"

import { useState } from "react"
import { 
  ShieldCheck, 
  Clock, 
  PackageCheck, 
  Droplet, 
  Send, 
  CheckSquare2, 
  Square, 
  CheckCircle2, 
  FileText, 
  Wrench,
  Trash2,
  PlusCircle,
  Save
} from "lucide-react"

interface PartItem {
  id: string
  designation: string
  ref: string
  quantite: number
}

interface LaborItem {
  id: string
  operation: string
  heures: number
}

export default function DashboardChefAtelier() {
  // Contexte du dossier en cours
  const [immat] = useState("AA-123-BB")
  const [vehicle] = useState("Peugeot 308 II - 1.5 BlueHDi 130 (DV5RC)")
  const [kilometrage] = useState("120 000 km")
  const [motifCCS] = useState("Bruit métallique lors des passages de rapports + à-coups")
  const [constatTech] = useState("Remplacement boîte mécanique 6 rapports + kit embrayage bi-masse (butée fuyante, volant moteur marqué)")

  // Bloc 1 : Pièces principales modifiables
  const [mainParts, setMainParts] = useState<PartItem[]>([
    { id: "1", designation: "Boîte de vitesses 6 rapports (Échange standard)", ref: "2231.XX", quantite: 1 },
    { id: "2", designation: "Kit d'embrayage avec volant bi-masse", ref: "2052.P3", quantite: 1 }
  ])

  // Bloc 2 : Périphériques et fluides modifiables
  const [peripherals, setPeripherals] = useState<PartItem[]>([
    { id: "1", designation: "Joints à lèvres de sortie de pont (D/G)", ref: "PSA B71", quantite: 2 },
    { id: "2", designation: "Butée hydraulique concentrique (CSC)", ref: "Inclus", quantite: 1 },
    { id: "3", designation: "Huile de transmission 75W-80 (PSA B71 2330)", ref: "Bidons 2L", quantite: 2 },
    { id: "4", designation: "Kit visserie neuve volant moteur (Usage unique)", ref: "6 vis PSA", quantite: 1 }
  ])

  // Bloc 3 : Main-d'œuvre modifiable
  const [labor, setLabor] = useState<LaborItem[]>([
    { id: "1", operation: "Dépose / Repose Boîte de Vitesses", heures: 5.2 },
    { id: "2", operation: "Remplacement Embrayage & Volant Moteur", heures: 0.8 },
    { id: "3", operation: "Purge commande hydraulique & Essai dynamique", heures: 0.5 }
  ])

  // Checklist de validation des blocs
  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  const [isTransmitted, setIsTransmitted] = useState(false)

  // Calcul dynamique du total barémé
  const totalHeures = labor.reduce((acc, curr) => acc + (Number(curr.heures) || 0), 0)

  const toggleBlock = (blockKey: "mainParts" | "peripherals" | "labor") => {
    setCheckedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))
  }

  const allValidated = checkedBlocks.mainParts && checkedBlocks.peripherals && checkedBlocks.labor

  // Fonctions de modification en direct
  const updateMainPart = (id: string, field: keyof PartItem, value: any) => {
    setMainParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removeMainPart = (id: string) => {
    setMainParts(prev => prev.filter(p => p.id !== id))
  }

  const addMainPart = () => {
    setMainParts(prev => [...prev, { id: Date.now().toString(), designation: "Nouvelle pièce", ref: "Réf à définir", quantite: 1 }])
  }

  const updatePeripheral = (id: string, field: keyof PartItem, value: any) => {
    setPeripherals(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removePeripheral = (id: string) => {
    setPeripherals(prev => prev.filter(p => p.id !== id))
  }

  const addPeripheral = () => {
    setPeripherals(prev => [...prev, { id: Date.now().toString(), designation: "Consommable / Visserie", ref: "Norme PSA", quantite: 1 }])
  }

  const updateLabor = (id: string, field: keyof LaborItem, value: any) => {
    setLabor(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const removeLabor = (id: string) => {
    setLabor(prev => prev.filter(l => l.id !== id))
  }

  const addLabor = () => {
    setLabor(prev => [...prev, { id: Date.now().toString(), operation: "Opération barémée additionnelle", heures: 0.5 }])
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-4xl mx-auto p-3 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER SUPERVISION */}
      <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base md:text-lg">Tour de Contrôle & Édition Chef d'Atelier</h1>
            <p className="text-xs text-slate-400">Vérification, retouche du chiffrage IA et validation synchrone</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-semibold">
          Validation Qualité
        </span>
      </header>

      {/* RECAP DOSSIER */}
      <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
              {immat}
            </span>
            <h2 className="font-bold text-slate-100 text-sm md:text-base">{vehicle}</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">{kilometrage}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-400" /> Saisie Réception CCS
            </span>
            <p className="text-slate-300">{motifCCS}</p>
          </div>
          <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-400" /> Constat Mécanicien sur Pont
            </span>
            <p className="text-slate-300">{constatTech}</p>
          </div>
        </div>
      </section>

      {isTransmitted ? (
        <section className="p-8 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="text-lg font-bold text-emerald-300">Devis validé et synchronisé en temps réel !</h2>
          <p className="text-xs text-slate-300 max-w-md">
            Le Conseiller Commercial Service (CCS) a reçu le devis ajusté et le lien SMS interactif a été actualisé pour le client.
          </p>
          <button
            onClick={() => {
              setIsTransmitted(false)
              setCheckedBlocks({ mainParts: false, peripherals: false, labor: false })
            }}
            className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Rééditer le chiffrage
          </button>
        </section>
      ) : (
        <>
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-400">
              Modifiez directement les lignes ci-dessous si nécessaire, puis cochez chaque bloc pour valider :
            </p>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {Object.values(checkedBlocks).filter(Boolean).length}/3 Blocs validés
            </span>
          </div>

          {/* BLOC 1 : PIÈCES PRINCIPALES */}
          <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
            checkedBlocks.mainParts 
              ? "bg-emerald-950/15 border-emerald-500/60" 
              : "bg-[#111827]/70 border-white/10"
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PackageCheck className={`w-4 h-4 ${checkedBlocks.mainParts ? "text-emerald-400" : "text-blue-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 1 : Pièces Principales</h3>
              </div>
              <button
                type="button"
                onClick={() => toggleBlock("mainParts")}
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                {checkedBlocks.mainParts ? (
                  <>
                    <CheckSquare2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Validé</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">Valider ce bloc</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {mainParts.map((p) => (
                <div key={p.id} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="number"
                    min="1"
                    value={p.quantite}
                    onChange={(e) => updateMainPart(p.id, "quantite", Number(e.target.value))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-cyan-400"
                  />
                  <input
                    type="text"
                    value={p.designation}
                    onChange={(e) => updateMainPart(p.id, "designation", e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <input
                    type="text"
                    value={p.ref}
                    onChange={(e) => updateMainPart(p.id, "ref", e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-400 text-center"
                    placeholder="Réf."
                  />
                  <button
                    type="button"
                    onClick={() => removeMainPart(p.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addMainPart}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Ajouter une pièce principale
              </button>
            </div>
          </section>

          {/* BLOC 2 : PÉRIPHÉRIQUES ET FLUIDES */}
          <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
            checkedBlocks.peripherals 
              ? "bg-emerald-950/15 border-emerald-500/60" 
              : "bg-[#111827]/70 border-white/10"
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplet className={`w-4 h-4 ${checkedBlocks.peripherals ? "text-emerald-400" : "text-amber-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 2 : Périphériques & Fluides (Nomenclature)</h3>
              </div>
              <button
                type="button"
                onClick={() => toggleBlock("peripherals")}
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                {checkedBlocks.peripherals ? (
                  <>
                    <CheckSquare2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Validé</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">Valider ce bloc</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {peripherals.map((p) => (
                <div key={p.id} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="number"
                    min="1"
                    value={p.quantite}
                    onChange={(e) => updatePeripheral(p.id, "quantite", Number(e.target.value))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-amber-400"
                  />
                  <input
                    type="text"
                    value={p.designation}
                    onChange={(e) => updatePeripheral(p.id, "designation", e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <input
                    type="text"
                    value={p.ref}
                    onChange={(e) => updatePeripheral(p.id, "ref", e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-400 text-center"
                    placeholder="Norme/Détail"
                  />
                  <button
                    type="button"
                    onClick={() => removePeripheral(p.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addPeripheral}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Ajouter un consommable / joint / fluide
              </button>
            </div>
          </section>

          {/* BLOC 3 : MAIN-D'ŒUVRE & BARÈMES */}
          <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
            checkedBlocks.labor 
              ? "bg-emerald-950/15 border-emerald-500/60" 
              : "bg-[#111827]/70 border-white/10"
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${checkedBlocks.labor ? "text-emerald-400" : "text-cyan-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 3 : Main-d'Œuvre & Barèmes Constructeur</h3>
              </div>
              <button
                type="button"
                onClick={() => toggleBlock("labor")}
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                {checkedBlocks.labor ? (
                  <>
                    <CheckSquare2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Validé</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">Valider ce bloc</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {labor.map((l) => (
                <div key={l.id} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="text"
                    value={l.operation}
                    onChange={(e) => updateLabor(l.id, "operation", e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={l.heures}
                      onChange={(e) => updateLabor(l.id, "heures", Number(e.target.value))}
                      className="w-12 bg-transparent text-center font-mono text-emerald-400 font-bold focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px] font-mono">h</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLabor(l.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 px-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={addLabor}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Ajouter une opération
                </button>
                <span className="text-xs font-mono text-slate-300">
                  Total barémé : <strong className="text-emerald-400 font-bold text-sm">{totalHeures.toFixed(2)} h</strong>
                </span>
              </div>
            </div>
          </section>

          {/* BOUTON TRANSMISSION FINALE */}
          <button
            onClick={() => allValidated && setIsTransmitted(true)}
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
              : "Cochez les 3 blocs de contrôle pour autoriser la transmission"}
          </button>
        </>
      )}
    </main>
  )
}
