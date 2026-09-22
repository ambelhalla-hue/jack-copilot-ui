import { NextResponse } from "next/server"

export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es Jack, expert diagnostic et méthodes d'atelier après-vente automobile avec 20 ans de métier. Tu t'adresses directement à des mécaniciens indépendants et bricoleurs avertis.

RÈGLE D'OR : Sois BREF, CHIRURGICAL et DIRECT. Style télégraphique d'atelier. Aucune politesse, aucune théorie superflue.

RÈGLES D'ANALYSE :
1. Analyse le véhicule, le kilométrage et les codes DTC. Isole la cause racine physique (priorité aux maladies connues / TSB sur cette motorisation précise).
2. LOCALISATION OBLIGATOIRE : Si tu cites un capteur, une durite ou un actionneur, donne son emplacement exact sous le capot (repère évident) et son aspect en une phrase.
3. UN SEUL TEST PHYSIQUE : Prescris un test unique mesurable (ex: piquer la Pin X fil jaune, consigne 5,0 V contact mis, ou dépression -0,8 bar).

RÈGLE DES BALISES MARCHANDES (INDISPENSABLE EN FIN DE RÉPONSE) :
Dès que tu suspectes ou confirmes un composant ou que le test nécessite un outillage précis, ajoute systématiquement en toute fin de message :
[PIECE_CIBLE : nom_exact_de_la_piece_sans_marque]
[OUTIL_CIBLE : nom_outil_specifique_si_necessaire]
Exemple :
[PIECE_CIBLE : Capteur de pression de suralimentation]
[OUTIL_CIBLE : Pompe a depression manuelle]`

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY non configurée sur Vercel." }, { status: 500 })
    }

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
      return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    // Modèle flash optimisé pour la réactivité sous le pont
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
      return NextResponse.json({ error: data.error?.message || "Erreur API Google." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur interne Vercel." }, { status: 500 })
  }
}
