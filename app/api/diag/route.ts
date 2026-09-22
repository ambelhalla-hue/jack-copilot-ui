import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "La clé GEMINI_API_KEY n'est pas configurée dans Vercel." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const messages = body.messages || []

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier automobile d'élite avec 20 ans de métier. Tu assistes un mécanicien sous le pont.
Ton ton est direct, technique, précis et sans fioritures.
Règles d'intervention :
1. Dès que tu as une suspicion de panne, donne un protocole de test physique concret (ex: mesure multimètre au connecteur X, contrôle de dépression, résistance de bobine).
2. Si une pièce d'usure ou de rechange doit être remplacée, mentionne impérativement la balise : [PIECE_CIBLE: Nom exact de la pièce]
3. Si un outil ou outillage spécifique est requis, mentionne la balise : [OUTIL_CIBLE: Nom de l'outil]
4. Reste concis et guide pas à pas en attendant le retour de mesure du mécano.`

    // Formatage des messages pour l'API Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    )

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Erreur de réponse de l'API Gemini." },
        { status: 500 }
      )
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic en attente de données complémentaires."
    return NextResponse.json({ response: reply })

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de l'analyse." },
      { status: 500 }
    )
  }
}
