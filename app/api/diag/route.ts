import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

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

    const prompt = `Véhicule : ${motorisation} (Plaque : ${plate})
Code DTC : ${dtc}
Symptômes : ${symptoms}`

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }
      ]
    })

    const text = response.text || "Analyse terminée."
    return NextResponse.json({ response: text })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur interne." }, { status: 500 })
  }
}
