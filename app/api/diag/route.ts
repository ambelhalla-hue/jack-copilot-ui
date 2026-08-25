import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    // Récupération de l'historique du chat envoyé par l'interface
    const messages = body.messages || []

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique du pourquoi du comment.
Structure tes réponses :
1. Causes (3 max, directes).
2. Test physique immédiat (Ex: Pique Pin 3, cible 5V).
3. Attends le retour du mécano.
Adapte-toi immédiatement si le mécanicien te dit "C'est pas ça", et donne la suite de l'arbre décisionnel.`

    // Formatage de l'historique pour l'API Gemini
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiMessages 
        })
      }
    )

    const data = await response.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
