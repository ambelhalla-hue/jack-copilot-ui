const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseUrl = rawUrl.replace(/\/+$/, "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function getHeaders(extraHeaders: Record<string, string> = {}) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...extraHeaders
  }
}

export interface DossierAtelier {
  id?: string
  user_id?: string
  immatriculation: string
  vin?: string
  kilometrage: number
  statut?: string
  photos_tour_vehicule?: string[]
  constats_technicien?: string
  chat_history?: any[]
  devis_ia?: any
  created_at?: string
  updated_at?: string
}

// Client HTTP simulé pour app/auth et sessions locales
export const supabase = {
  auth: {
    getUser: async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("jack_session_user")
        if (stored) {
          try {
            return { data: { user: JSON.parse(stored) }, error: null }
          } catch {
            return { data: { user: null }, error: null }
          }
        }
      }
      return { data: { user: { id: "mecano-default", email: "atelier@jack.fr" } }, error: null }
    },
    signInWithPassword: async ({ email }: { email: string; password?: string }) => {
      const user = { id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`, email }
      if (typeof window !== "undefined") {
        localStorage.setItem("jack_session_user", JSON.stringify(user))
      }
      return { data: { user }, error: null }
    },
    signUp: async ({ email }: { email: string; password?: string }) => {
      const user = { id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`, email }
      if (typeof window !== "undefined") {
        localStorage.setItem("jack_session_user", JSON.stringify(user))
      }
      return { data: { user }, error: null }
    },
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("jack_session_user")
      }
      return { error: null }
    }
  }
}

// 1. Insertion nouveau dossier (CCS)
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

  const payload = {
    ...data,
    statut: data.statut || "en_diagnostic",
    updated_at: new Date().toISOString()
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier`, {
    method: "POST",
    headers: getHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Erreur Supabase ${res.status}`)
  }

  const list = await res.json()
  return Array.isArray(list) ? list[0] : list
}

// 2. Récupération filtrée pour le Dashboard (En cours vs Archives)
export async function getDossiersByStatut(type: "en_cours" | "archives") {
  if (!supabaseUrl || !supabaseAnonKey) return []

  try {
    let filter = "statut=neq.termine&statut=neq.cloture"
    if (type === "archives") {
      filter = "statut=in.(termine,cloture)"
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?${filter}&order=created_at.desc`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (err) {
    console.error("Erreur getDossiersByStatut:", err)
    return []
  }
}

// 3. Récupération globale pour les anciennes pages (Chef, etc.)
export async function getAllDossiers() {
  if (!supabaseUrl || !supabaseAnonKey) return []

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?select=*&order=created_at.desc`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store"
    })

    if (!res.ok) return []
    return await res.json()
  } catch (err) {
    console.error("Erreur getAllDossiers:", err)
    return []
  }
}

// 4. Récupération d'un dossier par ID
export async function getDossierById(id: string) {
  if (!supabaseUrl || !supabaseAnonKey || !id) return null

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${id}&select=*`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store"
    })

    if (!res.ok) return null
    const list = await res.json()
    return Array.isArray(list) && list.length > 0 ? list[0] : null
  } catch (err) {
    console.error("Erreur getDossierById:", err)
    return null
  }
}

// 5. Mise à jour générique d'un dossier
export async function updateDossierStatusAndData(id: string, updates: Record<string, any>) {
  if (!supabaseUrl || !supabaseAnonKey || !id) {
    throw new Error("Identifiant ou variables Supabase manquants.")
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${id}`, {
    method: "PATCH",
    headers: getHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      ...updates,
      updated_at: new Date().toISOString()
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Erreur PATCH ${res.status}`)
  }

  const list = await res.json()
  return Array.isArray(list) ? list[0] : list
}

// 6. Sauvegarde spécifique de l'historique chat (pour anciennes pages)
export async function saveDossierChatHistory(id: string, chatHistory: any[]) {
  return updateDossierStatusAndData(id, { chat_history: chatHistory })
}
