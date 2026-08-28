import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const userPrompt = `Tu es un expert chiffrage après-vente automobile.
Génère la nomenclature détaillée et chiffrée en JSON STRICT (sans markdown, sans texte autour) pour l'intervention suivante :
Véhicule : ${vehicle || "Peugeot 308"} (${immat || "AA-123-BB"}), ${kilometrage || "120000"} km
Constat atelier / Panne : ${panne_constatee || "Remplacement batterie"}
Contrôles : ${options_travaux || "Non spécifié"}

Structure JSON obligatoire :
{
  "pieces_principales": [
    { "id": "1", "designation": "${panne_constatee || 'Composant principal'}", "ref": "OEM-PR", "quantite": 1, "prix_unitaire_ht": 120.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Fournitures d'atelier et recyclage", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 8.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Dépose / Repose et paramétrage", "heures": 0.8, "taux_horaire_ht": 85.00 }
  ]
}`

    let devis: any = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      if (rawText) {
        devis = JSON.parse(rawText)
      }
    } catch (e) {
      console.error("Erreur parsing IA, passage au fallback direct", e)
    }

    // Sécurité absolue : si l'IA n'a pas renvoyé la structure, on injecte les données minimums
    if (!devis || !devis.pieces_principales || devis.pieces_principales.length === 0) {
      devis = {
        pieces_principales: [
          { id: "1", designation: panne_constatee || "Batterie 12V", ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 115.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures et recyclage atelier", ref: "DIV-01", quantite: 1, prix_unitaire_ht: 6.00 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Main d'œuvre remplacement", heures: 0.5, taux_horaire_ht: 85.00 }
        ]
      }
    }

    const totalPiecesHT = (devis.pieces_principales || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalFournituresHT = (devis.peripheriques || []).reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)), 0)
    const totalMoHT = (devis.main_oeuvre || []).reduce((acc: number, m: any) => acc + (Number(m.heures || 0) * Number(m.taux_horaire_ht || 85)), 0)

    const totalHT = totalPiecesHT + totalFournituresHT + totalMoHT
    const tva = totalHT * 0.20
    const totalTTC = totalHT + tva

    return NextResponse.json({
      devis: {
        ...devis,
        totaux: {
          totalPiecesHT,
          totalFournituresHT,
          totalMoHT,
          totalHT,
          tva,
          totalTTC,
          totalTTC_circulaire: totalTTC * 0.80
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur calcul devis." }, { status: 500 })
  }
}
