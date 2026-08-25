import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique.
Structure tes réponses :
1. Causes (3 max, directes).
2. Test physique immédiat (Ex: Pique Pin 3, consigne 5V).
3. Attends le retour du mécano.
Adapte-toi immédiatement si le mécanicien te dit "C'est pas ça", et donne la suite de l'arbre décisionnel.`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    // Bascule sur la voie rapide et stable : gemini-1.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    
    // Gestion propre de l'erreur de surcharge (High Demand)
    if (!response.ok || data.error) {
        const errorMsg = data.error?.message || "Erreur API Gemini"
        if (errorMsg.includes("high demand") || errorMsg.includes("overloaded")) {
            return NextResponse.json({ error: "Les serveurs de l'IA sont surchargés pour le moment. Réessayez dans quelques secondes." }, { status: 503 })
        }
        return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
