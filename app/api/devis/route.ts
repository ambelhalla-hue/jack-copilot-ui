import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé GEMINI_API_KEY non configurée dans Vercel." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const SYSTEM_PROMPT = `Tu es un chef d'atelier automobile expert en chiffrage constructeur.
Ton rôle est de générer un devis technique complet, conforme aux préconisations constructeur, sans rien oublier.

Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (aucun texte avant ou après) respectant exactement cette structure :
{
  "intervention": "Nom précis de l'opération",
  "pieces_principales": [
    { "designation": "Nom précis de la pièce", "ref_constructeur": "Réf ou standard", "quantite": 1, "type": "Origine ou Échange standard" }
  ],
  "peripheriques_et_fluides": [
    { "designation": "Nom précis (joints, vis neuves, fluides normés)", "ref_constructeur": "Spécification ou norme constructeur", "quantite": 1 }
  ],
  "main_d_oeuvre": [
    { "operation": "Libellé de l'opération barémée", "heures": 0.0 }
  ],
  "temps_total_bareme": 0.0,
  "restitution_estimee": "Délai ou heure estimée (ex: 18h00 ou +4h)",
  "justification_client": "Courte explication vulgarisée pour rassurer le client sur la nécessité des pièces d'usure et périphériques."
}`

    const userPrompt = `Véhicule : ${vehicle || "Non spécifié"} (Immatriculation : ${immat || "N/A"}, Kilométrage : ${kilometrage || "N/A"} km)
Constats / Travaux à chiffrer : ${panne_constatee || "Remplacement embrayage et boîte de vitesses"}
Précisions complémentaires : ${options_travaux || "Nomenclature complète requise"}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      }
    )

    const data = await response.json()
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const devisStructure = JSON.parse(rawJson)

    return NextResponse.json({ devis: devisStructure })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération du devis structuré." },
      { status: 500 }
    )
  }
}
