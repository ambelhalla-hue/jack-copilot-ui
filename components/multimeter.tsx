import { Activity, CircleCheck, TriangleAlert, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MeasureStatus = 'waiting' | 'ok' | 'ko'

const config = {
  waiting: {
    value: '--.--',
    unit: 'V',
    label: 'Attente de mesure…',
    tone: 'text-muted-foreground',
    ring: 'ring-glass-border',
    Icon: Activity,
  },
  ok: {
    value: '5.02',
    unit: 'V',
    label: 'Mesure conforme — circuit de commande OK',
    tone: 'text-signal',
    ring: 'ring-signal/40',
    Icon: CircleCheck,
  },
  ko: {
    value: '0.00',
    unit: 'V',
    label: 'Hors plage — coupure ou masse suspectée',
    tone: 'text-alert',
    ring: 'ring-alert/50',
    Icon: TriangleAlert,
  },
} as const

export function Multimeter({ status }: { status: MeasureStatus }) {
  const { value, unit, label, tone, ring, Icon } = config[status]

  return (
    <section
      aria-label="Multimètre digital"
      aria-live="polite"
      className={cn('glass rounded-2xl p-4 ring-1 md:p-5', ring)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <Zap className="size-3.5 text-primary" aria-hidden="true" />
          DC V · Pin 3
        </p>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest',
            tone,
          )}
        >
          <Icon className="size-3" aria-hidden="true" />
          {status === 'waiting' ? 'Sonde prête' : status === 'ok' ? 'Valide' : 'Défaut'}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-background/70 p-4 ring-1 ring-inset ring-glass-border">
        <div className="flex items-end justify-center gap-2">
          <span
            className={cn(
              'font-mono text-5xl font-bold tabular-nums tracking-tight md:text-6xl',
              tone,
              status === 'waiting' && 'animate-pulse-signal',
            )}
          >
            {value}
          </span>
          <span className={cn('pb-1.5 font-mono text-2xl font-semibold', tone)}>
            {unit}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="mt-3 flex h-8 items-end justify-center gap-[3px]"
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-[3px] rounded-full',
                status === 'ok'
                  ? 'bg-signal/70'
                  : status === 'ko'
                    ? 'bg-alert/60'
                    : 'bg-muted-foreground/25',
              )}
              style={{
                height:
                  status === 'waiting'
                    ? '4px'
                    : status === 'ok'
                      ? `${10 + ((i * 7) % 18)}px`
                      : `${3 + ((i * 3) % 6)}px`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className={cn('text-sm', tone)}>{label}</p>
        <p className="rounded-md bg-secondary/60 px-2 py-1 font-mono text-xs text-muted-foreground">
          Plage attendue : 4.5V – 5.0V
        </p>
      </div>
    </section>
  )
}
