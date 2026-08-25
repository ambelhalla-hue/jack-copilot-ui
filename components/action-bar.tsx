'use client'

import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { MeasureStatus } from '@/components/multimeter'

export function ActionBar({
  status,
  onSelect,
}: {
  status: MeasureStatus
  onSelect: (status: MeasureStatus) => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 glass pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 md:flex-row">
        <button
          type="button"
          onClick={() => onSelect('ok')}
          aria-pressed={status === 'ok'}
          className="flex min-h-18 flex-1 items-center justify-center gap-3 rounded-2xl bg-signal px-6 text-signal-foreground shadow-lg shadow-signal/20 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal aria-pressed:ring-4 aria-pressed:ring-signal/30"
        >
          <CircleCheck className="size-7 shrink-0" aria-hidden="true" />
          <span className="text-left">
            <span className="block text-lg font-bold leading-tight">
              Mesure Conforme
            </span>
            <span className="block font-mono text-xs opacity-80">5V</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('ko')}
          aria-pressed={status === 'ko'}
          className="flex min-h-18 flex-1 items-center justify-center gap-3 rounded-2xl bg-alert px-6 text-alert-foreground shadow-lg shadow-alert/20 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert aria-pressed:ring-4 aria-pressed:ring-alert/30"
        >
          <TriangleAlert className="size-7 shrink-0" aria-hidden="true" />
          <span className="text-left">
            <span className="block text-lg font-bold leading-tight">
              Non Conforme
            </span>
            <span className="block font-mono text-xs opacity-80">Zéro / 0V</span>
          </span>
        </button>
      </div>
    </div>
  )
}
