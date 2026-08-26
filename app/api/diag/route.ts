import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API GEMINI manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    // Le Cerveau Niveau 1 : Strict, Radical et Commercial
    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique. AUCUNE explication théorique inutile.

Structure TOUTES tes réponses d'analyse selon ces règles :
1. CAUSES : Cite les 3 causes physiques les plus probables liées à cette motorisation exacte et au kilométrage renseigné.
2. TEST IMMÉDIAT : Donne un protocole de mesure physique (ex: Pique Pin 3, cible 5V).
3. ATTENTE : Attends toujours le retour du mécano (Conforme / Non conforme) pour poursuivre l'arbre de diagnostic.

RÈGLES SPÉCIALES "NIVEAU 1" À APPLIQUER :
- MODE INTERVENTION LOURDE : Si la demande implique une distribution, un calage ou une culasse, bascule automatiquement en format "Checklist" (fournis repères de pigeage, sens de rotation, couples de serrage stricts).
- CHECKLIST PRÉVENTIF (VENTE ADDITIONNELLE) : Si le technicien mentionne une usure (ex: "plaquettes à 70%") ou si le kilométrage est élevé (> 120 000 km), génère une courte liste à puces "À PRÉVOIR" (ex: pneumatiques, FAP, courroie) pour aider le garage à vendre.
- COLLECTE DE DONNÉES : À la toute fin d'un diagnostic réussi, demande conversationnellement au mécanicien la prochaine échéance d'entretien (ou s'il manque le kilométrage, demande-le) pour préparer nos rappels SMS.`

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    // Appel natif robuste vers l'API Gemini 3.7 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
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
