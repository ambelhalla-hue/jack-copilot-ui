"use client"

import Link from "next/link"
import { 
  Car, 
  Wrench, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  Layers 
} from "lucide-react"

export default function HubAtelier() {
  const routes = [
    {
      title: "1. Espace Réception (CCS)",
      desc: "Scan plaque, kilométrage d'entrée, photos du tour de véhicule.",
      href: "/ccs",
      icon: Car,
      color: "from-blue-600 to-cyan-600",
      badge: "Accueil Client"
    },
    {
      title: "2. Poste Atelier (Technicien)",
      desc: "Diagnostic guidé Jack, mesures physiques, transmission du constat.",
      href: "/tech",
      icon: Wrench,
      color: "from-cyan-600 to-teal-600",
      badge: "Sous le capot"
    },
    {
      title: "3. Tour de Contrôle (Chef d'Atelier)",
      desc: "Validation par blocs de la nomenclature IA et transmission synchrone.",
      href: "/chef",
      icon: ShieldCheck,
      color: "from-amber-600 to-orange-600",
      badge: "Supervision"
    },
    {
      title: "4. Vue Client Interactif (SMS)",
      desc: "Arbitrage pièces d'origine vs économie circulaire et heure de restitution.",
      href: "/devis/1",
      icon: Smartphone,
      color: "from-emerald-600 to-green-600",
      badge: "Mobile Client"
    }
  ]

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center font-sans max-w-3xl mx-auto p-4 md:p-6 gap-6 selection:bg-blue-500/30">
      
      {/* HEADER DU PORTAIL */}
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/60 border border-blue-800/40 rounded-full text-blue-400 text-xs font-mono font-semibold">
          <Layers className="w-3.5 h-3.5" /> Écosystème Jack Copilot
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          Portail Central de l'Atelier
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
          Sélectionnez un poste de travail pour tester le cycle connecté de bout en bout.
        </p>
      </header>

      {/* GRILLE DES 4 POSTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route, idx) => {
          const Icon = route.icon
          return (
            <Link
              key={idx}
              href={route.href}
              className="group p-5 bg-[#111827]/70 hover:bg-[#111827] border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 shadow-lg flex flex-col justify-between gap-4 cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 bg-gradient-to-br ${route.color} rounded-xl text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md">
                  {route.badge}
                </span>
              </div>

              <div>
                <h2 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors">
                  {route.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {route.desc}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-white pt-2 border-t border-white/5">
                Accéder à l'interface <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
