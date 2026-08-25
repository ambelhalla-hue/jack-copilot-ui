'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/app-header'
import { VehicleCard } from '@/components/vehicle-card'
import { DiagTimeline } from '@/components/diag-timeline'
import { JackBubble } from '@/components/jack-bubble'
import { Multimeter, type MeasureStatus } from '@/components/multimeter'
import { ActionBar } from '@/components/action-bar'

const messages: Record<MeasureStatus, string> = {
  waiting:
    "J'analyse le code P0234 sur ce bloc 1.5 BlueHDi. Vérifions l'électrovanne de turbo. Mets le contact, pique la Pin 3 du connecteur et donne-moi la tension.",
  ok: "Parfait, 5V au repos : l'alimentation du capteur et le circuit de commande sont sains. On passe au contrôle de la résistance de l'électrovanne (attendu 15–20 Ω), débranche le connecteur.",
  ko: "Zéro volt sur la Pin 3 : l'électrovanne n'est pas alimentée. Remonte le faisceau vers le calculateur et contrôle la continuité, puis le fusible F14 de la platine moteur.",
}

export default function DiagnosticPage() {
  const [status, setStatus] = useState<MeasureStatus>('waiting')

  return (
    <div className="grid-floor min-h-dvh">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 pb-64 pt-20 md:pb-40 md:pt-24">
        <h1 className="sr-only">
          Diagnostic en cours — Peugeot 3008 II, code P0234
        </h1>

        <div className="flex flex-col gap-5">
          <VehicleCard />

          <section aria-label="Zone de diagnostic" className="flex flex-col gap-4">
            <DiagTimeline activeIndex={2} />
            <JackBubble message={messages[status]} />
            <Multimeter status={status} />
          </section>

          {status !== 'waiting' && (
            <button
              type="button"
              onClick={() => setStatus('waiting')}
              className="mx-auto rounded-xl px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground ring-1 ring-glass-border transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Refaire la mesure
            </button>
          )}
        </div>
      </main>

      <ActionBar status={status} onSelect={setStatus} />
    </div>
  )
}
