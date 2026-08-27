const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function insertDossierAtelier(data: {
  immatriculation: string
  vin?: string
  kilometrage: number
  statut?: string
  photos_tour_vehicule?: string[]
  constats_technicien?: string
}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variables Supabase non configurées sur Vercel.")
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || `Erreur Supabase HTTP ${res.status}`)
  }

  return await res.json()
}
