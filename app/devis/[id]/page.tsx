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
  RefreshCw, 
  Layers, 
  ArrowLeft, 
  Package, 
  Cpu, 
  Info 
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

// Fonction de sécurité absolue pour éviter tout crash React
function toText(val: any, fallback = ""): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === "string") return val
  if (typeof val === "number") return String(val)
  if (typeof val === "object") {
    return val.constat_court || val.designation || val.operation || val.label || ""
  }
  return String(val)
}

function parseSafe(devisRaw: any) {
  if (!devisRaw) return {}
  if (typeof devisRaw === "object") return devisRaw
  try {
    return JSON.parse(devisRaw)
  } catch {
    return {}
  }
}

export default function DevisClientInteractif() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const [optionType, setOptionType] = useState<"origine" | "circulaire">("circulaire")
  const [validated, setValidated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [openPieces, setOpenPieces] = useState(true)
  const [openPeripheriques, setOpenPeripheriques] = useState(false)
  const [openMO, setOpenMO] = useState(false)

  const loadClientDossiers = async () => {
    try {
      setLoading(true)
      const list = await getAllDossiers()
      if (Array.isArray(list)) {
        setDossiers(list)
      }
    } catch (err) {
      console.error("Erreur chargement Supabase:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientDossiers()
  }, [])

  const handleSelectVehicle = (d: any) => {
    if (!d) return
    setSelectedDossier(d)
    setValidated(d.statut === "valide_client")
    setOptionType(typeof d.choix_client === "string" && d.choix_client.includes("Origine") ? "origine" : "circulaire")
    setOpenPieces(true)
    setOpenPeripheriques(false)
    setOpenMO(false)
  }

  // Extraction blindée contre les crashs
  const devisObj = parseSafe(selectedDossier?.devis_ia || selectedDossier?.devis_brouillon)
  const pieces = Array.isArray(devisObj?.pieces_principales) ? devisObj.pieces_principales : []
  const peripheriques = Array.isArray(devisObj?.peripheriques) ? devisObj.peripheriques : []
  const mainOeuvre = Array.isArray(devisObj?.main_oeuvre) ? devisObj.main_oeuvre : []

  // Tarification
  const totalHeures = mainOeuvre.reduce((acc: number, curr: any) => {
    const h = typeof curr?.heures === "number" ? curr.heures : parseFloat(curr?.heures) || 0
    return acc + h
  }, 0)

  const montantMO = totalHeures > 0 ? totalHeures * 85.0 : 95.0

  const basePieces = pieces.reduce((acc: number, p: any) => {
    const pu = typeof p?.prix_unitaire_ht === "number" ? p.prix_unitaire_ht : parseFloat(p?.prix_unitaire_ht) || 85.0
    const q = typeof p?.quantite === "number" ? p.quantite : parseInt(p?.quantite) || 1
    return acc + (pu * q)
  }, 0)

  const baseFournitures = peripheriques.reduce((acc: number, p: any) => {
    const pu = typeof p?.prix_unitaire_ht === "number" ? p.prix_unitaire_ht : parseFloat(p?.prix_unitaire_ht) || 15.0
    const q = typeof p?.quantite === "number" ? p.quantite : parseInt(p?.quantite) || 1
    return acc + (pu * q)
  }, 0)

  const totalHT_Origine = montantMO + (basePieces > 0 ? basePieces : 140.0) + (baseFournitures > 0 ? baseFournitures : 15.0)
  const totalTTC_Origine = totalHT_Origine * 1.2

  const totalHT_Circulaire = montantMO + ((basePieces > 0 ? basePieces : 140.0) * 0.7) + (baseFournitures > 0 ? baseFournitures : 15.0)
  const totalTTC_Circulaire = totalHT_Circulaire * 1.2

  const totalFinalTTC = optionType === "circulaire" ? totalTTC_Circulaire : totalTTC_Origine

  const handleValidateClient = async () => {
    if (!selectedDossier?.id) return
    setIsSubmitting(true)
    try {
      const choixLabel = optionType === "origine" ? "Pièces d'Origine Constructeur" : "Économie Circulaire (PIEC -30%)"
      await updateDossierStatusAndData(selectedDossier.id, {
        statut: "valide_client",
        choix_client: choixLabel
      })
      setValidated(true)
    } catch (err: any) {
      alert("Erreur lors de la validation : " + (err?.message || "Inconnue"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ÉCRAN 1 : LISTE DE SÉLECTION
  if (!selectedDossier) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4">
        <header className="p-4 bg-[#111827]/80 border border-white/10 rounded-2xl shadow-xl flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100">Vue Client Interactif (SMS)</h1>
              <p className="text-[11px] text-slate-400">Sélectionnez le dossier à prévisualiser</p>
            </div>
          </div>
          <button onClick={loadClientDossiers} className="p-2 text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </header>

        <section className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Chargement des dossiers...
            </div>
          ) : dossiers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#111827]/40 border border-white/5 rounded-2xl">
              Aucun dossier client trouvé dans Supabase.
            </div>
          ) : (
            dossiers.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectVehicle(d)}
                className="bg-[#111827]/80 hover:bg-[#111827] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 flex justify-between items-center shadow-lg transition cursor-pointer group"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                      {toText(d.immatriculation, "SANS-IMMAT")}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                      d.statut === "valide_client"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : d.statut === "valide_chef"
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}>
                      {toText(d.statut, "reception")}
                    </span>
                  </div>
                  <h2 className="font-bold text-sm text-slate-100 mt-1.5">{toText(d.vin, "Véhicule client")}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    Constat : <span className="text-slate-200">{toText(d.constats_technicien, "Intervention atelier")}</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </section>
      </main>
    )
  }

  // ÉCRAN 2 : DEVIS DÉTAILLÉ
  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4 pb-12 selection:bg-emerald-500/30">
      
      <header className="flex items-center justify-between p-4 bg-[#111827] border border-white/10 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDossier(null)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Changer de dossier"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {toText(selectedDossier.immatriculation, "---")}
              </span>
              <h1 className="font-bold text-sm text-slate-100">{toText(selectedDossier.vin, "Véhicule client")}</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{selectedDossier.kilometrage ? Number(selectedDossier.kilometrage).toLocaleString("fr-FR") : "---"} km</strong>
            </p>
          </div>
        </div>
      </header>

      <section className="bg-[#111827]/80 border border-white/10 rounded-2xl p-4 space-y-1.5 shadow-md">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3 text-emerald-400" /> Rapport de Diagnostic & Contrôles
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 whitespace-pre-wrap">
          {toText(selectedDossier.constats_technicien, "Contrôle technique sur pont et remise en état préconisée.")}
        </p>
      </section>

      <section className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Choisissez votre option de réparation :
        </span>

        <div className="flex flex-col gap-2.5">
          <div
            onClick={() => !validated && setOptionType("circulaire")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
              optionType === "circulaire"
                ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                : "bg-[#111827]/60 border-white/5 opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-100">Économie Circulaire</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Éco-responsable & Économique (PIEC -30% pièces)</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {Number(totalTTC_Circulaire || 0).toFixed(2)} € TTC
            </span>
          </div>

          <div
            onClick={() => !validated && setOptionType("origine")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
              optionType === "origine"
                ? "bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                : "bg-[#111827]/60 border-white/5 opacity-70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-100">Pièces Neuves d'Origine</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Garantie Constructeur</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-blue-400">
              {Number(totalTTC_Origine || 0).toFixed(2)} € TTC
            </span>
          </div>
        </div>
      </section>

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
              <span>Pièces Principales ({pieces.length})</span>
            </div>
            {openPieces ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openPieces && (
            <div className="p-3 pt-0 space-y-2 text-xs border-t border-white/5">
              {pieces.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic py-1">Inclus selon diagnostic atelier.</p>
              ) : (
                pieces.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-start bg-[#0B0F17] p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-slate-200 font-medium block leading-tight">{toText(p?.designation, "Pièce de rechange")}</span>
                      <span className="text-[10px] font-mono text-slate-500">Réf : {toText(p?.ref, "OEM-STD")}</span>
                    </div>
                    <span className="font-mono text-cyan-400 font-bold shrink-0 ml-2">x{p?.quantite || 1}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. Périphériques */}
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
                  <span className="text-slate-300">Fournitures d'atelier & recyclage</span>
                  <span className="font-mono text-amber-400 font-bold">x1</span>
                </div>
              ) : (
                peripheriques.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#0B0F17] p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-300">{toText(p?.designation, "Fournitures atelier")}</span>
                    <span className="font-mono text-amber-400 font-bold">x{p?.quantite || 1}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. Main-d'œuvre */}
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
                  <span className="text-slate-300">Intervention mécanique et essais</span>
                  <span className="font-mono text-emerald-400 font-bold">1.20 h</span>
                </div>
              ) : (
                mainOeuvre.map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#0B0F17] p-2.5 rounded-xl border border-white/5 text-slate-300">
                    <span>{toText(m?.operation, "Opération atelier")}</span>
                    <span className="font-mono text-emerald-400 font-bold">{m?.heures || 0} h</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border border-white/5 rounded-2xl text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Restitution estimée :</span>
        </div>
        <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold rounded-lg uppercase">
          Aujourd'hui à 18h00
        </span>
      </div>

      {validated ? (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-center flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Option validée — Travaux autorisés !
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
              Valider cette option ({Number(totalFinalTTC || 0).toFixed(2)} € TTC)
            </>
          )}
        </button>
      )}
    </main>
  )
}
