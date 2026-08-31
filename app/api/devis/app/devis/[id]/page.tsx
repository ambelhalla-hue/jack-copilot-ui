"use client"

import { useState, useEffect } from "react"
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  Car, 
  FileText, 
  RefreshCw,
  Layers,
  Wrench,
  ArrowLeft,
  Package,
  Cpu,
  Info
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

export default function ClientInteractiveDevis() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Options du devis
  const [optionType, setOptionType] = useState<"origine" | "circulaire">("origine")
  const [validated, setValidated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour ouvrir / fermer les sections détaillées au clic
  const [openPieces, setOpenPieces] = useState(true)
  const [openPeripheriques, setOpenPeripheriques] = useState(false)
  const [openMO, setOpenMO] = useState(false)

  const loadClientDossiers = async () => {
    try {
      setLoading(true)
      const list = await getAllDossiers()
      if (list && Array.isArray(list)) {
        // Affiche les dossiers prêts ou validés
        const clientList = list.filter((d: any) => 
          d.statut === "valide_chef" || 
          d.statut === "valide_client" || 
          d.statut === "devis_genere"
        )
        setDossiers(clientList.length > 0 ? clientList : list)
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

  const handleSelectVehicle = (d: any) => {
    setSelectedDossier(d)
    setValidated(d.statut === "valide_client")
    setOptionType(d.choix_client?.includes("Circulaire") ? "circulaire" : "origine")
    setOpenPieces(true)
    setOpenPeripheriques(false)
    setOpenMO(false)
  }

  const devis = selectedDossier?.devis_ia
  const pieces = Array.isArray(devis?.pieces_principales) ? devis.pieces_principales : []
  const peripheriques = Array.isArray(devis?.peripheriques) ? devis.peripheriques : []
  const mainOeuvre = Array.isArray(devis?.main_oeuvre) ? devis.main_oeuvre : []

  // Tarification
  const tauxHoraire = 85.00
  const totalHeures = mainOeuvre.reduce((acc: number, curr: any) => acc + (Number(curr.heures) || 0), 0)
  const montantMO = totalHeures > 0 ? totalHeures * tauxHoraire : 95.00

  const basePieces = (pieces.length > 0 ? pieces.length * 85.00 : 120.00) + (peripheriques.length * 15.00)
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
      alert("Erreur validation devis : " + err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // VUE 1 : INTERFACE DE CHOIX DU VÉHICULE
  if (!selectedDossier) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4">
        <header className="p-4 bg-[#111827]/80 border border-white/10 rounded-2xl shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100">Espace Devis Client</h1>
              <p className="text-[11px] text-slate-400">Sélectionnez votre véhicule pour consulter le détail</p>
            </div>
          </div>
          <button onClick={loadClientDossiers} className="p-2 text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </header>

        <section className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Chargement de vos devis...
            </div>
          ) : dossiers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#111827]/40 border border-white/5 rounded-2xl">
              Aucun devis en attente de consultation.
            </div>
          ) : (
            dossiers.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectVehicle(d)}
                className="bg-[#111827]/80 hover:bg-[#111827] border border-white/10 hover:border-blue-500/50 rounded-2xl p-4 flex justify-between items-center shadow-lg transition cursor-pointer group"
              >
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                    {d.immatriculation}
                  </span>
                  <h2 className="font-bold text-sm text-slate-100 mt-1.5">{d.vin || "Véhicule client"}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bilan : <span className="text-slate-200">{d.constats_technicien || "Entretien & réparations"}</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </section>
      </main>
    )
  }

  // VUE 2 : DEVIS DÉTAILLÉ ET CLIQUABLE DU VÉHICULE
  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4 pb-12 selection:bg-emerald-500/30">
      
      {/* HEADER AVEC RETOUR */}
      <header className="flex items-center justify-between p-4 bg-[#111827] border border-white/10 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDossier(null)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Changer de véhicule"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {selectedDossier.immatriculation}
              </span>
              <h1 className="font-bold text-sm text-slate-100">{selectedDossier.vin || "Véhicule client"}</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{selectedDossier.kilometrage ? Number(selectedDossier.kilometrage).toLocaleString("fr-FR") : "---"} km</strong>
            </p>
          </div>
        </div>
      </header>

      {/* BILAN CONSTAT MÉCANIQUE */}
      <section className="bg-[#111827]/80 border border-white/10 rounded-2xl p-4 space-y-1.5 shadow-md">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3 text-blue-400" /> Bilan des contrôles d'atelier
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#0B0F17] p-2.5 rounded-xl border border-white/5">
          {selectedDossier.constats_technicien || "Intervention mécanique et contrôles périodiques de sécurité."}
        </p>
      </section>

      {/* FORMULE DE PIÈCES (ORIGINE VS CIRCULAIRE) */}
      <section className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Choix de la formule de réparation
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => !validated && setOptionType("origine")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              optionType === "origine"
                ? "bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                : "bg-[#111827]/60 border-white/5 opacity-70"
            }`}
          >
            <div className="flex justify-between items-start">
              <ShieldCheck className={`w-4 h-4 ${optionType === "origine" ? "text-blue-400" : "text-slate-500"}`} />
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Garantie 2 ans</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100">Origine Constructeur</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Pièces certifiées neuves</p>
            </div>
          </div>

          <div
            onClick={() => !validated && setOptionType("circulaire")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              optionType === "circulaire"
                ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-[#111827]/60 border-white/5 opacity-70"
            }`}
          >
            <div className="flex justify-between items-start">
              <Sparkles className={`w-4 h-4 ${optionType === "circulaire" ? "text-emerald-400" : "text-slate-500"}`} />
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">-30% Pièces</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100">Économie Circulaire</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Reconditionné certifié PIEC</p>
            </div>
          </div>
        </div>
      </section>

      {/* DÉTAIL DÉPLIABLE DU DEVIS (ACCORDÉONS CLIQUABLES) */}
      <section className="space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Détail des opérations (Cliquez pour afficher)
        </span>

        {/* 1. Pièces Principales */}
        <div className="bg-[#111827]/80 border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenPieces(!openPieces)}
            className="w-full p-3.5 flex justify-between items-center text-xs font-bold text-slate-200 hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Pièces Principales de Rechange ({pieces.length})</span>
            </div>
            {openPieces ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openPieces && (
            <div className="p-3 pt-0 space-y-2 text-xs border-t border-white/5">
              {pieces.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic py-1">Inclus selon diagnostic de l'intervention.</p>
              ) : (
                pieces.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-start bg-[#0B0F17] p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-slate-200 font-medium block leading-tight">{p.designation}</span>
                      <span className="text-[10px] font-mono text-slate-500">Réf : {p.ref || "OEM-STD"}</span>
                    </div>
                    <span className="font-mono text-cyan-400 font-bold shrink-0 ml-2">x{p.quantite || 1}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. Périphériques et Fournitures */}
        <div className="bg-[#111827]/80 border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenPeripheriques(!openPeripheriques)}
            className="w-full p-3.5 flex justify-between items-center text-xs font-bold text-slate-200 hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Périphériques & Fournitures ({peripherals.length || 1})</span>
            </div>
            {openPeripheriques ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openPeripheriques && (
            <div className="p-3 pt-0 space-y-2 text-xs border-t border-white/5">
              {peripheriques.length === 0 ? (
                <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-slate-300">Fournitures d'atelier, nettoyant dégraissant & recyclage</span>
                  <span className="font-mono text-amber-400 font-bold">x1</span>
                </div>
              ) : (
                peripheriques.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#0B0F17] p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-300">{p.designation}</span>
                    <span className="font-mono text-amber-400 font-bold">x{p.quantite || 1}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. Main-d'Œuvre */}
        <div className="bg-[#111827]/80 border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenMO(!openMO)}
            className="w-full p-3.5 flex justify-between items-center text-xs font-bold text-slate-200 hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Main-d'Œuvre & Barèmes Constructeur</span>
            </div>
            {openMO ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openMO && (
            <div className="p-3 pt-0 space-y-2 text-xs border-t border-white/5">
              {mainOeuvre.length === 0 ? (
                <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-slate-300">Intervention mécanique et essais routiers</span>
                  <span className="font-mono text-emerald-400 font-bold">1.20 h</span>
                </div>
              ) : (
                mainOeuvre.map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 text-slate-300">
                    <span>{m.operation}</span>
                    <span className="font-mono text-emerald-400 font-bold">{m.heures} h</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* DISPONIBILITÉ */}
      <div className="flex items-center gap-2 p-3 bg-slate-900/90 border border-white/5 rounded-xl text-xs text-slate-300">
        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Restitution estimée : <strong className="text-white">Aujourd'hui à 17h30</strong></span>
      </div>

      {/* BLOC TOTAL & ACCORD CLIENT */}
      <section className="bg-gradient-to-br from-[#111827] to-black border border-white/10 rounded-2xl p-4 space-y-3 shadow-2xl">
        <div className="flex justify-between items-end border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Montant Estimé Global</span>
            <span className="text-xs text-slate-400 font-mono">TVA 20% incluse</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-emerald-400">{totalTTC.toFixed(2)} €</span>
            <span className="text-[11px] font-mono text-slate-400 block">({totalHT.toFixed(2)} € HT)</span>
          </div>
        </div>

        {validated ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Accord enregistré — Pièces réservées et travaux autorisés !
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
    </main>
  )
}
