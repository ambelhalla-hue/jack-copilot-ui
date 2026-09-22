"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Wrench, Lock, Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react"

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      if (isSignUp) {
        // Inscription
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert("Compte créé avec succès ! Tu peux maintenant te connecter.")
        setIsSignUp(false)
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push("/") // Redirection vers le Dashboard
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur d'authentification.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        
        {/* LOGO & TITRE */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Jack Copilot</h1>
            <p className="text-xs text-slate-400">Espace Mécaniciens & Bricoleurs</p>
          </div>
        </div>

        {/* ALERTE ERREUR */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Email d'atelier
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mecano@atelier.fr"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 pl-10"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 pl-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isSignUp ? "Créer mon compte" : "Accéder à mon atelier"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* BASCULE CONNEXION / INSCRIPTION */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
            }}
            className="text-xs text-slate-400 hover:text-blue-400 transition"
          >
            {isSignUp
              ? "Déjà un compte ? Se connecter"
              : "Nouveau sur Jack Copilot ? Créer un compte"}
          </button>
        </div>

        {/* RAPPEL SÉCURITÉ */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Données et véhicules strictement isolés</span>
        </div>

      </div>
    </main>
  )
}
