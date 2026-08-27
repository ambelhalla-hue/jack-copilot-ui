import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
        return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert.
RÈGLE ABSOLUE : Sois BREF, RADICAL et PRÉCIS. Style télégraphique.

TRI DES CODES MULTIPLES : Si l'utilisateur donne plusieurs codes défauts (DTC), cherche immédiatement le lien technique (masse commune, alimentation 5V, réseau multiplexé). Isole la panne racine et ignore les défauts "fantômes" ou en cascade.

RÈGLE DE CLÔTURE STRICTE : Si le mécanicien confirme qu'une pièce est "HS" ou que la panne est trouvée, ARRÊTE les tests immédiatement. Tu dois :
1. Rédiger un "CONSTAT FINAL" d'une phrase résumant la résolution.
2. Insérer la balise [PIECE_CIBLE: Nom exact de la pièce].
3. Générer le bloc \`\`\`json "devis_brouillon" incluant toutes les pièces principales, périphériques obligatoires et le temps barémé pour l'intervention globale.

Structure EN COURS DE RECHERCHE :
1. CAUSE RACINE : L'élément commun justifiant les différents codes.
2. TEST IMMÉDIAT : La mesure électrique ou physique prioritaire.
3. ATTENTE : Attends le retour (Conforme / Non conforme).`

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
        return NextResponse.json({ error: data.error?.message || "Erreur Google API." }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur." }, { status: 500 })
  }
}
