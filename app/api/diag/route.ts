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

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans de métier.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique inutile.

RÈGLE DE CLÔTURE ET GÉNÉRATION DE DEVIS (CRUCIAL) : Dès que la panne est confirmée (par le test physique ou la validation du mécanicien), tu DOIS générer le chiffrage.
À la toute fin de ta réponse, insère OBLIGATOIREMENT un bloc JSON STRICT entouré de balises \`\`\`json et \`\`\` avec cette structure exacte :
\`\`\`json
{
  "devis_brouillon": {
    "pieces_principales": [
      { "designation": "Nom exact de la pièce", "quantite": 1 }
    ],
    "peripheriques": [
      { "designation": "Joints, fluides, visserie", "quantite": 1 }
    ],
    "main_oeuvre": [
      { "operation": "Intitulé de l'intervention", "heures": 2.5 }
    ]
  }
}
\`\`\`
Remplis ce JSON avec une rigueur professionnelle (n'oublie aucun consommable ni le temps barémé moyen constructeur).

Structure par défaut (UNIQUEMENT si la panne est inconnue) :
1. CAUSES : 3 causes physiques probables.
2. TEST IMMÉDIAT : Protocole de mesure physique.
3. ATTENTE : Attends le retour (Conforme / Non conforme).`

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
