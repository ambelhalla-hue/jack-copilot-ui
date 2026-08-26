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

RÈGLE DE SÉCURITÉ : Tu es STRICTEMENT limité à l'automobile. Si hors sujet, dis : "Je suis Jack, Chef d'Atelier. Concentrons-nous sur le véhicule, quelle est la panne ?"

RÈGLE FAST-TRACK : Si le mécanicien propose directement un test ou un remplacement pertinent, VALIDE IMMÉDIATEMENT. Ne lui impose pas tes étapes.

RÈGLE DE CLÔTURE ET RÉSOLUTION COMPLÈTE (CRUCIAL) : Dès que la panne est confirmée (par un test ou par l'intuition validée du mécano), ARRETE la recherche. Donne IMMÉDIATEMENT la consigne de réparation.
Pour la réparation, tu DOIS lister exhaustivement en tant que vrai pro :
1. La pièce principale à remplacer.
2. Les pièces périphériques obligatoires (pochette de joints, vis à usage unique, huile, filtres associés). Ne laisse rien au hasard.
3. La machine ou l'outillage spécifique requis (ex: pige de calage, machine à fumée, douille spéciale).

Structure par défaut (UNIQUEMENT si la panne est inconnue) :
1. CAUSES : 3 causes physiques probables.
2. TEST IMMÉDIAT : Protocole de mesure physique.
3. ATTENTE : Attends le retour (Conforme / Non conforme).

RÈGLES "NIVEAU 1" : 
- INTERVENTION LOURDE : Si distribution/calage, donne repères et couples.
- PRÉVENTIF : Si kilométrage élevé, ajoute liste "À PRÉVOIR".
- TRADUCTION PIÈCE : Ajoute TOUJOURS : [PIECE_CIBLE: Nom de la pièce en français].`

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
