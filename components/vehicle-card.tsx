import { Car, Gauge, Fingerprint } from 'lucide-react'

export function VehicleCard() {
  return (
    <section
      aria-label="Véhicule en cours de diagnostic"
      className="glass relative overflow-hidden rounded-2xl p-4 md:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-primary/12 to-transparent"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-glass-border">
            <Car className="size-6 text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center overflow-hidden rounded-md ring-1 ring-glass-border">
              <span className="bg-primary px-1.5 py-1 font-mono text-[10px] font-bold text-primary-foreground">
                F
              </span>
              <span className="bg-foreground/95 px-3 py-1 font-mono text-base font-bold tracking-[0.18em] text-background">
                AA-123-BB
              </span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-pretty md:text-lg">
                Peugeot 3008 II
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                1.5 BlueHDi 130 · DV5RC
              </p>
            </div>
          </div>
        </div>

        <dl className="flex gap-2">
          <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 ring-1 ring-glass-border">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Gauge className="size-3" aria-hidden="true" />
              Km
            </dt>
            <dd className="font-mono text-sm font-semibold">142 380</dd>
          </div>
          <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 ring-1 ring-glass-border">
            <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Fingerprint className="size-3" aria-hidden="true" />
              VIN
            </dt>
            <dd className="font-mono text-sm font-semibold">…HK8291</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
