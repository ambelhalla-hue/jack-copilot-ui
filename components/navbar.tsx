"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, Wrench, ShieldCheck, Home } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Hub", icon: Home },
    { href: "/ccs", label: "Réception (CCS)", icon: Car },
    { href: "/tech", label: "Atelier (Tech)", icon: Wrench },
    { href: "/chef", label: "Tour de Contrôle", icon: ShieldCheck },
  ]

  return (
    <nav className="bg-[#111827]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-sm text-cyan-400">
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">JACK COPILOT</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
