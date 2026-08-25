import 'server-only'

import type { VehicleInfo } from '@/lib/diag'

/**
 * Sauvegarde d'un tour de diagnostic dans la table Supabase `diagnostics`.
 *
 * Table attendue :
 *   create table diagnostics (
 *     id uuid primary key default gen_random_uuid(),
 *     plate text not null,
 *     make text,
 *     model text,
 *     engine text,
 *     dtc text,
 *     symptoms text,
 *     feedback text,
 *     answer text,
 *     created_at timestamptz default now()
 *   );
 *
 * L'écriture est best-effort : si le projet Supabase n'est pas encore relié
 * (URL absente), le diagnostic continue de fonctionner sans persistance.
 */
export type DiagnosticRecord = {
  vehicle: VehicleInfo
  feedback: string | null
  answer: string
}

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function historyEnabled() {
  return Boolean(supabaseUrl && supabaseKey)
}

export async function saveDiagnostic({
  vehicle,
  feedback,
  answer,
}: DiagnosticRecord) {
  if (!supabaseUrl || !supabaseKey) {
    console.log(
      '[v0] Supabase non relié : historique de diagnostic non sauvegardé.',
    )
    return { saved: false as const }
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/diagnostics`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: supabaseKey,
        authorization: `Bearer ${supabaseKey}`,
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        plate: vehicle.plate,
        make: vehicle.make,
        model: vehicle.model,
        engine: vehicle.engine,
        dtc: vehicle.dtc,
        symptoms: vehicle.symptoms,
        feedback,
        answer,
      }),
    })

    if (!res.ok) {
      console.log(
        '[v0] Écriture Supabase refusée:',
        res.status,
        await res.text(),
      )
      return { saved: false as const }
    }

    return { saved: true as const }
  } catch (error) {
    console.log('[v0] Écriture Supabase impossible:', error)
    return { saved: false as const }
  }
}
