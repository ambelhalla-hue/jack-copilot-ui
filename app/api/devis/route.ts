import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const SYSTEM_PROMPT = `Tu es un expert chiffrage et méthode après-vente automobile.
Tu reçois le constat mécanique d'un véhicule et l'état des contrôles de sécurité.
Tu DOIS obligatoirement générer la nomenclature complète sous forme d'un objet JSON STRICT (sans texte autour, sans markdown).

Format JSON attendu :
{
  "pieces_principales": [
    { "id": "1", "designation": "Nom exact de la pièce", "ref": "Référence OE / Adaptable", "quantite": 1 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Consommable / Joint / Visserie / Fluide requis", "ref": "Norme constructeur", "quantite": 1 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Intitulé barème constructeur", "heures": 1.5 }
  ]
}`

    const userPrompt = `Véhicule: ${vehicle} (${immat}), Kilométrage: ${kilometrage} km
Panne et travaux constatés: ${panne_constatee}
Points de contrôle sécurité: ${options_travaux}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    )

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const devisJson = JSON.parse(rawText)

    return NextResponse.json({ devis: devisJson })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur lors de la génération du devis." }, { status: 500 })
  }
}
