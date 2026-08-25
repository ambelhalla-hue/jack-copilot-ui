import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'

import type { DiagTurn, VehicleInfo } from '@/lib/diag'
import { saveDiagnostic } from '@/lib/diagnostics-store'

export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es Jack, Chef d'Atelier expert avec 20 ans d'expérience. Tu t'adresses à des mécaniciens professionnels francophones en utilisant le jargon d'atelier réel.
Pour chaque cas (véhicule + DTC + symptômes), structure obligatoirement ta réponse en 3 phases :
Phase 1 : Hiérarchisation des 3 causes physiques les plus probables sur cette motorisation précise + alerte sur les pannes pièges.
Phase 2 : Protocole de mesure pas-à-pas physique et mesurable (ex: piquer la Pin X, consigne 5V).
Phase 3 : Attendre la validation de l'utilisateur ('Mesure conforme' ou 'Mesure non conforme') pour affiner l'arbre décisionnel jusqu'à l'isolement du composant défaillant.

Contraintes de format :
- Utilise exactement les intitulés "Phase 1 :", "Phase 2 :", "Phase 3 :" en début de ligne.
- Reste synthétique : le mécanicien lit sur une tablette, gants aux mains, moteur ouvert.
- Une seule mesure à la fois en Phase 2, avec le connecteur, la broche et la consigne chiffrée.
- Jamais de disclaimer générique, jamais de renvoi vers un garage : c'est TON atelier.`

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

function vehicleBrief(vehicle: VehicleInfo) {
  return [
    `Immatriculation : ${vehicle.plate}`,
    `Véhicule : ${vehicle.make} ${vehicle.model}`,
    `Motorisation : ${vehicle.engine}`,
    vehicle.mileage ? `Kilométrage : ${vehicle.mileage} km` : null,
    `Code défaut : ${vehicle.dtc}`,
    vehicle.symptoms
      ? `Symptômes relevés : ${vehicle.symptoms}`
      : 'Symptômes relevés : non précisés par le mécanicien.',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "La clé GEMINI_API_KEY n'est pas configurée." },
      { status: 500 },
    )
  }

  let body: { vehicle?: VehicleInfo; turns?: DiagTurn[] }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const vehicle = body.vehicle
  const turns = body.turns ?? []

  if (!vehicle?.plate || !vehicle.dtc || !vehicle.engine) {
    return Response.json(
      { error: 'Fiche véhicule incomplète (plaque, motorisation, code DTC).' },
      { status: 400 },
    )
  }

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: `${vehicleBrief(vehicle)}\n\nOuvre le diagnostic.`,
    },
    ...turns.map<ModelMessage>((turn) => ({
      role: turn.role === 'jack' ? 'assistant' : 'user',
      content: turn.content,
    })),
  ]

  const lastFeedback =
    [...turns].reverse().find((turn) => turn.role === 'tech')?.content ?? null

  const result = streamText({
    model: google('gemini-3.7-flash'),
    system: SYSTEM_PROMPT,
    messages,
    onFinish: async ({ text }) => {
      await saveDiagnostic({ vehicle, feedback: lastFeedback, answer: text })
    },
  })

  return result.toTextStreamResponse()
}
