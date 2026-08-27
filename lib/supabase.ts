const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseUrl = rawUrl.replace(/\/+$/, "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function insertDossierAtelier(data: {
  immatriculation: string
  vin?: string
  kilometrage: number
  statut?: string
  photos_tour_vehicule?: string[]
  constats_technicien?: string
}) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Variables Supabase non configurées.")

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

export async function getAllDossiers() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Variables Supabase non configurées.")

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?select=*&order=created_at.desc&limit=20`, {
    method: "GET",
    headers: {
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store"
  })

  if (!res.ok) throw new Error(`Erreur Supabase HTTP ${res.status}`)
  return await res.json()
}

export async function getDossierById(id: string) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Variables Supabase non configurées.")

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${id}&select=*`, {
    method: "GET",
    headers: {
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store"
  })

  if (!res.ok) throw new Error(`Erreur Supabase HTTP ${res.status}`)
  const data = await res.json()
  return data && data.length > 0 ? data[0] : null
}

export async function updateDossierStatusAndData(id: string, updateData: any) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Variables Supabase non configurées.")

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      ...updateData,
      updated_at: new Date().toISOString()
    })
  })

  if (!res.ok) throw new Error(`Erreur mise à jour Supabase HTTP ${res.status}`)
  return await res.json()
}
