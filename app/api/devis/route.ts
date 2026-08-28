import { NextResponse } from "next/server"

export const maxDuration = 60

interface QuotePart {
  id: string
  designation: string
  ref: string
  quantite: number
  prix_unitaire_ht: number
}

interface QuoteLabor {
  id: string
  operation: string
  heures: number
  taux_horaire_ht: number
}

interface CompleteQuote {
  constat_court: string
  pieces_principales: QuotePart[]
  peripheriques: QuotePart[]
  main_oeuvre: QuoteLabor[]
  totaux: {
    totalPiecesHT: number
    totalFournituresHT: number
    totalMoHT: number
    totalHT: number
    tva: number
    totalTTC: number
    totalTTC_circulaire: number
  }
}

async function updateDossierReliably(
  supabaseUrl: string,
  supabaseAnonKey: string,
  dossierId: string,
  updateData: Record<string, any>
): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `${supabaseUrl}/rest/v1/dossiers_atelier?id=eq.${dossierId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(updateData),
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)
    return res.ok
  } catch (err) {
    console.error("Erreur mise à jour Supabase :", err)
    return false
  }
}

function generateExhaustiveQuotePrompt(
  vehicle: string,
  immat: string,
  kilometrage: string,
  panne_constatee: string,
  options_travaux: string,
  tauxT1: number,
  tauxT2: number
): string {
  return `Tu es un expert devis automobile. Génère une soumission EXHAUSTIVE en JSON STRICT.

CONTEXTE:
- Véhicule: ${vehicle || "Non spécifié"} (${immat || "AA-000-AA"}) - ${kilometrage || "0"} km
- Panne/Constat: ${panne_constatee || "Inspection générale"}
- Options: ${options_travaux || "Aucune"}

RÈGLES EXHAUSTIVES :
1. "pieces_principales": au MINIMUM 3-5 pièces (pas juste 1 pièce, ajouter les consommables intrinsèques).
   Ex: Batterie → ajouter bornes, serre-câbles, pâte contact.
   Ex: Amortisseurs → ajouter coupelles, silent-blocs, clips.

2. "peripheriques": TOUJOURS au minimum:
   - Visserie neuve (boulons, rondelles, écrous spécifiques)
   - Fluides/consommables (huile, liquide frein, graisse, spray WD40)
   - Recyclage/traitement (pneus usés, batterie, pièces usées)
   - Papiers/labels (étiquettes conformité, rapports)

3. "main_oeuvre": 
   - Démontage/montage/réglage: durée réaliste
   - T1: ${tauxT1}€/h (mécanique simple), T2: ${tauxT2}€/h (travail complexe)
   - Ajouter "contrôle final + essai routier": +0.25h

4. Priorité aux pièces ORIGINALES ou équivalent OEM (références réalistes).

FORMAT JSON ATTENDU (STRICT, pas de markdown):
{
  "constat_court": "À remplacer: [LISTE COURTE des 3-5 pièces principales + tests réalisés]",
  "pieces_principales": [
    { "id": "1", "designation": "Batterie 12V 70Ah Start-Stop", "ref": "BATTERIE-TEST-12V", "quantite": 1, "prix_unitaire_ht": 185.00 },
    { "id": "2", "designation": "Bornes batterie cuivre + cache", "ref": "BORNES-CUIVRE", "quantite": 1, "prix_unitaire_ht": 12.50 },
    { "id": "3", "designation": "Serre-câbles batterie inox", "ref": "SERRE-CABLE", "quantite": 1, "prix_unitaire_ht": 8.00 },
    { "id": "4", "designation": "Pâte graisse contact électrique", "ref": "PATE-CONTACT", "quantite": 1, "prix_unitaire_ht": 5.50 }
  ],
  "peripheriques": [
    { "id": "1", "designation": "Viserie neuve + rondelles + écrous", "ref": "KIT-VISSERIE", "quantite": 1, "prix_unitaire_ht": 15.00 },
    { "id": "2", "designation": "Huile moteur 5L 5W-30 (vidange)", "ref": "HUILE-5L", "quantite": 1, "prix_unitaire_ht": 28.00 },
    { "id": "3", "designation": "Filtre huile moteur", "ref": "FILTRE-HUILE", "quantite": 1, "prix_unitaire_ht": 12.00 },
    { "id": "4", "designation": "Ancien batterie & pièces usées (recyclage)", "ref": "RECYCL-STD", "quantite": 1, "prix_unitaire_ht": 0.00 }
  ],
  "main_oeuvre": [
    { "id": "1", "operation": "Diagnostic électrique complet + mesures", "heures": 0.60, "taux_horaire_ht": ${tauxT1} },
    { "id": "2", "operation": "Dépose batterie usée & protection circuit", "heures": 0.50, "taux_horaire_ht": ${tauxT1} },
    { "id": "3", "operation": "Pose batterie neuve + serrage + essai démarrage", "heures": 0.75, "taux_horaire_ht": ${tauxT1} },
    { "id": "4", "operation": "Nettoyage bornes + graissage + essai démarrage prolongé", "heures": 0.50, "taux_horaire_ht": ${tauxT1} },
    { "id": "5", "operation": "Contrôle final & essai routier", "heures": 0.25, "taux_horaire_ht": ${tauxT1} }
  ]
}

