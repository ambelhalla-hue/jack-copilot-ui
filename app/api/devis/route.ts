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

    // 1. Récupération des taux horaires réels du garage depuis Supabase
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
      console.error("Erreur lecture parametres Supabase, utilisation des valeurs par défaut.", e)
    }

    // 2. Recherche de correspondance dans la table des 100 barèmes standards
    let baremeTrouve: any = null
    try {
      if (supabaseUrl && supabaseAnonKey && panne_constatee) {
        const resBaremes = await fetch(`${supabaseUrl}/rest/v1/baremes_standards?select=*`, {
          headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
        })
        const listBaremes = await resBaremes.json()
        if (Array.isArray(listBaremes)) {
          const motsCles = panne_constatee.toLowerCase().split(" ")
          baremeTrouve = listBaremes.find((b: any) => 
            motsCles.some((mot: string) => mot.length > 3 && b.operation.toLowerCase().includes(mot))
          )
        }
      }
    } catch (e) {
      console.error("Erreur lecture baremes Supabase", e)
    }

    const userPrompt = `Tu es un chiffreur expert après-vente automobile.
Génère la nomenclature chiffrée en JSON STRICT (sans markdown, sans aucun texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - Compteur : ${kilometrage || "120000"} km
Constats mécanicien : ${panne_constatee || "Remplacement batterie 12V"}
Contrôles atelier : ${options_travaux || "Non spécifié"}

DONNÉES ATELIER RÉELLES (SUPABASE) :
- Taux horaires applicables : T1=${tauxT1}€, T2=${tauxT2}€, T3=${tauxT3}€
${baremeTrouve ? `- Barème standard officiel identifié : "${baremeTrouve.operation}" -> Temps barémé = ${baremeTrouve.temps_heures} h (Taux ${baremeTrouve.type_taux}), Fournitures obligatoires = ${baremeTrouve.fournitures_incluses}` : "- Détermine les temps et pièces adaptés aux règles constructeur."}

FORMAT JSON STRICT ATTENDU :
{
  "pieces_principales": [
    { "id": "1", "designation": "${baremeTrouve ? baremeTrouve.operation : (panne_constatee || 'Organe principal')}", "ref": "OEM-REF", "quantite": 1, "prix_unitaire_ht": 135.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "${baremeTrouve?.fournitures_incluses || 'Fournitures et consommables d atelier'}", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 7.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "${baremeTrouve ? baremeTrouve.operation : 'Main-d oeuvre remplacement'}", "heures": ${baremeTrouve ? baremeTrouve.temps_heures : 0.60}, "taux_horaire_ht": ${baremeTrouve?.type_taux === 'T2' ? tauxT2 : baremeTrouve?.type_taux === 'T3' ? tauxT3 : tauxT1} }
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
      console.error("Erreur parsing IA devis", e)
    }

    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        pieces_principales: [
          { id: "1", designation: baremeTrouve ? baremeTrouve.operation : (panne_constatee || "Batterie 12V"), ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 135.00 }
        ],
        peripheriques: [
          { id: "1", designation: baremeTrouve?.fournitures_incluses || "Consommables & recyclage", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 7.50 }
        ],
        main_oeuvre: [
          { id: "1", operation: baremeTrouve ? baremeTrouve.operation : "Main-d'œuvre intervention", heures: baremeTrouve ? Number(baremeTrouve.temps_heures) : 0.60, taux_horaire_ht: baremeTrouve?.type_taux === 'T2' ? tauxT2 : tauxT1 }
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
