"use client"

import Link from "next/link"
import { 
  Layers, 
  Wrench, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight
} from "lucide-react"

export default function HomePortal() {
  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center items-center font-sans p-4 md:p-8 selection:bg-blue-500/30">
      
      {/* HEADER PORTAIL */}
      <div className="text-center max-w-xl mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5" /> Écosystème Jack Copilot
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Portail Central de l'Atelier
        </h1>
        <p className="text-xs md:text-sm text-slate-400">
          Sélectionnez un poste de travail pour tester le cycle connecté de bout en bout.
        </p>
      </div>

      {/* GRILLE DES 4 POSTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
        
        {/* 1. ESPACE RÉCEPTION CCS */}
        <Link 
          href="/ccs" 
          className="group p-5 bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-blue-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md uppercase">
              Accueil Client
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm md:text-base group-hover:text-blue-300 transition-colors">
              1. Espace Réception (CCS)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Scan plaque, kilométrage d'entrée, photos du tour de véhicule.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            Accéder à l'interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2. POSTE ATELIER TECHNICIEN */}
        <Link 
          href="/tech" 
          className="group p-5 bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-cyan-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-xl group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md uppercase">
              Sous le capot
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm md:text-base group-hover:text-cyan-300 transition-colors">
              2. Poste Atelier (Technicien)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Diagnostic guidé Jack, mesures physiques, transmission du constat.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            Accéder à l'interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 3. TOUR DE CONTRÔLE CHEF D'ATELIER */}
        <Link 
          href="/chef" 
          className="group p-5 bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-xl group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md uppercase">
              Supervision
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm md:text-base group-hover:text-amber-300 transition-colors">
              3. Tour de Contrôle (Chef d'Atelier)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Validation par blocs de la nomenclature IA et transmission synchrone.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            Accéder à l'interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 4. VUE CLIENT INTERACTIF (SMS) */}
        <Link 
          href="/devis/1" 
          className="group p-5 bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-emerald-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 shadow-lg cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md uppercase">
              Mobile Client
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm md:text-base group-hover:text-emerald-300 transition-colors">
              4. Vue Client Interactif (SMS)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Arbitrage pièces d'origine vs économie circulaire et heure de restitution.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            Accéder à l'interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>
    </main>
  )
}
