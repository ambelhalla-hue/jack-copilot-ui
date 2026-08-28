import { NextResponse } from "next/server"
import { getManufacturerFromEngine, getTSBsForDTC, getTSBsForEngine, getManufacturerRules, BRAKE_RULES, TIRE_WEAR_LEVELS } from "@/lib/multi-brand-db"

export const maxDuration = 60

interface DiagnosticContext {
  manufacturer?: string
  engineCode?: string
  vehicle?: string
  dtc?: string
  mileage?: string
  isFastTrack?: boolean
}

function buildMultiBrandPrompt(context: DiagnosticContext): string {
  const { manufacturer, engineCode, vehicle, dtc, mileage, isFastTrack } = context
  
  const manufacturerRules = manufacturer ? getManufacturerRules(manufacturer) : null
  const tsbs = dtc && manufacturer ? getTSBsForDTC(dtc, manufacturer) : []
  const engineTsbs = engineCode ? getTSBsForEngine(engineCode) : []
  
  const tsbnowledge = [...tsbs, ...engineTsbs]
    .map(t => `- DTC ${t.dtc} (${t.manufacturer}): ${t.symptom} → ${t.rootCause} → Remplacer: ${t.replacement}`)
    .join('\n')

  const torqueInfo = manufacturerRules ? Object.entries(manufacturerRules.torqueSpecs)
    .map(([part, nm]) => `${part}: ${nm} N·m`)
    .join(', ') : ''

  const fastTrackRule = isFastTrack ? `
URGENCE - MODE FAST-TRACK ACTIVÉ :
Le technicien a CONFIRMÉ une défaillance physique : usure, fuite, jeu, bruit, fumée, etc.
ACTION IMMÉDIATE :
1. VALIDE en une phrase directe (ex: "Usure confirmée, on remplace.").
2. LISTE EXHAUSTIVE des pièces (principales + consommables + fluides + visserie).
3. TERMINE la conversation - pas d'autres questions.
` : ''

  return `Tu es Jack, Chef d'Atelier expert polyvalent avec 20 ans d'expérience multi-marques.
MARQUE: ${manufacturer || 'Multi-marque'}
VÉHICULE: ${vehicle || 'À identifier'}
MOTEUR: ${engineCode || 'À identifier'}
KILOMÉTRAGE: ${mileage || 'Inconnu'}
${dtc ? `DTC ACTIF: ${dtc}` : ''}

═══ RÈGLES ABSOLUES ═══
1. BREF, RADICAL, PRÉCIS - Style télégraphique d'atelier, zéro théorie.
2. Utilise la base TSB et les normes constructeur pour cette marque.
3. Corrèle: Symptôme ↔ DTC ↔ Moteur ↔ TSB connu.

═══ RÈGLES DIAGNOSTIC ═══
- 2 causes physiques MAXIMUM si diagnostic inconnu.
- 1 TEST mesurable direct (tension, résistance, pression, observation).
- Attends le retour du technicien avant nouvelle question.

═══ RÈGLES FREINAGE (STRICT) ═══
- Disques usés → Plaquettes OBLIGATOIRES.
- Liquide aéré → Plaquettes OBLIGATOIRES + purge.
- Usure critique → Disques + Plaquettes + Liquide.

═══ RÈGLES PNEUMATIQUES & BATTERIE ═══
- Pneus ${TIRE_WEAR_LEVELS.critical.threshold} → Remplacement immédiat.
- Batterie < 11.5V → Remplacement, test électrique avant.
- Alternateur défaut → Batterie obligatoire.

═══ MAINTENANCE RAPIDE (Fast-Fit) ═══
- Contrôles sécurité: 0.5h max.
- Changement filtre/plaquettes: 1h max.
- Changement batterie: 0.5h.
- Remplacement pneus (4): 1.5h.

${fastTrackRule}

═══ BASE TSB & NORMES ${manufacturer || 'CONSTRUCTEUR'} ═══
${tsbnowledge || 'Diagnostic générique appliqué'}

${torqueInfo ? `Couples de serrages ${manufacturer}: ${torqueInfo}` : ''}

RAPPEL : Dès que le technicien CONFIRME une anomalie (HS, fuite, jeu, usure, fumée, bruit),
ARRÊTE tout et VALIDE l'intervention. Pas d'atermoiements.`
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const messages: Array<{ role: string; content: string }> = body.messages || []
    const context: DiagnosticContext = body.context || {}

    if (messages.length === 0) {
      return NextResponse.json({ error: "Aucun message reçu." }, { status: 400 })
    }

    // Detect fast-track triggers
    const lastUserMessage = messages[messages.length - 1]?.content || ""
    const fastTrackKeywords = [
      "usure", "fuite", "jeu", "cassé", "endommagé", "HS", "défaut", "fumée",
      "bruit", "craquement", "sifflement", "claquement", "rayé", "rouillé",
      "déformé", "déchirée", "replace", "remplacer", "changement"
    ]
    const isFastTrack = fastTrackKeywords.some(kw => 
      lastUserMessage.toLowerCase().includes(kw)
    )

    const SYSTEM_PROMPT = buildMultiBrandPrompt({ ...context, isFastTrack })

    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 512,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      const data = await response.json()
      if (!response.ok || data.error) {
        return NextResponse.json(
          { error: data.error?.message || "Erreur Gemini API" },
          { status: 500 }
        )
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnostic validé."
      return NextResponse.json({ 
        response: reply,
        fastTrack: isFastTrack,
        context: {
          manufacturer: context.manufacturer,
          engineCode: context.engineCode,
          dtc: context.dtc
        }
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: "Délai API dépassé, veuillez réessayer." },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur diagnostic." },
      { status: 500 }
    )
  }
}
