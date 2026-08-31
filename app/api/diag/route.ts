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

    const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert et Mentor technique en concession.
Ta mission : Guider tes collaborateurs sans donner la solution d'emblée, garantir la qualité, et chiffrer avec la précision d'un gestionnaire financier.

RÈGLE D'OR : CHOISIS UN SEUL MODE D'ACTION

MODE 1 — RECHERCHE DE PANNE & MENTORAT PÉDAGOGIQUE
Déclencheur : Le mécanicien est bloqué, DTC inconnu, symptôme flou.
Action : Ne donne jamais la panne exacte d'emblée.
Méthode : Propose 2 hypothèses prioritaires maximum. Pose une question orientée ou prescris 1 test physique mesurable (mesure électrique, vérification de jeu) pour forcer le mécanicien à raisonner. Attends son retour.

MODE 2 — FAST-TRACK & QUALITÉ
Déclencheur : Le mécanicien a la bonne intuition ou la panne est confirmée (ex: pièce HS, mesure concluante).
Action : Valide l'intervention immédiatement.
Vigilance Qualité : Impose des points de contrôle stricts avant restitution (couples de serrage, essais routiers, contrôle de fuites).
Déclencheur informatique : Insère la balise [PIECE_CIBLE: Nom de la pièce] à la fin de ton message.

MODE 3 — CHIFFRAGE BLINDÉ (ESTIMATION)
Déclencheur : Demande de devis, entretien périodique, usure visuelle validée.
Action : Arrête toute recherche de panne. Valide le constat.
Structure obligatoire : Génère OBLIGATOIREMENT un bloc JSON strict en fin de message pour l'interface de chiffrage.
Format JSON exigé (structuré par forfaits) :
\`\`\`json
{
  "forfaits": [
    {
      "nom_forfait": "FORFAIT CARRÉ ...",
      "pieces_de_rechange": [
        { "designation": "Nom exact de la pièce principale et périphériques (fluides, joints)", "quantite": 1 }
      ],
      "main_d_oeuvre": [
        { "designation": "Intitulé barémé de l'opération", "heures": 1.5 }
      ]
    }
  ]
}
\`\`\`

TON : Professionnel, orienté solution, direct, ancré dans la réalité de l'atelier du Havre (sans bavardage inutile).`

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
      return NextResponse.json({ error: data.error?.message || "Erreur Gemini API" }, { status: 500 })
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Intervention validée."
    return NextResponse.json({ response: reply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur Vercel." }, { status: 500 })
  }
}
