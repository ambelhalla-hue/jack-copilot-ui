"use client"

import { useState, useEffect } from "react"
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
  RefreshCw, 
  ShoppingBag,
  BellRing,
  X
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

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
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const [alertDevisPret, setAlertDevisPret] = useState<any | null>(null)
  const [alertClientValide, setAlertClientValide] = useState<any | null>(null)

  const [mainParts, setMainParts] = useState<PartItem[]>([])
  const [peripherals, setPeripherals] = useState<PartItem[]>([])
  const [labor, setLabor] = useState<LaborItem[]>([])

  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isTransmitted, setIsTransmitted] = useState(false)

  // Synchronisation dynamique du chiffrage selon le dossier sélectionné
  useEffect(() => {
    if (selectedDossier) {
      const devis = selectedDossier.devis_ia

      if (devis) {
        if (Array.isArray(devis.pieces_principales) && devis.pieces_principales.length > 0) {
          setMainParts(devis.pieces_principales)
        } else {
          setMainParts([
            { id: "1", designation: `Intervention : ${selectedDossier.constats_technicien || "Pièces à définir"}`, ref: "OE / Adaptable", quantite: 1 }
          ])
        }

        if (Array.isArray(devis.peripheriques) && devis.peripheriques.length > 0) {
          setPeripherals(devis.peripheriques)
        } else {
          setPeripherals([
            { id: "1", designation: "Consommables & petites fournitures d'atelier", ref: "Fournitures", quantite: 1 }
          ])
        }

        if (Array.isArray(devis.main_oeuvre) && devis.main_oeuvre.length > 0) {
          setLabor(devis.main_oeuvre)
        } else {
          setLabor([
            { id: "1", operation: `Main-d'œuvre : ${selectedDossier.constats_technicien || "Remplacement"}`, heures: 1.5 }
          ])
        }
      } else {
        setMainParts([
          { id: "1", designation: selectedDossier.constats_technicien || "Remplacement pièces préconisées", ref: "OE / Adaptable", quantite: 1 }
        ])
        setPeripherals([
          { id: "1", designation: "Petites fournitures & recyclage", ref: "Norme", quantite: 1 }
        ])
        setLabor([
          { id: "1", operation: "Main-d'œuvre intervention atelier", heures: 1.0 }
        ])
      }

      setCheckedBlocks({ mainParts: false, peripherals: false, labor: false })
      setIsTransmitted(selectedDossier.statut === "valide_chef" || selectedDossier.statut === "valide_client")
    }
  }, [selectedDossier])

  const refreshDossiers = async () => {
    try {
      const list = await getAllDossiers()
      if (list && list.length > 0) {
        setDossiers(list)

        const devisAValider = list.find(d => d.statut === "devis_genere")
        if (devisAValider && (!selectedDossier || selectedDossier.id !== devisAValider.id)) {
          setAlertDevisPret(devisAValider)
        }

        const accordClient = list.find(d => d.statut === "valide_client")
        if (accordClient) {
          setAlertClientValide(accordClient)
        }

        if (!selectedDossier) {
          setSelectedDossier(list[0])
        } else {
          const updatedCurrent = list.find(d => d.id === selectedDossier.id)
          if (updatedCurrent) setSelectedDossier(updatedCurrent)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    refreshDossiers()
    const interval = setInterval(refreshDossiers, 5000)
    return () => clearInterval(interval)
  }, [])

  const totalHeures = labor.reduce((acc, curr) => acc + (Number(curr.heures) || 0), 0)

  const toggleBlock = (blockKey: "mainParts" | "peripherals" | "labor") => {
    setCheckedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))
  }

  const allValidated = checkedBlocks.mainParts && checkedBlocks.peripherals && checkedBlocks.labor

  const updateMainPart = (id: string, field: keyof PartItem, value: any) => {
    setMainParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const removeMainPart = (id: string) => {
    setMainParts(prev => prev.filter(p => p.id !== id))
  }
  const addMainPart = () => {
    setMainParts(prev => [...prev, { id: Date.now().toString(), designation: "Nouvelle pièce", ref: "Réf", quantite: 1 }])
  }

  const updatePeripheral = (id: string, field: keyof PartItem, value: any) => {
    setPeripherals(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const removePeripheral = (id: string) => {
    setPeripherals(prev => prev.filter(p => p.id !== id))
  }
  const addPeripheral = () => {
    setPeripherals(prev => [...prev, { id: Date.now().toString(), designation: "Consommable / Fluide", ref: "Norme", quantite: 1 }])
  }

  const updateLabor = (id: string, field: keyof LaborItem, value: any) => {
    setLabor(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }
  const removeLabor = (id: string) => {
    setLabor(prev => prev.filter(l => l.id !== id))
  }
  const addLabor = () => {
    setLabor(prev => [...prev, { id: Date.now().toString(), operation: "Opération barémée", heures: 0.5 }])
  }

  const handleTransmitToClient = async () => {
    if (!allValidated || !selectedDossier) return
    setIsTransmitting(true)

    try {
      await updateDossierStatusAndData(selectedDossier.id, {
        statut: "valide_chef",
        devis_ia: {
          pieces_principales: mainParts,
          peripheriques: peripherals,
          main_oeuvre: labor,
          total_heures: totalHeures
        }
      })
      setIsTransmitted(true)
      refreshDossiers()
    } catch (err: any) {
      alert("Erreur validation : " + err.message)
    } finally {
      setIsTransmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-4xl mx-auto p-3 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* POP-UP 1 : ALERTE DEVIS TECHNICIEN PRÊT */}
      {alertDevisPret && (
        <div className="fixed inset-x-4 top-5 z-50 max-w-lg mx-auto bg-amber-950 border border-amber-500/80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <BellRing className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-200">Nouveau devis technicien à vérifier !</h4>
            <p className="text-xs text-amber-300/90 mt-0.5">
              Véhicule <strong className="text-white">{alertDevisPret.immatriculation}</strong> — Proposition transmise depuis l'atelier.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => {
                  setSelectedDossier(alertDevisPret)
                  setAlertDevisPret(null)
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Vérifier le chiffrage
              </button>
              <button onClick={() => setAlertDevisPret(null)} className="text-xs text-amber-400/80 hover:text-white px-2 py-1.5">
                Ignorer
              </button>
            </div>
          </div>
          <button onClick={() => setAlertDevisPret(null)} className="text-amber-400/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* POP-UP 2 : ALERTE VALIDATION CLIENT */}
      {alertClientValide && (
        <div className="fixed inset-x-4 top-5 z-50 max-w-lg mx-auto bg-emerald-950 border border-emerald-500 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <ShoppingBag className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-emerald-200">Accord Client reçu : Commande de pièces requise !</h4>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Le client du véhicule <strong className="text-white">{alertClientValide.immatriculation}</strong> a validé son devis ({alertClientValide.choix_client || "Validé"}).
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => {
                  setSelectedDossier(alertClientValide)
                  setAlertClientValide(null)
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Voir la commande
              </button>
              <button onClick={() => setAlertClientValide(null)} className="text-xs text-emerald-400/80 hover:text-white px-2 py-1.5">
                Fermer
              </button>
            </div>
          </div>
          <button onClick={() => setAlertClientValide(null)} className="text-emerald-400/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SUPERVISION */}
      <header className="flex justify-between items-center p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base md:text-lg">Tour de Contrôle Chef d'Atelier</h1>
            <p className="text-xs text-slate-400">Supervision en direct et validation des commandes</p>
          </div>
        </div>
        <button
          onClick={refreshDossiers}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-amber-400" : ""}`} /> Actualiser
        </button>
      </header>

      {/* SÉLECTEUR DE VÉHICULE */}
      {dossiers.length > 0 && (
        <section className="flex gap-2 overflow-x-auto pb-1">
          {dossiers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDossier(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-2 ${
                selectedDossier?.id === d.id
                  ? "bg-blue-600 text-white border-blue-400 shadow-lg"
                  : "bg-[#111827] text-slate-400 border-white/5 hover:border-slate-700"
              }`}
            >
              <span>{d.immatriculation}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${
                d.statut === "valide_client"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                  : d.statut === "devis_genere"
                  ? "bg-amber-950 text-amber-300 border border-amber-700"
                  : "bg-slate-800 text-slate-400"
              }`}>
                {d.statut || "reception"}
              </span>
            </button>
          ))}
        </section>
      )}

      {selectedDossier ? (
        <>
          {/* RECAP DOSSIER SÉLECTIONNÉ */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                  {selectedDossier.immatriculation}
                </span>
                <h2 className="font-bold text-slate-100 text-sm md:text-base">{selectedDossier.vin}</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {selectedDossier.kilometrage ? `${selectedDossier.kilometrage.toLocaleString("fr-FR")} km` : "--- km"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-emerald-400" /> Constat Mécanicien sur Pont
                </span>
                <p className="text-slate-200 font-medium">{selectedDossier.constats_technicien || "En cours de contrôle"}</p>
              </div>

              <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-400" /> Statut Dossier
                </span>
                <p className="text-cyan-400 font-mono font-bold uppercase">{selectedDossier.statut || "reception"}</p>
                {selectedDossier.choix_client && (
                  <p className="text-emerald-300 mt-1">Option choisie : {selectedDossier.choix_client}</p>
                )}
              </div>
            </div>
          </section>

          {isTransmitted ? (
            <section className="p-8 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h2 className="text-lg font-bold text-emerald-300">Chiffrage validé par le Chef d'Atelier !</h2>
              <p className="text-xs text-slate-300 max-w-md">
                Le dossier est synchronisé avec le statut <strong>{selectedDossier.statut}</strong>.
              </p>
              <button
                onClick={() => setIsTransmitted(false)}
                className="mt-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Modifier à nouveau les lignes
              </button>
            </section>
          ) : (
            <>
              {/* BLOC 1 : PIÈCES PRINCIPALES */}
              <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
                checkedBlocks.mainParts ? "bg-emerald-950/15 border-emerald-500/60" : "bg-[#111827]/70 border-white/10"
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
                        <span className="text-slate-400">Valider</span>
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
                      <button type="button" onClick={() => removeMainPart(p.id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addMainPart} className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 mt-1 cursor-pointer">
                    <PlusCircle className="w-3.5 h-3.5" /> Ajouter une pièce principale
                  </button>
                </div>
              </section>

              {/* BLOC 2 : PÉRIPHÉRIQUES ET FLUIDES */}
              <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
                checkedBlocks.peripherals ? "bg-emerald-950/15 border-emerald-500/60" : "bg-[#111827]/70 border-white/10"
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplet className={`w-4 h-4 ${checkedBlocks.peripherals ? "text-emerald-400" : "text-amber-400"}`} />
                    <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 2 : Périphériques & Fournitures</h3>
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
                        <span className="text-slate-400">Valider</span>
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
                        placeholder="Norme"
                      />
                      <button type="button" onClick={() => removePeripheral(p.id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addPeripheral} className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 mt-1 cursor-pointer">
                    <PlusCircle className="w-3.5 h-3.5" /> Ajouter un consommable / joint
                  </button>
                </div>
              </section>

              {/* BLOC 3 : MAIN-D'ŒUVRE */}
              <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
                checkedBlocks.labor ? "bg-emerald-950/15 border-emerald-500/60" : "bg-[#111827]/70 border-white/10"
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${checkedBlocks.labor ? "text-emerald-400" : "text-cyan-400"}`} />
                    <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 3 : Main-d'Œuvre & Barèmes</h3>
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
                        <span className="text-slate-400">Valider</span>
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
                      <button type="button" onClick={() => removeLabor(l.id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 px-1 border-t border-white/5">
                    <button type="button" onClick={addLabor} className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer">
                      <PlusCircle className="w-3.5 h-3.5" /> Ajouter une opération
                    </button>
                    <span className="text-xs font-mono text-slate-300">
                      Total barémé : <strong className="text-emerald-400 font-bold text-sm">{totalHeures.toFixed(2)} h</strong>
                    </span>
                  </div>
                </div>
              </section>

              {/* TRANSMISSION */}
              <button
                onClick={handleTransmitToClient}
                disabled={!allValidated || isTransmitting}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
                  allValidated && !isTransmitting
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <Send className="w-5 h-5" />
                {isTransmitting
                  ? "Validation en cours..."
                  : allValidated
                  ? "Valider et envoyer le lien interactif au Client"
                  : "Validez les 3 blocs de contrôle pour autoriser l'envoi"}
              </button>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-slate-500 text-xs">
          Sélectionnez un véhicule dans la liste supérieure.
        </div>
      )}
    </main>
  )
}
