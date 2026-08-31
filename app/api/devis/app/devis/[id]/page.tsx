"use client"

import { useState, useEffect } from "react"
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  Car, 
  FileText, 
  RefreshCw,
  Layers,
  Wrench
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

export default function ClientInteractiveDevis() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Options choisies par le client
  const [optionType, setOptionType] = useState<"origine" | "circulaire">("origine")
  const [validated, setValidated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadClientDossiers = async () => {
    try {
      setLoading(true)
      const list = await getAllDossiers()
      if (list && Array.isArray(list)) {
        // Affiche tous les dossiers validés par le chef ou le client
        const clientList = list.filter((d: any) => 
          d.statut === "valide_chef" || 
          d.statut === "valide_client" || 
          d.statut === "devis_genere"
        )
        setDossiers(clientList.length > 0 ? clientList : list)
        if (!selectedDossier && list.length > 0) {
          setSelectedDossier(clientList[0] || list[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientDossiers()
  }, [])

  useEffect(() => {
    if (selectedDossier) {
      setValidated(selectedDossier.statut === "valide_client")
      setOptionType(selectedDossier.choix_client?.includes("Circulaire") ? "circulaire" : "origine")
    }
  }, [selectedDossier])

  const devis = selectedDossier?.devis_ia
  const pieces = Array.isArray(devis?.pieces_principales) ? devis.pieces_principales : []
  const peripheriques = Array.isArray(devis?.peripheriques) ? devis.peripheriques : []
  const mainOeuvre = Array.isArray(devis?.main_oeuvre) ? devis.main_oeuvre : []

  // Calculs tarifaires
  const tauxHoraire = 85.00
  const totalHeures = mainOeuvre.reduce((acc: number, curr: any) => acc + (Number(curr.heures) || 0), 0)
  const montantMO = totalHeures * tauxHoraire

  // Estimation du montant des pièces
  const basePieces = (pieces.length * 85.00) + (peripheriques.length * 15.00)
  const prixPieces = optionType === "circulaire" ? basePieces * 0.70 : basePieces
  const totalHT = montantMO + prixPieces
  const totalTTC = totalHT * 1.20

  const handleValidateClient = async () => {
    if (!selectedDossier) return
    setIsSubmitting(true)
    try {
      const choixLabel = optionType === "origine" ? "Pièces d'Origine Constructeur" : "Économie Circulaire (PIEC -30%)"
      await updateDossierStatusAndData(selectedDossier.id, {
        statut: "valide_client",
        choix_client: choixLabel
      })
      setValidated(true)
    } catch (err) {
      alert("Erreur lors de la validation : " + err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4 selection:bg-emerald-500/30">
      
      {/* SÉLECTEUR DE DOSSIER CLIENT (POUR TEST & NAVIGATION) */}
      <section className="bg-[#111827]/90 border border-white/10 rounded-2xl p-3 shadow-xl">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Choisir le dossier client
          </span>
          <button 
            onClick={loadClientDossiers} 
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {dossiers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDossier(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                selectedDossier?.id === d.id
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                  : "bg-[#0B0F17] text-slate-400 border-white/5 hover:border-slate-700"
              }`}
            >
              <span>{d.immatriculation}</span>
              <span className="text-[9px] opacity-80 uppercase">
                {d.statut === "valide_client" ? "✓ Accord" : d.statut === "valide_chef" ? "Prêt" : "Atelier"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {selectedDossier ? (
        <>
          {/* CARTE EN-TÊTE DU VÉHICULE */}
          <header className="bg-gradient-to-br from-slate-900 to-[#111827] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-950 border border-blue-700/50 text-blue-400 rounded-lg">
                  {selectedDossier.immatriculation}
                </span>
                <h1 className="font-bold text-lg text-slate-100 mt-2">{selectedDossier.vin || "Véhicule Client"}</h1>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Compteur</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedDossier.kilometrage ? `${Number(selectedDossier.kilometrage).toLocaleString("fr-FR")} km` : "---"}
                </span>
              </div>
            </div>

            <div className="bg-[#0B0F17]/80 p-3 rounded-2xl border border-white/5 text-xs text-slate-300">
              <span className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Constat d'intervention atelier</span>
              <p className="font-medium text-slate-200">{selectedDossier.constats_technicien || "Contrôle périodique complet"}</p>
            </div>
          </header>

          {/* SÉLECTION TRANSPARENTE DU TYPE DE PIÈCES */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Option de réparation recommandée
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1 : Origine Constructeur */}
              <div
                onClick={() => !validated && setOptionType("origine")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  optionType === "origine"
                    ? "bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "bg-[#111827]/60 border-white/5 opacity-70"
                }`}
              >
                <div className="flex justify-between items-start">
                  <ShieldCheck className={`w-5 h-5 ${optionType === "origine" ? "text-blue-400" : "text-slate-500"}`} />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Garantie 2 ans</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-100">Origine Constructeur</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pièces neuves certifiées</p>
                </div>
              </div>

              {/* Option 2 : Économie Circulaire */}
              <div
                onClick={() => !validated && setOptionType("circulaire")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  optionType === "circulaire"
                    ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-[#111827]/60 border-white/5 opacity-70"
                }`}
              >
                <div className="flex justify-between items-start">
                  <Sparkles className={`w-5 h-5 ${optionType === "circulaire" ? "text-emerald-400" : "text-slate-500"}`} />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">-30% Pièces</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-100">Économie Circulaire</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reconditionné certifié PIEC</p>
                </div>
              </div>
            </div>
          </section>

          {/* DÉTAIL DE L'INTERVENTION */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-emerald-400" /> Détail des opérations
            </h2>

            <div className="space-y-2 text-xs">
              {pieces.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-200 font-medium leading-tight">{p.designation}</span>
                  <span className="font-mono text-cyan-400 font-bold shrink-0 ml-2">x{p.quantite}</span>
                </div>
              ))}
              {mainOeuvre.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center bg-[#0B0F17]/80 p-2.5 rounded-xl border border-white/5 text-slate-400">
                  <span>{m.operation}</span>
                  <span className="font-mono text-slate-300 shrink-0 ml-2">{m.heures} h</span>
                </div>
              ))}
            </div>

            {/* HEURE DE RESTITUTION ESTIMÉE */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Véhicule disponible estimé : <strong className="text-white">Aujourd'hui à 17h30</strong></span>
            </div>
          </section>

          {/* TOTAL & VALIDATION */}
          <section className="bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-end border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Montant Estimé</span>
                <span className="text-xs text-slate-400">TVA 20% incluse</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-400">{totalTTC.toFixed(2)} €</span>
                <span className="text-[11px] font-mono text-slate-400 block">({totalHT.toFixed(2)} € HT)</span>
              </div>
            </div>

            {validated ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Devis validé en ligne — Travaux autorisés !
              </div>
            ) : (
              <button
                type="button"
                onClick={handleValidateClient}
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Transmission de l'accord...
                  </>
                ) : (
                  <>
                    Valider le devis & Lancer les travaux <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </section>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500 text-xs">
          Aucun devis disponible pour consultation.
        </div>
      )}
    </main>
  )
}
