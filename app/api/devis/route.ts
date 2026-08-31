import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY manquante." }, { status: 500 })
    }

    const body = await req.json()
    const { dossierId, vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const userPrompt = `Tu es un chiffreur expert après-vente automobile.
Génère la nomenclature DÉTAILLÉE et COMPLÈTE en JSON STRICT (sans markdown, sans texte autour) pour :
Véhicule : ${vehicle || "Véhicule Atelier"} (${immat || "N/A"}) - Kilométrage : ${kilometrage || "100000"} km
Constats mécaniques : ${panne_constatee || "Remplacement pièces"}
Contrôles atelier signalés : ${options_travaux || "Non spécifié"}

EXIGENCES ABSOLUES DU DEVIS :
1. EXHAUSTIVITÉ TOTALE : Tu DOIS créer une ligne distincte dans "pieces_principales" pour la panne mécanique ET pour CHAQUE organe noté urgent ou à prévoir (ex: "Batterie 12V", "Jeu de plaquettes de frein avant", "Pneumatiques avant (x2)").
2. RÈGLE FREINAGE : Si les disques sont à changer, inclus obligatoirement les disques ET les plaquettes neuves associées.
3. PÉRIPHÉRIQUES : Ajoute dans "peripheriques" tous les fluides, kits visserie, nettoyants ou consommables nécessaires.
4. MAIN-D'ŒUVRE : Détaille chaque barème d'opération dans "main_oeuvre" avec l'intitulé clair (ex: "Remplacement batterie 12V", "Remplacement disques et plaquettes avant").

Format JSON STRICT attendu :
{
  "constat_court": "À remplacer : Batterie 12V + Plaquettes AV",
  "pieces_principales": [
    { "id": "1", "designation": "Batterie 12V conforme constructeur", "ref": "BAT-12V", "quantite": 1 },
    { "id": "2", "designation": "Jeu de plaquettes de frein avant", "ref": "16 172 834 80", "quantite": 1 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Fournitures atelier & nettoyant dégraissant", "ref": "CONS-01", "quantite": 1 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Contrôle circuit de charge et remplacement batterie", "heures": 0.5 },
    { "id": "2", "operation": "Remplacement plaquettes de frein avant", "heures": 0.8 }
  ]
}`

    let devis: any = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        }
      )

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText) devis = JSON.parse(rawText)
    } catch (e) {
      console.error("Erreur parsing IA", e)
    }

    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        constat_court: panne_constatee || "Remplacement pièces préconisées",
        pieces_principales: [
          { id: "1", designation: panne_constatee || "Organe principal de rechange", ref: "OEM-STD", quantite: 1 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures atelier & consommables", ref: "CONS-01", quantite: 1 }
        ],
        main_oeuvre: [
          { id: "1", operation: `Intervention : ${panne_constatee || "Atelier"}`, heures: 1.0 }
        ]
      }
    }

    const constatFinal = devis.constat_court || panne_constatee

    // Écriture directe côté serveur dans Supabase
    if (supabaseUrl && supabaseAnonKey && dossierId) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${dossierId}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            statut: "devis_genere",
            constats_technicien: constatFinal,
            devis_ia: devis,
            updated_at: new Date().toISOString()
          })
        })
      } catch (err) {
        console.error("Erreur mise à jour Supabase :", err)
      }
    }

    return NextResponse.json({
      constat_court: constatFinal,
      devis
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur calcul devis." }, { status: 500 })
  }
}
