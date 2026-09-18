const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function getHeaders(extraHeaders: Record<string, string> = {}) {
  return {
    "apikey": supabaseAnonKey,
    "Authorization": `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...extraHeaders
  }
}

// 1. Insertion d'un dossier depuis la réception CCS
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
    headers: getHeaders({ "Prefer": "return=representation" }),
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || `Erreur Supabase HTTP ${res.status}`)
  }

  return await res.json()
}

// 2. Récupération de tous les dossiers pour Tech, Chef et Client
export async function getAllDossiers() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Variables Supabase non configurées.")
    return []
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?select=*&order=created_at.desc`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store"
    })

    if (!res.ok) {
      console.error("Erreur HTTP getAllDossiers", res.status)
      return []
    }

    return await res.json()
  } catch (err) {
    console.error("Erreur getAllDossiers:", err)
    return []
  }
}

// 3. Mise à jour d'un dossier pour le Chef ou le Client
export async function updateDossierStatusAndData(id: string, updates: Record<string, any>) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variables Supabase non configurées.")
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${id}`, {
    method: "PATCH",
    headers: getHeaders({ "Prefer": "return=representation" }),
    body: JSON.stringify({
      ...updates,
      updated_at: new Date().toISOString()
    })
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || `Erreur Supabase PATCH HTTP ${res.status}`)
  }

  return await res.json()
}
// Sauvegarde incrémentale de l'historique du chat Jack
export async function saveDossierChatHistory(id: string, messages: { role: string; content: string }[]) {
  return await updateDossierStatusAndData(id, {
    chat_history: messages
  })
}

// Ajout d'une intervention complémentaire post-transmission sans recréer de dossier
export async function appendConstatToDossier(id: string, nouveauConstat: string) {
  const current = await getDossierById(id)
  if (!current) throw new Error("Dossier introuvable.")

  const updatedConstats = current.constats_technicien 
    ? `${current.constats_technicien} | [Avenant] ${nouveauConstat}`
    : nouveauConstat

  return await updateDossierStatusAndData(id, {
    constats_technicien: updatedConstats,
    statut: "devis_a_revalider"
  })
}
