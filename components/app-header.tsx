import { Wrench, ChevronDown } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 md:h-18">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
            <Wrench className="size-5 text-primary" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-signal animate-pulse-signal" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight md:text-lg">
              Jack Copilot
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Diag assisté
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="hidden text-sm sm:block">
            <span className="block font-medium leading-tight">Karim B.</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              Garage 3000
            </span>
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold ring-1 ring-glass-border">
            KB
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Ouvrir le menu du profil utilisateur</span>
        </button>
      </div>
    </header>
  )
}
