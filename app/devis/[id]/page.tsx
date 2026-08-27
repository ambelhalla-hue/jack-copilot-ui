"use client"

import { useState } from "react"
import { 
  Car, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Recycle, 
  Wrench, 
  Layers, 
  FileText, 
  ChevronRight, 
  Send 
} from "lucide-react"

export default function DevisClientInteractif() {
  // Option sélectionnée par le client (origine ou circulaire)
  const [selectedOption, setSelectedOption] = useState<"origine" | "circulaire">("circulaire")
  const [valide, setValide] = useState(false)

  // Données transmises par l'atelier
  const vehicle = "Peugeot 308 II - 1.5 BlueHDi 130"
  const immat = "AA-123-BB"
  const intervention = "Remplacement Boîte de Vitesses & Kit Embrayage"

  // Tarifs et délais selon l'option
  const optionsData = {
    origine: {
      nom: "Pièces Neuves d'Origine Constructeur",
      badge: "Garantie Constructeur PSA",
      prixTotal: "2 180,00 € TTC",
      delaiRestitution: "Aujourd'hui à 18h00",
      description: "Boîte neuve et embrayage d'origine certifiés Stellantis."
    },
    circulaire: {
      nom: "Économie Circulaire (Échange Standard Garanti)",
      badge: "Éco-Responsable & Économique",
      prixTotal: "1 520,00 € TTC",
      delaiRestitution: "Aujourd'hui à 18h00",
      description: "Organe reconditionné à neuf selon le cahier des charges constructeur avec garantie identique."
    }
  }

  const currentOption = optionsData[selectedOption]

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans max-w-lg mx-auto p-4 gap-5 selection:bg-blue-500/30">
      
      {/* HEADER CONCESSION & VÉHICULE */}
      <header className="p-4 bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 border border-blue-700/50 text-blue-400 rounded">
                {immat}
              </span>
              <h1 className="font-bold text-slate-100 text-sm">{vehicle}</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Proposition de travaux d'atelier</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-semibold">
          Sécurisé
        </span>
      </header>

      {valide ? (
        <section className="p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <h2 className="text-base font-bold text-emerald-300">Proposition validée avec succès !</h2>
          <p className="text-xs text-slate-300">
            L'atelier a été notifié de votre accord pour l'option <strong className="text-white">{currentOption.nom}</strong>.
          </p>
          <div className="bg-[#0B0F17] p-3.5 rounded-xl border border-white/5 w-full text-xs font-mono text-left space-y-1">
            <p className="text-slate-400">Heure de restitution prévue : <strong className="text-cyan-400">{currentOption.delaiRestitution}</strong></p>
            <p className="text-slate-400">Montant convenu : <strong className="text-emerald-400">{currentOption.prixTotal}</strong></p>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Un SMS de confirmation vous sera envoyé dès que votre véhicule sera prêt.
          </p>
        </section>
      ) : (
        <>
          {/* EXPLICATION ATELIER (LANGAGE CLIENT) */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
              <FileText className="w-4 h-4 text-cyan-400" /> Rapport de Diagnostic
            </div>
            <h2 className="text-sm font-bold text-slate-100">{intervention}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le contrôle sur pont confirme une usure prononcée de la butée et un jeu interne sur la transmission. Pour garantir votre sécurité et la longévité de l'intervention, la visserie neuve à usage unique et les fluides normés sont systématiquement inclus.
            </p>
          </section>

          {/* SÉLECTEUR D'OPTIONS TRANSPARENTES */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Choisissez votre option de réparation :
            </h2>

            {/* OPTION 1 : ÉCONOMIE CIRCULAIRE */}
            <div
              onClick={() => setSelectedOption("circulaire")}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                selectedOption === "circulaire"
                  ? "bg-emerald-950/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "bg-[#111827]/70 border-white/10 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Recycle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm text-slate-100">Économie Circulaire</h3>
                    <span className="text-[10px] text-emerald-400 font-semibold">{optionsData.circulaire.badge}</span>
                  </div>
                </div>
                <span className="font-mono text-sm md:text-base font-bold text-emerald-400">
                  {optionsData.circulaire.prixTotal}
                </span>
              </div>
              <p className="text-xs text-slate-300">{optionsData.circulaire.description}</p>
            </div>

            {/* OPTION 2 : PIÈCES D'ORIGINE */}
            <div
              onClick={() => setSelectedOption("origine")}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                selectedOption === "origine"
                  ? "bg-blue-950/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                  : "bg-[#111827]/70 border-white/10 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm text-slate-100">Pièces Neuves d'Origine</h3>
                    <span className="text-[10px] text-blue-400 font-semibold">{optionsData.origine.badge}</span>
                  </div>
                </div>
                <span className="font-mono text-sm md:text-base font-bold text-slate-200">
                  {optionsData.origine.prixTotal}
                </span>
              </div>
              <p className="text-xs text-slate-300">{optionsData.origine.description}</p>
            </div>
          </section>

          {/* IMPACT SUR LE DÉLAI DE RESTITUTION */}
          <section className="bg-[#111827]/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs text-slate-400 block">Restitution estimée du véhicule :</span>
                <strong className="text-sm text-cyan-300 font-mono">{currentOption.delaiRestitution}</strong>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded">
              Aujourd'hui
            </span>
          </section>

          {/* BOUTON DE VALIDATION CLIENT */}
          <button
            onClick={() => setValide(true)}
            className="w-full py-4 px-6 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Valider cette option ({currentOption.prixTotal})
          </button>
        </>
      )}
    </main>
  )
}
