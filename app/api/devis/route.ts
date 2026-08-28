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

    // 1. Récupération des taux horaires de l'atelier
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
      console.error("Erreur lecture parametres Supabase", e)
    }

    // 2. Recherche de correspondance dans la table baremes_standards
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

    // 3. Détection de la règle métier : Disques -> Plaquettes obligatoires
    const texteControle = `${panne_constatee || ""} ${options_travaux || ""}`.toLowerCase()
    const disquesAVSignales = texteControle.includes("disques avant") || texteControle.includes("disques av")
    const disquesARSignales = texteControle.includes("disques arrière") || texteControle.includes("disques ar")

    const userPrompt = `Tu es un chiffreur expert après-vente automobile (20 ans de métier).
Génère la nomenclature détaillée et chiffrée en JSON STRICT (sans markdown, sans aucun texte autour) pour :
Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - Compteur : ${kilometrage || "120000"} km
Constats mécanicien : ${panne_constatee || "Remplacement batterie 12V"}
Contrôles sécurité : ${options_travaux || "Non spécifié"}

RÈGLES MÉCANIQUES ABSOLUES :
1. RÈGLE FREINAGE STRICTE : On ne change JAMAIS des disques sans remplacer les plaquettes. Si un remplacement de disques (AV ou AR) est demandé ou signalé en anomalie, tu DOIS obligatoirement ajouter le jeu de disques ET le jeu de plaquettes neuves dans "pieces_principales", avec l'opération combinée (ex: "Remplacement disques et plaquettes avant", 1.40 h) dans "main_oeuvre". En revanche, les plaquettes peuvent être remplacées seules si les disques ne sont pas usés.
2. CONSOMMABLES : Inclus systématiquement nettoyant freins, visserie neuve et recyclage dans "peripheriques".
3. GRILLE TARIFAIRE : T1=${tauxT1}€/h (entretien, freins, batterie), T2=${tauxT2}€/h (mécanique lourde), T3=${tauxT3}€/h (diag).

FORMAT JSON STRICT ATTENDU :
{
  "pieces_principales": [
    { "id": "1", "designation": "Jeu de disques de frein avant", "ref": "16 188 627 80", "quantite": 1, "prix_unitaire_ht": 110.00 },
    { "id": "2", "designation": "Jeu de plaquettes de frein avant", "ref": "16 172 834 80", "quantite": 1, "prix_unitaire_ht": 65.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Nettoyant freins et vis de centrage disques", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 8.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Remplacement disques et plaquettes de frein avant", "heures": 1.40, "taux_horaire_ht": ${tauxT1} }
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

    // Sécurité de secours avec application systématique de la règle de liaison disques/plaquettes
    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      const piecesSecours: any[] = []
      const moSecours: any[] = []

      if (disquesAVSignales) {
        piecesSecours.push({ id: "1", designation: "Jeu de disques de frein avant ventilés", ref: "16 188 627 80", quantite: 1, prix_unitaire_ht: 110.00 })
        piecesSecours.push({ id: "2", designation: "Jeu de plaquettes de frein avant", ref: "16 172 834 80", quantite: 1, prix_unitaire_ht: 65.00 })
        moSecours.push({ id: "1", operation: "Remplacement disques et plaquettes de frein avant", heures: 1.40, taux_horaire_ht: tauxT1 })
      } else {
        piecesSecours.push({ id: "1", designation: baremeTrouve ? baremeTrouve.operation : (panne_constatee || "Batterie 12V"), ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 135.00 })
        moSecours.push({ id: "1", operation: baremeTrouve ? baremeTrouve.operation : "Main-d'œuvre intervention standard", heures: baremeTrouve ? Number(baremeTrouve.temps_heures) : 0.60, taux_horaire_ht: baremeTrouve?.type_taux === 'T2' ? tauxT2 : tauxT1 })
      }

      devis = {
        pieces_principales: piecesSecours,
        peripheriques: [
          { id: "1", designation: "Fournitures d'atelier, dégraissant et recyclage", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 7.50 }
        ],
        main_oeuvre: moSecours
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
