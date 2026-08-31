export interface DossierAtelier {
  id: string
  immatriculation: string
  vin?: string
  kilometrage: number
  statut: 'reception' | 'diagnostic' | 'devis_genere' | 'valide_client' | 'en_cours' | 'termine' | 'facturation'
  photos_tour_vehicule: string[]
  constats_technicien?: string
  devis_ia?: Record<string, any>
  montant_total_ht?: number
  montant_tva?: number
  montant_ttc?: number
  created_at: string
  updated_at: string
}

export interface InsertDossierInput {
  immatriculation: string
  vin?: string
  kilometrage: number
  statut?: DossierAtelier['statut']
  photos_tour_vehicule?: string[]
  constats_technicien?: string
}

export interface UpdateDossierInput {
  statut?: DossierAtelier['statut']
  constats_technicien?: string
  devis_ia?: Record<string, any>
  montant_total_ht?: number
  montant_tva?: number
  montant_ttc?: number
  photos_tour_vehicule?: string[]
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseUrl = rawUrl.replace(/\/+$/, "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function validateSupabaseConfig(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variables Supabase non configurées (NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY).")
  }
}

async function executeSupabaseRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, any>,
  options?: { cache?: string; prefer?: string }
): Promise<T> {
  validateSupabaseConfig()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "apikey": supabaseAnonKey,
    "Authorization": `Bearer ${supabaseAnonKey}`
  }

  if (options?.prefer) {
    headers["Prefer"] = options.prefer
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: (options?.cache as any) || "no-store"
  }

  if (body && (method === "POST" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(body)
  }

  const res = await fetch(`${supabaseUrl}${endpoint}`, fetchOptions)

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(`Erreur Supabase: ${errData.message || `HTTP ${res.status}`}`)
  }

  return await res.json()
}

export async function insertDossierAtelier(data: InsertDossierInput): Promise<DossierAtelier> {
  return executeSupabaseRequest<DossierAtelier>(
    "/rest/v1/dossiers_atelier",
    "POST",
    data,
    { prefer: "return=representation" }
  )
}

export async function getAllDossiers(): Promise<DossierAtelier[]> {
  return executeSupabaseRequest<DossierAtelier[]>(
    "/rest/v1/dossiers_atelier?select=*&order=created_at.desc&limit=50",
    "GET"
  )
}

export async function getDossierById(id: string): Promise<DossierAtelier | null> {
  try {
    const results = await executeSupabaseRequest<DossierAtelier[]>(
      `/rest/v1/dossiers_atelier?id=eq.${encodeURIComponent(id)}&select=*`,
      "GET"
    )
    return results && results.length > 0 ? results[0] : null
  } catch (err) {
    console.error(`Erreur lors de la récupération du dossier ${id}:`, err)
    return null
  }
}

export async function updateDossierStatusAndData(
  id: string,
  updateData: UpdateDossierInput
): Promise<DossierAtelier> {
  const payload = {
    ...updateData,
    updated_at: new Date().toISOString()
  }

  const results = await executeSupabaseRequest<DossierAtelier[]>(
    `/rest/v1/dossiers_atelier?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    payload,
    { prefer: "return=representation" }
  )

  if (!results || results.length === 0) {
    throw new Error(`Dossier ${id} non trouvé après mise à jour`)
  }

  return results[0]
}

export async function updateDossierPartial(
  id: string,
  updateData: UpdateDossierInput
): Promise<boolean> {
  try {
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    await executeSupabaseRequest(
      `/rest/v1/dossiers_atelier?id=eq.${encodeURIComponent(id)}`,
      "PATCH",
      payload,
      { prefer: "return=minimal" }
    )

    return true
  } catch (err) {
    console.error(`Erreur lors de la mise à jour du dossier ${id}:`, err)
    return false
  }
}

export async function getDossiersByStatus(status: DossierAtelier['statut']): Promise<DossierAtelier[]> {
  return executeSupabaseRequest<DossierAtelier[]>(
    `/rest/v1/dossiers_atelier?statut=eq.${encodeURIComponent(status)}&order=created_at.desc&limit=50`,
    "GET"
  )
}

export async function getDossiersByPlate(immatriculation: string): Promise<DossierAtelier[]> {
  return executeSupabaseRequest<DossierAtelier[]>(
    `/rest/v1/dossiers_atelier?immatriculation=eq.${encodeURIComponent(immatriculation)}&order=created_at.desc&limit=10`,
    "GET"
  )
}
