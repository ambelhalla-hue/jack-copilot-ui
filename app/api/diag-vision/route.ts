import { NextResponse } from "next/server"

export const maxDuration = 30

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

    const systemInstruction = `Tu es Jack, Chef d'Atelier expert. Tu analyses une photo d'écran de valise de diagnostic OBD (Diagbox, Launch, Autel), de tableau de bord ou de composant.

MISSION :
1. Extrais TOUS les codes défauts (DTC) visibles et leurs libellés.
2. Si plusieurs DTC sont présents, fais le TRI PAR CAUSE COMMUNE (masse, alim 5V, fusible, réseau CAN, faisceau frotté). Isole la panne racine.
3. Rédige une réponse radicalement concise selon ce format strict :

CODES DÉTECTÉS : [Liste des codes extraits séparés par des virgules, ex: P0234, P0100]
SYNTHÈSE : [1 phrase résumant l'élément commun]
CAUSES :
- P1 : [Cause racine prioritaire]
- P2 : [Cause secondaire]
TEST : [Action de mesure physique unique et précise]
ATTENDU : [Valeur seuil / signal cible]`

    const promptText = `Véhicule : ${vehicleContext || "Non spécifié"}
Notes : ${userNotes || "Analyse requise"}
Analyse cette capture d'écran et effectue le tri des défauts multiples.`

    // APPEL MODÈLE OFFICIEL REQUIS PAR GOOGLE : gemini-3.6-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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
            maxOutputTokens: 300,
            temperature: 0.1
          }
        })
      }
    )

    const data = await response.json()
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur de l'API Google." }, { status: 500 })
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic impossible."
    return NextResponse.json({ result: resultText })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
