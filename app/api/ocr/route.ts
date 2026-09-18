import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API Gemini introuvable." }, { status: 500 })
    }

    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "Aucune image transmise." }, { status: 400 })
    }

    // Nettoyage de la chaîne base64 (suppression du préfixe data:image/...)
    const cleanBase64 = image.includes(",") ? image.split(",")[1] : image

    const prompt = `Analyse cette image de véhicule ou de carte grise.
Tâche :
1. Repère la plaque d'immatriculation française (SIV au format AA-123-BB ou ancien format 1234 AB 76).
2. Si visible, identifie la marque et le modèle du véhicule.

Réponds STRICTEMENT sous ce format JSON valide, sans texte additionnel ni markdown :
{
  "immatriculation": "AA-123-BB",
  "modele_detecte": "Marque Modèle Détecté"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json"
          }
        })
      }
    )

    const data = await response.json()
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur analyse vision" }, { status: 500 })
    }

    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const parsed = JSON.parse(rawJson)

    // Formatage en majuscules sans espaces parasites
    const cleanPlate = parsed.immatriculation ? parsed.immatriculation.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase() : ""

    return NextResponse.json({
      immatriculation: cleanPlate,
      modele_detecte: parsed.modele_detecte || null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur interne du serveur OCR." }, { status: 500 })
  }
}
