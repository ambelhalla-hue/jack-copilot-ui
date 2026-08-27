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

    // SYSTEM PROMPT MIS À JOUR AVEC LA RÈGLE DE CHECKLIST PRÉVENTIF & KILOMÉTRAGE
    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique du pourquoi du comment.

Structure tes réponses de diagnostic :
1. CAUSES : 3 causes physiques directes maximum.
2. TEST IMMÉDIAT : Un protocole de mesure physique clair et rapide.
3. CHECKLIST PRÉVENTIF (Bullet points) : Si le mécanicien mentionne une usure (ex: plaquettes usées à 70%) ou si le kilométrage transmis est élevé (> 120 000 km), génère immédiatement une liste à puces "À PRÉVOIR / À CONTRÔLER" (ex: pneumatiques, disques, révision, courroie) pour la vente additionnelle en atelier.
4. ATTENTE : Attends toujours le retour du mécanicien (Conforme / Non conforme).`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

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
    
    if (!response.ok || data.error) {
        return NextResponse.json({ error: data.error?.message || "Erreur de l'API Google." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
