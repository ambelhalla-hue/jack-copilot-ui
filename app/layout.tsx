import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Jack Copilot",
  description: "Copilote de diagnostic et d'atelier autonome",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-[#0B0F17] text-slate-100 min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  )
}
