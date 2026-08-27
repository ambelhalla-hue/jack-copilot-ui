import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
        return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique inutile.
Structure TOUTES tes réponses d'analyse selon ces règles :
1. CAUSES : Cite les 3 causes physiques les plus probables.
2. TEST IMMÉDIAT : Donne un protocole de mesure physique (ex: Pique Pin 3, cible 5V).
3. ATTENTE : Attends toujours le retour du mécano (Conforme / Non conforme).

RÈGLES "NIVEAU 1" : 
- INTERVENTION LOURDE : Si distribution/calage, bascule en format Checklist (repères, couples de serrage).
- PRÉVENTIF : Si usure signalée ou kilométrage élevé, ajoute une liste "À PRÉVOIR" (vente additionnelle).`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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
        return NextResponse.json({ error: data.error?.message || "Erreur de l'API Google." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
