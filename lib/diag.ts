export type VehicleInfo = {
  plate: string
  make: string
  model: string
  engine: string
  dtc: string
  symptoms: string
  mileage: string
  vin: string
}

export type DiagRole = 'jack' | 'tech'

export type DiagTurn = {
  id: string
  role: DiagRole
  content: string
}

export const emptyVehicle: VehicleInfo = {
  plate: '',
  make: '',
  model: '',
  engine: '',
  dtc: '',
  symptoms: '',
  mileage: '',
  vin: '',
}

/** Formate une saisie libre en plaque SIV française : AA-123-BB */
export function formatPlate(value: string) {
  const raw = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7)

  return [raw.slice(0, 2), raw.slice(2, 5), raw.slice(5, 7)]
    .filter(Boolean)
    .join('-')
}

export function isValidPlate(plate: string) {
  return /^[A-Z]{2}-\d{3}-[A-Z]{2}$/.test(plate)
}

type FleetEntry = Pick<
  VehicleInfo,
  'make' | 'model' | 'engine' | 'mileage' | 'vin'
>

/** Parc atelier simulé : tient lieu de retour "carte grise" le temps de la démo. */
const fleet: Record<string, FleetEntry> = {
  'AA-123-BB': {
    make: 'Peugeot',
    model: '3008 II',
    engine: '1.5 BlueHDi 130 · DV5RC',
    mileage: '142 380',
    vin: 'VF3MRHNYWKS0HK8291',
  },
  'CV-456-QT': {
    make: 'Renault',
    model: 'Clio IV Phase 2',
    engine: '1.5 dCi 90 · K9K 628',
    mileage: '198 040',
    vin: 'VF15RJL0H55VF71182',
  },
  'EG-789-ZR': {
    make: 'Volkswagen',
    model: 'Golf VII',
    engine: '2.0 TDI 150 · CRBC',
    mileage: '211 560',
    vin: 'WVWZZZAUZHWVW4471',
  },
}

export function lookupPlate(plate: string): FleetEntry | null {
  return fleet[plate] ?? null
}

export const knownPlates = Object.keys(fleet)

export function vehicleReady(v: VehicleInfo) {
  return (
    isValidPlate(v.plate) &&
    v.make.trim().length > 1 &&
    v.model.trim().length > 0 &&
    v.engine.trim().length > 1 &&
    v.dtc.trim().length > 2
  )
}

export function shortVin(vin: string) {
  return vin ? `…${vin.slice(-7)}` : '—'
}
