import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getAllDossiers() {
  const { data, error } = await supabase
    .from("dossiers_atelier")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Erreur getAllDossiers:", error)
    return []
  }
  return data || []
}

export async function updateDossierStatusAndData(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("dossiers_atelier")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Erreur updateDossierStatusAndData:", error)
    throw error
  }
  return data
}
