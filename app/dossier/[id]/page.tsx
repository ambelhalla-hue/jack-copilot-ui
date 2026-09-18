"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getDossierById } from "@/lib/supabase"
import { Car, Wrench, FileText, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react"

export default function FicheDossierPivot() {
  const params = useParams()
  const router = useRouter()
  const dossierId = params?.id as string

  const [dossier, setDossier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"reception" | "atelier" | "devis">("atelier")

  useEffect(() => {
    if (!dossierId) return
    const fetchDossier = async () => {
      try {
        const data = await getDossierById(dossierId)
        setDossier(data)
      } catch (err) {
        console.error("Erreur chargement dossier", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDossier()
  }, [dossierId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-cyan-400 font-mono text-sm gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Synchronisation du dossier...
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#0B0F17] p-6 text-slate-200 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-400 font-bold">Dossier introuvable ou clôturé.</p>
        <button 
          onClick={() => router.push("/chef")}
          className="px-4 py-2 bg-slate-800 rounded-xl text-xs hover:bg-slate-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour Tour de Contrôle
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-4xl mx-auto p-3 md:p-5 gap-4">
      {/* HEADER DOSSIER UNIFIÉ */}
      <header className="p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/chef")} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
            title="Sortir vers le cockpit"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {dossier.immatriculation}
              </span>
              <h1 className="font-bold text-slate-100 text-sm md:text-base">{dossier.vin || "Véhicule Atelier"}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compteur : <strong className="text-emerald-400">{dossier.kilometrage || "--"} km</strong> • Statut : <span className="font-mono text-cyan-300">{dossier.statut}</span>
            </p>
          </div>
        </div>

        {/* BARRE D'ONGLETS TRANSVERSALE */}
        <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-white/10 text-xs w-full md:w-auto">
          <button
            onClick={() => setActiveTab("reception")}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "reception" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Car className="w-3.5 h-3.5" /> Réception
          </button>
          <button
            onClick={() => setActiveTab("atelier")}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "atelier" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Atelier (Tech)
          </button>
          <button
            onClick={() => setActiveTab("devis")}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === "devis" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Devis
          </button>
        </div>
      </header>

      {/* CONTENU DE L'ONGLET ACTIF */}
      <section className="flex-1 bg-[#111827]/50 border border-white/5 rounded-2xl p-4">
        {activeTab === "reception" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase text-slate-400">Photos Tour de Véhicule</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(dossier.photos_tour_vehicule || []).map((url: string, i: number) => (
                <img key={i} src={url} alt={`Vue ${i + 1}`} className="w-full h-32 object-cover rounded-xl border border-white/10" />
              ))}
              {(!dossier.photos_tour_vehicule || dossier.photos_tour_vehicule.length === 0) && (
                <p className="text-xs text-slate-500 col-span-full">Aucune photo enregistrée à l'entrée.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "atelier" && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase text-slate-400">Constats & Pannes</h2>
              <button 
                onClick={() => router.push(`/tech?dossierId=${dossier.id}`)}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
              >
                Ouvrir la session Jack sous le pont
              </button>
            </div>
            <div className="p-3 bg-[#0B0F17] rounded-xl border border-white/5 font-mono text-xs text-slate-300">
              {dossier.constats_technicien || "Aucun constat enregistré pour le moment."}
            </div>
          </div>
        )}

        {activeTab === "devis" && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold uppercase text-slate-400">Synthèse Devis Interactif</h2>
              <button 
                onClick={() => router.push(`/devis/${dossier.id}`)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Accéder à la validation client
              </button>
            </div>
            <pre className="p-3 bg-[#0B0F17] rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              {JSON.stringify(dossier.devis_ia || { message: "Aucun chiffrage généré" }, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </main>
  )
}
