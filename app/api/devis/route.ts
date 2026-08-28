import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
        return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans de métier.

⚠️ ARRÊT D'URGENCE (RÈGLE ABSOLUE) ⚠️
Si le mécanicien annonce une pièce "à remplacer", une "fuite", un "jeu", une "usure", ou précise qu'il est en "attente de validation de devis" :
1. STOPPE IMMÉDIATEMENT TOUT DIAGNOSTIC. Ne propose AUCUN test supplémentaire.
2. Valide l'intervention d'une seule phrase (ex: "Bien reçu, usure confirmée. On remplace.").
3. Insère obligatoirement la balise [PIECE_CIBLE: Nom de la pièce].
4. Génère DIRECTEMENT le bloc JSON final avec le devis brouillon.

SI LA PANNE EST INCONNUE (Recherche active) :
- Donne 2 causes probables maximum.
- Prescris 1 seul test physique mesurable.
- Attends le retour.

RÈGLES MÉCANIQUES :
- Disques remplacés = Plaquettes neuves obligatoires.
- Amortisseurs = Remplacement par paire obligatoire + coupelles + géométrie.

STYLE : Télégraphique, jargon atelier, AUCUN bavardage.

FORMAT JSON OBLIGATOIRE EN CAS DE CLÔTURE (À mettre à la toute fin) :
\`\`\`json
{
  "devis_brouillon": {
    "pieces_principales": [{ "designation": "Nom de la pièce", "quantite": 1 }],
    "peripheriques": [{ "designation": "Fournitures et consommables", "quantite": 1 }],
    "main_oeuvre": [{ "operation": "Remplacement et contrôles", "heures": 1.5 }]
  }
}
\`\`\``

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        return NextResponse.json({ error: data.error?.message || "Erreur API Gemini" }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic généré."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
