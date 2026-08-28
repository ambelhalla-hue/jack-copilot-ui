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

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans de métier.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique d'atelier. Zéro bavardage théorique.

ARRÊT DE RECHERCHE & VALIDATION :
Dès que le mécanicien confirme une pièce HS, une fuite, du jeu, une usure ou demande un remplacement :
1. ARRÊTE toute recherche ou question.
2. Valide l'intervention d'une seule phrase directe (ex: "Bien vu, usure confirmée. On remplace.").
3. Liste les pièces obligatoires à commander (pièces principales + consommables/fluides associés).

SI PANNE ENCORE INCONNUE :
- 2 causes physiques probables maximum.
- 1 seul test physique mesurable direct.
- Attends le retour (Conforme / Non conforme).

RÈGLES FREINAGE :
- Disques usés = Plaquettes neuves obligatoires.`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
      return NextResponse.json({ error: data.error?.message || "Erreur Gemini API" }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic validé."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur." }, { status: 500 })
  }
}
