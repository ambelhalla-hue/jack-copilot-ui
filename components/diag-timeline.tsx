import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = { id: string; label: string }

const steps: Step[] = [
  { id: '1', label: 'Code P0234' },
  { id: '2', label: 'Test Électrovanne' },
  { id: '3', label: 'Mesure en cours' },
]

export function DiagTimeline({ activeIndex = 2 }: { activeIndex?: number }) {
  return (
    <nav aria-label="Progression du diagnostic">
      <ol className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1">
              <div
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 ring-1 transition-colors',
                  done && 'bg-signal/10 ring-signal/30',
                  active && 'bg-primary/15 ring-primary/50',
                  !done && !active && 'bg-secondary/40 ring-glass-border',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold',
                    done && 'bg-signal text-signal-foreground',
                    active && 'bg-primary text-primary-foreground',
                    !done && !active && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap font-mono text-xs',
                    active
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {active && (
                  <span className="size-1.5 rounded-full bg-primary animate-pulse-signal" />
                )}
              </div>
              {i < steps.length - 1 && (
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
