'use client'

import { useId, useState } from 'react'
import {
  Car,
  CircleCheck,
  Fingerprint,
  Gauge,
  Pencil,
  ScanLine,
  TriangleAlert,
} from 'lucide-react'

import {
  emptyVehicle,
  formatPlate,
  isValidPlate,
  knownPlates,
  lookupPlate,
  shortVin,
  vehicleReady,
  type VehicleInfo,
} from '@/lib/diag'
import { cn } from '@/lib/utils'

const fieldClass =
  'w-full rounded-xl bg-background/70 px-3 py-2.5 font-mono text-sm text-foreground ring-1 ring-inset ring-glass-border transition-colors placeholder:text-muted-foreground/60 focus:bg-background focus:ring-primary/60 focus-visible:outline-none'

const labelClass =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

function PlateBadge({ plate }: { plate: string }) {
  return (
    <div className="inline-flex w-fit items-center overflow-hidden rounded-md ring-1 ring-glass-border">
      <span className="bg-primary px-1.5 py-1 font-mono text-[10px] font-bold text-primary-foreground">
        F
      </span>
      <span className="bg-foreground/95 px-3 py-1 font-mono text-base font-bold tracking-[0.18em] text-background">
        {plate}
      </span>
    </div>
  )
}

export function VehicleCard({
  vehicle,
  locked,
  busy,
  onSubmit,
  onReset,
}: {
  vehicle: VehicleInfo
  locked: boolean
  busy: boolean
  onSubmit: (vehicle: VehicleInfo) => void
  onReset: () => void
}) {
  const uid = useId()
  const [draft, setDraft] = useState<VehicleInfo>(
    vehicle.plate ? vehicle : emptyVehicle,
  )
  const [identified, setIdentified] = useState(false)
  const [touched, setTouched] = useState(false)

  const plateInvalid = touched && draft.plate.length > 0 && !isValidPlate(draft.plate)
  const canSubmit = vehicleReady(draft) && !busy

  function set<K extends keyof VehicleInfo>(key: K, value: VehicleInfo[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handlePlate(value: string) {
    const plate = formatPlate(value)
    const found = isValidPlate(plate) ? lookupPlate(plate) : null

    setIdentified(Boolean(found))
    setDraft((prev) => ({
      ...prev,
      plate,
      ...(found
        ? {
            make: found.make,
            model: found.model,
            engine: found.engine,
            mileage: found.mileage,
            vin: found.vin,
          }
        : {}),
    }))
  }

  if (locked) {
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
              <PlateBadge plate={vehicle.plate} />
              <div>
                <p className="text-base font-semibold tracking-tight text-pretty md:text-lg">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {vehicle.engine} · DTC {vehicle.dtc}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <dl className="flex flex-1 gap-2">
              <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 ring-1 ring-glass-border">
                <dt className={cn(labelClass, 'flex items-center gap-1.5')}>
                  <Gauge className="size-3" aria-hidden="true" />
                  Km
                </dt>
                <dd className="font-mono text-sm font-semibold">
                  {vehicle.mileage || '—'}
                </dd>
              </div>
              <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 ring-1 ring-glass-border">
                <dt className={cn(labelClass, 'flex items-center gap-1.5')}>
                  <Fingerprint className="size-3" aria-hidden="true" />
                  VIN
                </dt>
                <dd className="font-mono text-sm font-semibold">
                  {shortVin(vehicle.vin)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={onReset}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground ring-1 ring-glass-border transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span className="sr-only">Modifier la fiche véhicule</span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form
      aria-label="Fiche véhicule"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (canSubmit) onSubmit(draft)
      }}
      className="glass relative overflow-hidden rounded-2xl p-4 md:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-primary/12 to-transparent"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-glass-border">
            <ScanLine className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight md:text-lg">
              Ouvrir un ordre de réparation
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Saisis la plaque, complète si le parc ne la connaît pas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-plate`} className={labelClass}>
            Immatriculation
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                'flex items-center overflow-hidden rounded-md ring-1 transition-colors',
                plateInvalid ? 'ring-alert/60' : 'ring-glass-border',
              )}
            >
              <span className="bg-primary px-2 py-2.5 font-mono text-xs font-bold text-primary-foreground">
                F
              </span>
              <input
                id={`${uid}-plate`}
                value={draft.plate}
                onChange={(event) => handlePlate(event.target.value)}
                onBlur={() => setTouched(true)}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="AA-123-BB"
                aria-invalid={plateInvalid}
                aria-describedby={`${uid}-plate-help`}
                className="w-44 bg-foreground/95 px-3 py-2 font-mono text-lg font-bold uppercase tracking-[0.16em] text-background placeholder:text-background/40 focus-visible:outline-none"
              />
            </div>

            {identified && (
              <span className="flex items-center gap-1.5 rounded-full bg-signal/12 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-signal">
                <CircleCheck className="size-3" aria-hidden="true" />
                Véhicule identifié
              </span>
            )}
            {plateInvalid && (
              <span className="flex items-center gap-1.5 rounded-full bg-alert/12 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-alert">
                <TriangleAlert className="size-3" aria-hidden="true" />
                Format AA-123-BB
              </span>
            )}
          </div>
          <p
            id={`${uid}-plate-help`}
            className="font-mono text-[11px] text-muted-foreground"
          >
            Parc connu : {knownPlates.join(' · ')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-make`} className={labelClass}>
              Marque
            </label>
            <input
              id={`${uid}-make`}
              value={draft.make}
              onChange={(event) => set('make', event.target.value)}
              placeholder="Peugeot"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-model`} className={labelClass}>
              Modèle
            </label>
            <input
              id={`${uid}-model`}
              value={draft.model}
              onChange={(event) => set('model', event.target.value)}
              placeholder="3008 II"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-engine`} className={labelClass}>
              Moteur
            </label>
            <input
              id={`${uid}-engine`}
              value={draft.engine}
              onChange={(event) => set('engine', event.target.value)}
              placeholder="1.5 BlueHDi 130 · DV5RC"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-dtc`} className={labelClass}>
              Code DTC
            </label>
            <input
              id={`${uid}-dtc`}
              value={draft.dtc}
              onChange={(event) => set('dtc', event.target.value.toUpperCase())}
              placeholder="P0234"
              className={cn(fieldClass, 'uppercase tracking-widest')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-symptoms`} className={labelClass}>
            Symptômes constatés
          </label>
          <textarea
            id={`${uid}-symptoms`}
            value={draft.symptoms}
            onChange={(event) => set('symptoms', event.target.value)}
            rows={2}
            placeholder="Perte de puissance à chaud au-dessus de 2500 tr/min, mode dégradé après 5 km"
            className={cn(fieldClass, 'resize-none font-sans text-[15px]')}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <ScanLine className="size-5" aria-hidden="true" />
          {busy ? 'Jack analyse le cas…' : 'Lancer le diagnostic'}
        </button>
      </div>
    </form>
  )
}
