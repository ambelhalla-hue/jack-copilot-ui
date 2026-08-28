import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })

    const body = await req.json()
    const { vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const userPrompt = `Tu es un chiffreur expert après-vente automobile.
Génère une simulation de devis ultra-détaillée et exhaustive sous forme d'un objet JSON STRICT (sans markdown, sans aucun texte autour) pour l'intervention suivante :

Véhicule : ${vehicle || "Peugeot 308 II"} (${immat || "AA-123-BB"}) - Compteur : ${kilometrage || "120000"} km
Constats / Panne déclarée : ${panne_constatee || "Remplacement batterie 12V et révision"}
Contrôles atelier (usures signalées) : ${options_travaux || "Batterie faible, freinage à contrôler"}

RÈGLES STRICTES DE CHIFFRAGE :
1. "pieces_principales" : Découpe chaque pièce requise avec un prix unitaire HT réaliste (prix_unitaire_ht) et une référence OE réaliste. Inclus les organes de la panne ET chaque point noté "urgent" ou "a_prevoir".
2. "peripheriques" : Inclus les éléments secondaires obligatoires (pochette de joints, visserie neuve, dégraissant, nettoyant freins, fluides/huiles normées, recyclage).
3. "main_oeuvre" : Découpe les opérations en centièmes d'heures (heures) avec un taux horaire HT (taux_horaire_ht : 85.00).

FORMAT JSON STRICT ATTENDU :
{
  "pieces_principales": [
    { "id": "1", "designation": "Batterie 12V 70Ah 720A EFB / AGM", "ref": "16 824 512 80", "quantite": 1, "prix_unitaire_ht": 135.00 },
    { "id": "2", "designation": "Jeu de plaquettes de frein avant", "ref": "16 172 834 80", "quantite": 1, "prix_unitaire_ht": 68.00 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Nettoyant freins & dégraissant haute pression", "ref": "CONS-01", "quantite": 1, "prix_unitaire_ht": 7.50 },
    { "id": "2", "designation": "Traitement & recyclage batterie usagée", "ref": "ECO-BAT", "quantite": 1, "prix_unitaire_ht": 4.50 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Remplacement batterie 12V et réinitialisation BMS", "heures": 0.40, "taux_horaire_ht": 85.00 },
    { "id": "2", "operation": "Remplacement plaquettes de frein avant", "heures": 0.80, "taux_horaire_ht": 85.00 }
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
      console.error("Erreur parsing IA devis", e)
    }

    // Sécurité de secours : simulation par défaut immédiate si l'IA tarde ou échoue
    if (!devis || !Array.isArray(devis.pieces_principales) || devis.pieces_principales.length === 0) {
      devis = {
        pieces_principales: [
          { id: "1", designation: panne_constatee && panne_constatee.length > 3 ? panne_constatee : "Batterie 12V Stop&Start", ref: "16 824 512 80", quantite: 1, prix_unitaire_ht: 135.00 },
          { id: "2", designation: "Jeu de plaquettes de frein avant", ref: "16 172 834 80", quantite: 1, prix_unitaire_ht: 65.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Fournitures d'atelier & nettoyant freins", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 8.50 },
          { id: "2", designation: "Traitement des déchets et recyclage", ref: "DECH-02", quantite: 1, prix_unitaire_ht: 4.50 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Dépose / Repose composant principal et paramétrage", "heures": 0.60, "taux_horaire_ht": 85.00 },
          { id: "2", operation: "Contrôle circuit de charge et mémoire calculateur", "heures": 0.30, "taux_horaire_ht": 85.00 }
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
          totalTTC_circulaire: totalTTC * 0.78
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur calcul devis." }, { status: 500 })
  }
}
