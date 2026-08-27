import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY non configurée." }, { status: 500 })
    }

    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "Aucune image fournie." }, { status: 400 })
    }

    const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg"

    const SYSTEM_PROMPT = `Tu es un expert en lecture automatique de plaques d'immatriculation et documents automobiles (OCR).
Analyse l'image fournie et extrais UNIQUEMENT l'immatriculation du véhicule au format standard (ex: AA-123-BB ou 1234 AB 76) ainsi que la marque et le modèle si visibles.

Réponds STRICTEMENT avec un objet JSON valide :
{
  "immatriculation": "AA-123-BB",
  "modele_detecte": "Peugeot 308"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
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
    const result = JSON.parse(rawJson)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur lors de l'analyse OCR." }, { status: 500 })
  }
}
