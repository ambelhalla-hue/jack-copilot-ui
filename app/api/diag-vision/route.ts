import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY non configurée dans Vercel." }, { status: 500 })
    }

    const body = await req.json()
    const { imageBase64, mimeType, vehicleContext, userNotes } = body

    if (!imageBase64) {
      return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 })
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64

    const systemInstruction = `Tu es Jack, Chef d'Atelier expert. Analyse l'image (valise OBD, voyant, pièce défectueuse).
Style télégraphique d'atelier :
CAUSES :
- P1 : [Cause 1]
- P2 : [Cause 2]
TEST : [Action de mesure unique et précise]
ATTENDU : [Valeur seuil / signal cible]`

    const promptText = `Véhicule : ${vehicleContext || "Non spécifié"}
Notes : ${userNotes || "Analyse requise"}
Donne le diagnostic direct.`

    // Appel à Gemini avec fallback sur 2.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [
            {
              role: "user",
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.1
          }
        })
      }
    )

    const data = await response.json()
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur renvoyée par Google API." }, { status: 500 })
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Aucun résultat exploitable."
    return NextResponse.json({ result: resultText })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur interne du serveur." }, { status: 500 })
  }
}
