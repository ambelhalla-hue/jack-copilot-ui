import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "La clé GEMINI_API_KEY n'est pas configurée dans Vercel." }, { status: 500 })
    }

    const body = await req.json()
    const messages = body.messages || []

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique du pourquoi du comment.
Structure tes réponses :
1. Causes (3 max, directes).
2. Test physique immédiat (Ex: Pique Pin 3, cible 5V).
3. CHECKLIST PRÉVENTIF (Bullet points) : Si le mécanicien mentionne une usure (ex: plaquettes usées à 70%) ou selon le kilométrage élevé, génère immédiatement une liste à puces "À PRÉVOIR / À REMPLACER" (ex: pneumatiques, révision, distribution).
4. Attends le retour du mécano pour adapter l'arbre décisionnel.`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur renvoyée par Gemini." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur interne du serveur." }, { status: 500 })
  }
}
