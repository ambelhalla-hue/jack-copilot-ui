import { createClient } from "@supabase/supabase-js"

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseUrl = rawUrl.replace(/\/+$/, "")
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

/**
 * Insère un nouveau dossier en lui attribuant automatiquement le user_id connecté
 */
export async function insertDossierAtelier(data: {
  immatriculation: string
  vin?: string
  kilometrage: number
  statut?: string
  photos_tour_vehicule?: string[]
  constats_technicien?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...data,
    user_id: user?.id || null,
    statut: data.statut || "en_diagnostic",
    updated_at: new Date().toISOString()
  }

  const { data: inserted, error } = await supabase
    .from("dossiers_atelier")
    .insert([payload])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return inserted
}

/**
 * Récupère les dossiers de l'utilisateur connecté selon le statut demandé
 */
export async function getDossiersByStatut(type: "en_cours" | "archives") {
  let query = supabase
    .from("dossiers_atelier")
    .select("*")
    .order("created_at", { ascending: false })

  if (type === "en_cours") {
    query = query.neq("statut", "termine").neq("statut", "cloture")
  } else {
    query = query.in("statut", ["termine", "cloture"])
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur récupération dossiers:", error.message)
    return []
  }

  return data || []
}

/**
 * Récupère un dossier spécifique par son ID (sécurisé par RLS)
 */
export async function getDossierById(id: string) {
  const { data, error } = await supabase
    .from("dossiers_atelier")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erreur récupération dossier par ID:", error.message)
    return null
  }

  return data
}

/**
 * Met à jour un dossier existant
 */
export async function updateDossierStatusAndData(id: string, updates: Partial<DossierAtelier>) {
  const { data, error } = await supabase
    .from("dossiers_atelier")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