IMPÉRATIF: Fournir un JSON valide, sans texte avant/après. Minimum 3-4 pièces principales, minimum 3-4 périphériques, minimum 4-5 opérations main-d'œuvre.`
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante." }, { status: 500 })
    }

    const body = await req.json()
    const { dossierId, vehicle, immat, kilometrage, panne_constatee, options_travaux } = body

    const tauxT1 = 75.00
    const tauxT2 = 95.00

    const userPrompt = generateExhaustiveQuotePrompt(
      vehicle,
      immat,
      kilometrage,
      panne_constatee,
      options_travaux,
      tauxT1,
      tauxT2
    )

    let devis: CompleteQuote | null = null
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              maxOutputTokens: 2000,
              temperature: 0.6
            }
          }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (rawText) {
        try {
          devis = JSON.parse(rawText)
        } catch (parseErr) {
          console.error("Erreur parsing JSON devis :", parseErr)
          devis = null
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.warn("Timeout API Gemini, utilisation fallback")
      } else {
        throw fetchError
      }
    }

    if (
      !devis ||
      !Array.isArray(devis.pieces_principales) ||
      devis.pieces_principales.length === 0
    ) {
      devis = {
        constat_court: panne_constatee || "Intervention atelier standard",
        pieces_principales: [
          { id: "1", designation: panne_constatee || "Organe principal", ref: "OEM-STD", quantite: 1, prix_unitaire_ht: 120.00 },
          { id: "2", designation: "Pièces secondaires & adaptateurs", ref: "OEM-ACC", quantite: 1, prix_unitaire_ht: 35.00 }
        ],
        peripheriques: [
          { id: "1", designation: "Visserie, fluides & consommables", ref: "CONS-01", quantite: 1, prix_unitaire_ht: 18.50 },
          { id: "2", designation: "Nettoyage & recyclage matières usées", ref: "RECYCL", quantite: 1, prix_unitaire_ht: 5.00 }
        ],
        main_oeuvre: [
          { id: "1", operation: "Diagnostic & démontage", heures: 1.0, taux_horaire_ht: tauxT1 },
          { id: "2", operation: "Montage & réglage", heures: 1.0, taux_horaire_ht: tauxT1 },
          { id: "3", operation: "Contrôle final & essai", heures: 0.5, taux_horaire_ht: tauxT1 }
        ],
        totaux: {
          totalPiecesHT: 0,
          totalFournituresHT: 0,
          totalMoHT: 0,
          totalHT: 0,
          tva: 0,
          totalTTC: 0,
          totalTTC_circulaire: 0
        }
      }
    }

    const totalPiecesHT = (devis.pieces_principales || []).reduce(
      (acc, p) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)),
      0
    )
    const totalFournituresHT = (devis.peripheriques || []).reduce(
      (acc, p) => acc + (Number(p.prix_unitaire_ht || 0) * Number(p.quantite || 1)),
      0
    )
    const totalMoHT = (devis.main_oeuvre || []).reduce(
      (acc, m) => acc + (Number(m.heures || 0) * Number(m.taux_horaire_ht || tauxT1)),
      0
    )

    const totalHT = totalPiecesHT + totalFournituresHT + totalMoHT
    const tva = totalHT * 0.20
    const totalTTC = totalHT + tva

    const devisComplet: CompleteQuote = {
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

    const constatFinal = devis.constat_court || panne_constatee

    if (supabaseUrl && supabaseAnonKey && dossierId) {
      updateDossierReliably(supabaseUrl, supabaseAnonKey, dossierId, {
        statut: "devis_genere",
        constats_technicien: constatFinal,
        devis_ia: devisComplet
      }).catch(err => console.error("Erreur Supabase async :", err))
    }

    return NextResponse.json({
      constat_court: constatFinal,
      devis: devisComplet
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur calcul devis." },
      { status: 500 }
    )
  }
}
