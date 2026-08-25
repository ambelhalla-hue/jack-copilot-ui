import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API non configurée." }, { status: 500 })

    // On récupère toutes les données sans faire de blocage d'erreur
    const body = await req.json()
    const infosBrutes = JSON.stringify(body)

    const prompt = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience. 
    Voici les infos reçues du mécanicien : ${infosBrutes}
    
    Structure ta réponse en 3 phases :
    Phase 1 : Identification du problème connu sur ce modèle (3 causes).
    Phase 2 : Protocole de mesure physique pas-à-pas (ex: piquer la Pin X).
    Phase 3 : Attendre la validation de l'utilisateur.`

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })

    return NextResponse.json({ response: response.text })
  } catch (err: any) {
    return NextResponse.json({ error: "Erreur serveur : " + err.message }, { status: 500 })
  }
}
