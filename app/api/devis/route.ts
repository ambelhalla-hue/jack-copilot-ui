import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    let tauxT1 = 75.00
    let tauxT2 = 95.00
    let tauxT3 = 120.00

    try {
      if (supabaseUrl && supabaseAnonKey) {
        const resParam = await fetch(`${supabaseUrl}/rest/v1/parametres_atelier?select=*&limit=1`, {
          headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
        })
        const params = await resParam.json()
        if (params && params.length > 0) {
          tauxT1 = Number(params[0].taux_t1) || 75.00
          tauxT2 = Number(params[0].taux_t2) || 95.00
          tauxT3 = Number(params[0].taux_t3) || 120.00
        }
      }
    } catch (e) {
      console.error("Lecture parametres Supabase ignorée", e)
    }

    const userPrompt = `Tu es un chiffreur expert après-vente automobile.
Génère la nomenclature chiffrée en JSON STRICT (sans markdown, sans aucun texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - Compteur : ${kilometrage || "120000"} km
Constats mécanicien : ${panne_constatee || "Remplacement pièces usées"}
Contrôles sécurité : ${options_travaux || "Non spécifié"}

RÈGLES STRICTES :
1. EXHAUSTIVITÉ : Crée une ligne dans "pieces_principales" pour la panne ET pour CHAQUE anomalie signalée.
2. RÈGLE FREINAGE : Si des disques sont signalés, inclus obligatoirement les disques ET les plaquettes associées.
3. CONSTAT SYNTHÉTIQUE : Rédige dans "constat_court" UNIQUEMENT la liste des pièces (ex: "À remplacer : Amortisseurs AV + Coupelles + Géométrie").

Format JSON attendu :
{
  "constat_court": "À remplacer : Amortisseurs AV + Coupelles",
  "pieces_principales": [
    { "id": "1", "designation": "Jeu d'amortisseurs avant", "ref": "OEM-AMORT", "quantite": 1, "prix_unitaire_ht": 160.00 },
    { "id": "2", "designation": "Kit coupelles de suspension avant", "ref": "OEM-COUP", "quantite": 1, "prix_unitaire_ht": 45.00 }
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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

    const totalHT = totalPiecesHT + totalFournituresHT + totalMoHT
    const tva = totalHT * 0.20
    const totalTTC = totalHT + tva

    return NextResponse.json({
      constat_court: devis.constat_court || panne_constatee,
      devis: {
        ...devis,
        totaux: {
          totalPiecesHT,
          totalFournituresHT,
          totalMoHT,
          totalHT,
          tva,
          totalTTC,
          totalTTC_circulaire: totalTTC * 0.78
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur calcul devis." }, { status: 500 })
  }
}
