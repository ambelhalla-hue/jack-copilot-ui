import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY non configurée." }, { status: 500 })
    }

    const body = await req.json()
    const { imageBase64, mimeType, vehicleContext, userNotes } = body

    if (!imageBase64) {
      return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 })
    }

    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64

    const systemInstruction = `Tu es Jack, Chef d'Atelier expert avec 20 ans de métier.
Tu analyses une photo transmise par un mécanicien sous le pont.
La photo peut être :
- Une pièce mécanique défectueuse (fuite d'huile/LDR, fissure, courroie craquelée, disque/plaquette usé, jeu, rouille).
- L'écran d'une valise de diagnostic (Diagbox, KDS Kia, Launch, Autel) ou du combiné d'instruments.

DIRECTIVES D'ATELIER :
1. Si c'est une pièce ou un organe mécanique usé / qui fuit :
   - Identifie immédiatement l'organe précis et la nature du problème (usure prononcée, fuite joint spi/raccord, craquelure).
   - Valide le composant HS sans protocole inutile.
   - Indique la conséquence directe et les périphériques obligatoires à remplacer (joints, vis, fluide).
   - Structure ta réponse :
     ORGANES IDENTIFIÉS : [Nom précis de la pièce]
     ANOMALIE CONSTATÉE : [Ce qui est visible sur la photo]
     CONCLUSION : [Pièce à remplacer / intervention requise]
     À PRÉVOIR : [Fournitures et joints associés]

2. Si c'est un écran de valise (DTC) :
   - Extrais tous les codes défauts visibles (ex: P0234, P0100).
   - Fais le tri par cause racine commune (masse, ligne 5V, fusible, réseau CAN).
   - Structure ta réponse :
     CODES DÉTECTÉS : [Liste des codes]
     SYNTHÈSE : [Cause racine commune]
     TEST : [Action de mesure physique unique]
     ATTENDU : [Valeur seuil]`

    const promptText = `Véhicule : ${vehicleContext || "Véhicule atelier"}
Notes mécano : ${userNotes || "Analyse visuelle demandée"}
Analyse cette image technique et livre le verdict d'atelier direct.`

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
            maxOutputTokens: 350,
            temperature: 0.1
          }
        })
      }
    )

    const data = await response.json()
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur de traitement vision." }, { status: 500 })
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic visuel impossible."
    
    // Double export pour matcher toutes les variantes de ton interface
    return NextResponse.json({ 
      result: resultText,
      response: resultText 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur vision." }, { status: 500 })
  }
}
