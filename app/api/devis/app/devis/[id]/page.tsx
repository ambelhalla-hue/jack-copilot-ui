"use client"

import { useState, useEffect, use } from "react"
import { ShieldCheck, CheckCircle2, Car, Clock, Sparkles, Send } from "lucide-react"
import { getDossierById, updateDossierStatusAndData } from "@/lib/supabase"

export default function ClientDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [dossier, setDossier] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState("origine")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchDossier() {
      try {
        const data = await getDossierById(resolvedParams.id)
        if (data) {
          setDossier(data)
          if (data.statut === "valide_client") setIsConfirmed(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDossier()
  }, [resolvedParams.id])

  const handleClientValidation = async () => {
    setSubmitting(true)
    try {
      await updateDossierStatusAndData(resolvedParams.id, {
        statut: "valide_client",
        choix_client: selectedOption === "circulaire" ? "Option Économie Circulaire" : "Option Pièces d'Origine"
      })
      setIsConfirmed(true)
    } catch {
      alert("Erreur lors de la validation du devis.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
        <span className="text-xs text-slate-400 font-mono">Chargement de votre devis sécurisé...</span>
      </main>
    )
  }

  if (!dossier) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
        <span className="text-xs text-rose-400">Devis introuvable ou lien expiré.</span>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-4">
      <header className="p-4 bg-[#111827] border border-white/10 rounded-2xl flex justify-between items-center">
        <div>
          <span className="text-[10px] text-blue-400 font-mono uppercase font-bold">Devis Atelier Digital</span>
          <h1 className="font-bold text-sm text-slate-100">{dossier.vin}</h1>
        </div>
        <span className="font-mono text-xs px-2 py-1 bg-blue-950 border border-blue-700 text-blue-300 rounded-lg">
          {dossier.immatriculation}
        </span>
      </header>

      {isConfirmed ? (
        <section className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          <h2 className="font-bold text-base text-emerald-300">Votre accord a été transmis à l'atelier !</h2>
          <p className="text-xs text-slate-300">
            Le chef d'atelier a été notifié en direct pour passer commande des pièces requises et planifier l'intervention.
          </p>
        </section>
      ) : (
        <>
          <section className="bg-[#111827]/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase text-slate-400">Intervention préconisée</h2>
            <p className="text-xs text-slate-200">{dossier.constats_technicien || "Remise en état mécanique suite au diagnostic"}</p>
          </section>

          {/* CHOIX DES OPTIONS TRANSPARENTES */}
          <section className="flex flex-col gap-2.5">
            <div
              onClick={() => setSelectedOption("origine")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex justify-between items-center ${
                selectedOption === "origine"
                  ? "bg-blue-950/30 border-blue-500 shadow-md"
                  : "bg-[#111827]/60 border-white/5 hover:border-slate-700"
              }`}
            >
              <div>
                <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> Pièces Constructeur d'Origine
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Garantie constructeur préservée</p>
              </div>
              <input type="radio" checked={selectedOption === "origine"} readOnly />
            </div>

            <div
              onClick={() => setSelectedOption("circulaire")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex justify-between items-center ${
                selectedOption === "circulaire"
                  ? "bg-emerald-950/30 border-emerald-500 shadow-md"
                  : "bg-[#111827]/60 border-white/5 hover:border-slate-700"
              }`}
            >
              <div>
                <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Économie Circulaire (Échange Standard)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tarif optimisé et éco-responsable</p>
              </div>
              <input type="radio" checked={selectedOption === "circulaire"} readOnly />
            </div>
          </section>

          <button
            onClick={handleClientValidation}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Validation en cours..." : "Valider l'intervention"}
          </button>
        </>
      )}
    </main>
  )
}
