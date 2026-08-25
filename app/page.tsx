import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience. Tu t'adresses à des mécaniciens professionnels francophones.
Règle d'or : Avant de proposer un diagnostic, fais une recherche mentale dans ta base de connaissances sur les pannes endémiques (maladies connues, défauts de conception, rappels constructeurs) correspondant EXACTEMENT au véhicule et au moteur renseignés.

Structure ta réponse en 3 phases :
Phase 1 : Identification du problème connu. Croise le symptôme avec le modèle de voiture. Cite les 3 causes physiques les plus probables sur CETTE motorisation précise + alerte sur les pannes pièges.
Phase 2 : Protocole de mesure pas-à-pas. Donne un test physique mesurable à faire (ex: piquer la Pin X, consigne 5V, test de dépression).
Phase 3 : Attendre la validation de l'utilisateur ('Mesure conforme' ou 'Mesure non conforme') pour affiner l'arbre décisionnel.`

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "La clé GEMINI_API_KEY n'est pas configurée dans Vercel." }, { status: 500 })
    }

    const body = await req.json()
    // On récupère ce que le mécano a tapé (même sans plaque SIV payante)
    const motorisation = body.motorisation || body.vehicle || body.vehicle_info || "Véhicule non spécifié"
    const dtc = body.dtc || body.dtc_code || "DTC inconnu / non fourni"
    const symptoms = body.symptoms || "Aucun symptôme renseigné"

    const prompt = `Véhicule : ${motorisation}
Code / Panne suspectée : ${dtc}
Symptômes constatés : ${symptoms}
Analyse ce problème spécifiquement pour ce modèle.`

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
    return NextResponse.json({ error: err?.message || "Erreur interne lors de l'appel à Jack." }, { status: 500 })
  }
}
