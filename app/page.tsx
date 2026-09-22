"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Car, 
  Plus, 
  Archive, 
  Clock, 
  LogOut, 
  RefreshCw, 
  ArrowRight, 
  Wrench, 
  CheckCircle2, 
  FileText 
} from "lucide-react"
import { supabase, getDossiersByStatut, DossierAtelier } from "@/lib/supabase"

export default function AtelierDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"en_cours" | "archives">("en_cours")
  const [dossiers, setDossiers] = useState<DossierAtelier[]>([])
  const [userEmail, setUserEmail] = useState<string>("")

  // Vérification de la session et chargement initial
  useEffect(() => {
    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      setUserEmail(user.email || "Technicien")
      loadVehicles(activeTab)
    }
    initSession()
  }, [])

  // Rechargement au changement d'onglet
  useEffect(() => {
    loadVehicles(activeTab)
  }, [activeTab])

  const loadVehicles = async (tab: "en_cours" | "archives") => {
    setLoading(true)
    try {
      const list = await getDossiersByStatut(tab)
      setDossiers(list)
    } catch (err) {
      console.error("Erreur chargement dossiers :", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth")
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans p-4 max-w-2xl mx-auto gap-4">
      
      {/* 1. EN-TÊTE DASHBOARD */}
      <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Jack Copilot</h1>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">{userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadVehicles(activeTab)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:bg-slate-800"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BOUTON ACTION MAJEURE : NOUVEAU VÉHICULE */}
      <button
        onClick={() => router.push("/ccs")}
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Nouveau véhicule</span>
      </button>

      {/* 3. SÉLECTEUR D'ONGLETS FILTRES */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab("en_cours")}
          className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "en_cours"
              ? "bg-slate-800 text-blue-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>En cours</span>
        </button>

        <button
          onClick={() => setActiveTab("archives")}
          className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === "archives"
              ? "bg-slate-800 text-emerald-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archives</span>
        </button>
      </div>

      {/* 4. LISTE DES DOSSIERS */}
      <section className="flex-1 overflow-y-auto space-y-2.5">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> Chargement de l'atelier...
          </div>
        ) : dossiers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl p-6">
            {activeTab === "en_cours"
              ? "Aucun véhicule en cours sous le pont."
              : "Aucune intervention archivée."}
          </div>
        ) : (
          dossiers.map((d) => (
            <div
              key={d.id}
              onClick={() => router.push(`/tech/${d.id}`)}
              className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition group"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-800/60 text-blue-400 rounded">
                    {d.immatriculation}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {d.kilometrage ? `${d.kilometrage.toLocaleString("fr-FR")} km` : "0 km"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-200 truncate">
                  {d.vin || "Modèle non spécifié"}
                </p>
                {d.constats_technicien && (
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {d.constats_technicien}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-slate-500 group-hover:text-blue-400 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </section>

    </main>
  )
}
