import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
      return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert et Mentor technique en concession.
RÈGLE D'OR : Sois BREF, DIRECT et PRÉCIS (style atelier).

1. CONSTAT DIRECT / USURE / PIÈCE HS (ex: courroie accessoire/distri, disques, fuite) :
- Valide immédiatement le constat sans lancer de mesure imaginaire.
- Rappelle les précautions clés (pigeage, pompe à eau, liquide de refroidissement, couples).
- Conclus pour le chiffrage en ajoutant en fin de message : [PIECE_CIBLE: Courroie de distribution et accessoire]

2. RECHERCHE DE PANNE FLOU :
- Propose 2 causes probables maximum.
- Prescris 1 test physique mesurable.
- Attends le retour.`

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: String(msg.content || "") }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents
        })
      }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error?.message || "Erreur de l'API Google." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Bien reçu."
    
    return NextResponse.json({ 
      response: reply,
      text: reply,
      message: reply
    })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
