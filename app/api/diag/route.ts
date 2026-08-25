import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "La clé GEMINI_API_KEY n'est pas configurée dans Vercel." }, { status: 500 })
    }

    const body = await req.json()
    const plate = body.plate || "Non renseignée"
    const motorisation = body.motorisation || body.vehicle || "Véhicule non spécifié"
    const dtc = body.dtc || "DTC non spécifié"
    const symptoms = body.symptoms || "Symptômes non spécifiés"

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience. Tu t'adresses à des mécaniciens professionnels francophones en utilisant le jargon d'atelier réel.
Structure obligatoirement ta réponse en 3 phases :
Phase 1 : Hiérarchisation des 3 causes physiques les plus probables sur cette motorisation précise + alerte sur les pannes pièges.
Phase 2 : Protocole de mesure pas-à-pas physique et mesurable (ex: piquer la Pin X, consigne 5V).
Phase 3 : Attendre la validation de l'utilisateur ('Mesure conforme' ou 'Mesure non conforme').`

    const promptText = `${SYSTEM_PROMPT}\n\nVéhicule : ${motorisation} (Plaque : ${plate})\nCode DTC : ${dtc}\nSymptômes : ${symptoms}`

    // Appel direct à l'API Gemini v1beta sans dépendance externe
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    })

    const data = await apiRes.json()
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message || "Erreur de l'API Gemini." }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analyse terminée."
    return NextResponse.json({ response: text })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur interne du serveur." }, { status: 500 })
  }
}
