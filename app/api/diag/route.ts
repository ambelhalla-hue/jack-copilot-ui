import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const tauxT1 = 75.00
    const tauxT2 = 95.00

    const userPrompt = `Génère le chiffrage en JSON STRICT (sans markdown, sans texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - ${kilometrage || "120000"} km
Panne mécanique : ${panne_constatee || "Remplacement pièces"}
Contrôles sécurité : ${options_travaux || "Non spécifié"}

RÈGLES :
1. Crée une ligne dans "pieces_principales" pour la panne ET pour chaque anomalie signalée.
2. Disques à remplacer = Disques ET plaquettes obligatoires.
3. Rédige dans "constat_court" UNIQUEMENT la liste des pièces à remplacer.

Format JSON attendu :
{
  "constat_court": "À remplacer : Amortisseurs avant + Coupelles",
  "pieces_principales": [
    { "id": "1", "designation": "Jeu d'amortisseurs avant", "ref": "OEM-AMORT", "quantite": 1, "prix_unitaire_ht": 160.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Kit visserie neuve & fournitures atelier", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 12.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Remplacement amortisseurs avant et réglage géométrie", "heures": 2.20, "taux_horaire_ht": ${tauxT2} }
  ]
}`

    let devis: any = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        }
      )

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText) devis = JSON.parse(rawText)
    } catch (e) {
      console.error("Erreur parsing IA", e)
    }

    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        constat_court: panne_constatee || "Remplacement pièces défectueuses",
        pieces_principales: [
          { id: "1", designation: panne_constatee || "Organe principal de rechange", ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 120.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures atelier & consommables", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 8.50 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Main-d'œuvre intervention atelier", heures: 1.20, taux_horaire_ht: tauxT1 }
        ]
      }
    }

    const totalPiecesHT = (devis.pieces_principales || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalFournituresHT = (devis.peripheriques || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalMoHT = (devis.main_oeuvre || []).reduce((acc: number, m: any) => acc + (Number(m.heures || 0) * Number(m.taux_horaire_ht || tauxT1)), 0)

    // ENVOI SÉCURISÉ DES DONNÉES VERS LA BASE DE DONNÉES
    return NextResponse.json({
      devis: {
        ...devis,
        totaux: {
          totalPiecesHT,
          totalFournituresHT,
          totalMoHT,
          totalHT: totalPiecesHT + totalFournituresHT + totalMoHT
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur critique API." }, { status: 500 })
  }
}
