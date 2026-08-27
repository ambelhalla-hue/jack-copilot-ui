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
  Camera,
  AlertCircle,
  ShoppingBag,
  BellRing,
  X
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

export default function DashboardChefAtelier() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Modales d'alerte pop-up
  const [alertDevisPret, setAlertDevisPret] = useState<any | null>(null)
  const [alertClientValide, setAlertClientValide] = useState<any | null>(null)

  // Données éditables du chiffrage
  const [mainParts, setMainParts] = useState<any[]>([
    { id: "1", designation: "Boîte de vitesses 6 rapports (Échange standard)", ref: "2231.XX", quantite: 1 },
    { id: "2", designation: "Kit d'embrayage avec volant bi-masse", ref: "2052.P3", quantite: 1 }
  ])

  const [peripherals, setPeripherals] = useState<any[]>([
    { id: "1", designation: "Joints à lèvres sortie de pont (D/G)", ref: "PSA B71", quantite: 2 },
    { id: "2", designation: "Huile de boîte 75W-80 (PSA B71 2330)", ref: "2L", quantite: 2 }
  ])

  const [labor, setLabor] = useState<any[]>([
    { id: "1", operation: "Dépose / Repose Boîte de Vitesses", heures: 5.2 },
    { id: "2", operation: "Remplacement Embrayage & Volant Moteur", heures: 0.8 }
  ])

  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isTransmitted, setIsTransmitted] = useState(false)

  // Polling automatique pour les alertes temps réel (toutes les 6 secondes)
  const refreshDossiers = async () => {
    try {
      const list = await getAllDossiers()
      if (list && list.length > 0) {
        setDossiers(list)

        // Détection devis tech prêt
        const devisAValider = list.find(d => d.statut === "devis_genere")
        if (devisAValider && (!selectedDossier || selectedDossier.id !== devisAValider.id)) {
          setAlertDevisPret(devisAValider)
        }

        // Détection validation client
        const accordClient = list.find(d => d.statut === "valide_client")
        if (accordClient) {
          setAlertClientValide(accordClient)
        }

        // Si aucun dossier sélectionné, on prend le premier
        if (!selectedDossier) {
          setSelectedDossier(list[0])
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
    const interval = setInterval(refreshDossiers, 6000)
    return () => clearInterval(interval)
  }, [])

  const totalHeures = labor.reduce((acc, curr) => acc + (Number(curr.heures) || 0), 0)

  const toggleBlock = (blockKey: "mainParts" | "peripherals" | "labor") => {
    setCheckedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))
  }

  const allValidated = checkedBlocks.mainParts && checkedBlocks.peripherals && checkedBlocks.labor

  // Transmission et passage au statut "valide_chef"
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
      alert("Erreur lors de la validation : " + err.message)
    } finally {
      setIsTransmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-4xl mx-auto p-3 md:p-6 gap-5 selection:bg-blue-500/30">
      
      {/* POP-UP 1 : ALERTE DEVIS TECH PRÊT */}
      {alertDevisPret && (
        <div className="fixed inset-x-4 top-5 z-50 max-w-lg mx-auto bg-amber-950 border border-amber-500/80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <BellRing className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-200">Nouveau devis technicien à vérifier !</h4>
            <p className="text-xs text-amber-300/90 mt-0.5">
              Véhicule <strong className="text-white">{alertDevisPret.immatriculation}</strong> ({alertDevisPret.vin}) — Le mécanicien a terminé le diagnostic et transmis sa proposition.
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
              <button
                onClick={() => setAlertDevisPret(null)}
                className="text-xs text-amber-400/80 hover:text-white px-2 py-1.5"
              >
                Ignorer
              </button>
            </div>
          </div>
          <button onClick={() => setAlertDevisPret(null)} className="text-amber-400/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* POP-UP 2 : ALERTE VALIDATION CLIENT ➔ COMMANDE PIÈCES */}
      {alertClientValide && (
        <div className="fixed inset-x-4 top-5 z-50 max-w-lg mx-auto bg-emerald-950 border border-emerald-500 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <ShoppingBag className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-emerald-200">Feu vert Client reçu : Commande de pièces requise !</h4>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Le client du véhicule <strong className="text-white">{alertClientValide.immatriculation}</strong> a validé son devis ({alertClientValide.choix_client || "Offre standard"}). Vous pouvez lancer les approvisionnements.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => {
                  setSelectedDossier(alertClientValide)
                  setAlertClientValide(null)
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Consulter les pièces à commander
              </button>
              <button
                onClick={() => setAlertClientValide(null)}
                className="text-xs text-emerald-400/80 hover:text-white px-2 py-1.5"
              >
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

      {/* SÉLECTEUR DE VÉHICULE ATELIER */}
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
                  <FileText className="w-3 h-3 text-blue-400" /> Saisie Réception CCS
                </span>
                <p className="text-slate-300">{selectedDossier.constats_technicien || "Non précisé"}</p>
              </div>
              <div className="bg-[#0B0F17]/80 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-emerald-400" /> Statut Actuel
                </span>
                <p className="text-cyan-400 font-mono font-bold uppercase">{selectedDossier.statut || "reception"}</p>
                {selectedDossier.choix_client && (
                  <p className="text-emerald-300 mt-1">Choix client : {selectedDossier.choix_client}</p>
                )}
              </div>
            </div>
          </section>

          {/* ÉDITION DES 3 BLOCS */}
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
              {mainParts.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="number"
                    value={p.quantite}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setMainParts(prev => prev.map((item, i) => i === idx ? { ...item, quantite: val } : item))
                    }}
                    className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-cyan-400"
                  />
                  <input
                    type="text"
                    value={p.designation}
                    onChange={(e) => {
                      const val = e.target.value
                      setMainParts(prev => prev.map((item, i) => i === idx ? { ...item, designation: val } : item))
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <input
                    type="text"
                    value={p.ref}
                    onChange={(e) => {
                      const val = e.target.value
                      setMainParts(prev => prev.map((item, i) => i === idx ? { ...item, ref: val } : item))
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-400 text-center"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* BLOC 2 : PÉRIPHÉRIQUES */}
          <section className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 ${
            checkedBlocks.peripherals ? "bg-emerald-950/15 border-emerald-500/60" : "bg-[#111827]/70 border-white/10"
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Droplet className={`w-4 h-4 ${checkedBlocks.peripherals ? "text-emerald-400" : "text-amber-400"}`} />
                <h3 className="font-bold text-xs md:text-sm text-slate-100">Bloc 2 : Périphériques & Fluides</h3>
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
              {peripherals.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="number"
                    value={p.quantite}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setPeripherals(prev => prev.map((item, i) => i === idx ? { ...item, quantite: val } : item))
                    }}
                    className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-amber-400"
                  />
                  <input
                    type="text"
                    value={p.designation}
                    onChange={(e) => {
                      const val = e.target.value
                      setPeripherals(prev => prev.map((item, i) => i === idx ? { ...item, designation: val } : item))
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <input
                    type="text"
                    value={p.ref}
                    onChange={(e) => {
                      const val = e.target.value
                      setPeripherals(prev => prev.map((item, i) => i === idx ? { ...item, ref: val } : item))
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-400 text-center"
                  />
                </div>
              ))}
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
              {labor.map((l, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-[#0B0F17]/80 p-2 rounded-xl border border-white/5 text-xs">
                  <input
                    type="text"
                    value={l.operation}
                    onChange={(e) => {
                      const val = e.target.value
                      setLabor(prev => prev.map((item, i) => i === idx ? { ...item, operation: val } : item))
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                  />
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={l.heures}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setLabor(prev => prev.map((item, i) => i === idx ? { ...item, heures: val } : item))
                      }}
                      className="w-12 bg-transparent text-center font-mono text-emerald-400 font-bold focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px] font-mono">h</span>
                  </div>
                </div>
              ))}
              <div className="text-right pt-2 border-t border-white/5 text-xs font-mono text-slate-300">
                Total barémé : <strong className="text-emerald-400 font-bold">{totalHeures.toFixed(2)} h</strong>
              </div>
            </div>
          </section>

          {/* TRANSMISSION CLIENT */}
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
              ? "Transmission en cours..."
              : allValidated
              ? "Valider et envoyer le lien interactif au Client (SMS / Email)"
              : "Validez les 3 blocs de contrôle pour autoriser l'envoi"}
          </button>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500 text-xs">
          Sélectionnez un véhicule dans la liste supérieure.
        </div>
      )}
    </main>
  )
}
