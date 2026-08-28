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

    // 1. Récupération des taux horaires
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
      console.error("Erreur lecture Supabase", e)
    }

    const userPrompt = `Tu es un chiffreur expert après-vente automobile.
Génère le chiffrage en JSON STRICT (sans markdown, sans aucun texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - Kilométrage : ${kilometrage || "120000"} km
Constat mécanique : ${panne_constatee || "Remplacement pièces"}
Contrôles sécurité signalés : ${options_travaux || "Non spécifié"}

RÈGLES STRICTES DE CHIFFRAGE :
1. EXHAUSTIVITÉ ABSOLUE : Tu DOIS créer une ligne distincte dans "pieces_principales" pour la panne mécanique ET pour CHAQUE élément noté urgent ou à prévoir (Pneus AV/AR, Plaquettes, Disques, Batterie, etc.). N'oublie AUCUN organe défectueux.
2. RÈGLE DISQUES/PLAQUETTES : Si des disques sont à remplacer, inclus TOUJOURS les disques ET les plaquettes associées.
3. CONSTAT SYNTHÉTIQUE ATELIER : Rédige dans "constat_court" UNIQUEMENT la liste directe des pièces à remplacer (ex: "À remplacer : Disques et plaquettes AV + Batterie 12V + 2 Pneus AR"). Zéro phrase d'explication.

FORMAT JSON STRICT ATTENDU :
{
  "constat_court": "À remplacer : Jeu disques & plaquettes AV + Batterie 12V",
  "pieces_principales": [
    { "id": "1", "designation": "Jeu de disques de frein avant", "ref": "16 188 627 80", "quantite": 1, "prix_unitaire_ht": 110.00 },
    { "id": "2", "designation": "Jeu de plaquettes de frein avant", "ref": "16 172 834 80", "quantite": 1, "prix_unitaire_ht": 65.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Fournitures atelier & nettoyant freins", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 8.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Remplacement disques et plaquettes avant", "heures": 1.40, "taux_horaire_ht": ${tauxT1} }
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
      if (rawText) devis = JSON.parse(rawText)
    } catch (e) {
      console.error("Erreur parsing IA", e)
    }

    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        constat_court: panne_constatee || "Remplacement pièces défectueuses",
        pieces_principales: [
          { id: "1", designation: "Organe principal de rechange", ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 120.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures atelier & recyclage", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 7.50 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Main-d'œuvre intervention", heures: 0.80, taux_horaire_ht: tauxT1 }
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
