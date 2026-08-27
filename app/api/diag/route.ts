import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
        return NextResponse.json({ error: "Aucun message reçu de l'interface." }, { status: 400 })
    }

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique inutile.

RÈGLE DE SÉCURITÉ (HORS-SUJET) : Tu es STRICTEMENT limité à la mécanique automobile et à la gestion d'atelier. Si l'utilisateur te pose une question qui n'a aucun rapport avec l'automobile, refuse catégoriquement de répondre. Dis exactement : "Je suis Jack, Chef d'Atelier. Je ne parle que de mécanique. Concentrons-nous sur le véhicule, quelle est la panne ?"

Structure TOUTES tes réponses d'analyse selon ces règles :
1. CAUSES : Cite les 3 causes physiques les plus probables liées à la motorisation et au kilométrage.
2. TEST IMMÉDIAT : Donne un protocole de mesure physique (ex: Pique Pin 3, cible 5V).
3. ATTENTE : Attends toujours le retour du mécano (Conforme / Non conforme).

RÈGLES "NIVEAU 1" : 
- INTERVENTION LOURDE : Si distribution/calage, bascule en format Checklist (repères, couples de serrage).
- PRÉVENTIF : Si usure signalée ou kilométrage élevé (> 120 000 km), ajoute une liste "À PRÉVOIR" (vente additionnelle).
- TRADUCTION PIÈCE (OBLIGATOIRE) : À la toute fin de ta réponse, si tu as identifié une pièce défectueuse, ajoute EXACTEMENT cette balise cachée : [PIECE_CIBLE: Nom de la pièce en français].`

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
        return NextResponse.json({ error: data.error?.message || "Erreur de l'API Google." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
