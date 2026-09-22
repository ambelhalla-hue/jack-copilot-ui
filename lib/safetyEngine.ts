// lib/safetyEngine.ts

export interface SafetyRuleResult {
  blocked: boolean
  warnings: string[]
  mandatoryParts: { designation: string; ref: string; quantite: number }[]
  mandatoryLaborHours: number
}

/**
 * Moteur déterministe d'audit de sécurité atelier
 * S'exécute indépendamment de l'IA pour garantir la conformité légale et technique.
 */
export function auditInterventionSafety(
  detectedPieces: string[],
  userNotes: string = ""
): SafetyRuleResult {
  const result: SafetyRuleResult = {
    blocked: false,
    warnings: [],
    mandatoryParts: [],
    mandatoryLaborHours: 0,
  }

  const context = (detectedPieces.join(" ") + " " + userNotes).toLowerCase()

  // RÈGLE 1 : Disques de frein -> Plaquettes neuves obligatoires
  const hasDisques = context.includes("disque") || context.includes("disques")
  const hasPlaquettes = context.includes("plaquette") || context.includes("plaquettes")

  if (hasDisques && !hasPlaquettes) {
    result.warnings.push(
      "RÈGLE LÉGALE : Remplacement de disques détecté sans plaquettes. Le montage de plaquettes usagées sur disques neufs est interdit (obligation de résultat)."
    )
    result.mandatoryParts.push({
      designation: "Jeu de plaquettes de frein neuves (obligatoire)",
      ref: "SEC-PLAQ-AUTO",
      quantite: 1,
    })
    result.mandatoryLaborHours += 0.4 // Complément barème de pose
  }

  // RÈGLE 2 : Distribution -> Pompe à eau + Vis Damper à usage unique
  const hasDistri = context.includes("distribution") || context.includes("courroie de distri")
  if (hasDistri) {
    if (!context.includes("pompe à eau") && !context.includes("pompe a eau")) {
      result.warnings.push(
        "PRÉCONISATION CRITIQUE : Remplacement de distribution sans pompe à eau. Risque majeur de grippage et casse moteur."
      )
      result.mandatoryParts.push({
        designation: "Pompe à eau + joint torique",
        ref: "SEC-PAE-AUTO",
        quantite: 1,
      })
    }
    result.mandatoryParts.push({
      designation: "Vis de poulie damper neuve (serrage angulaire à usage unique)",
      ref: "SEC-DAMPER-BOLT",
      quantite: 1,
    })
  }

  // RÈGLE 3 : Remplacement d'injecteur -> Bague pare-feu & Tuyau HP
  const hasInjecteur = context.includes("injecteur")
  if (hasInjecteur && !context.includes("joint") && !context.includes("pare-feu")) {
    result.warnings.push(
      "SÉCURITÉ FUITE : Remplacement d'injecteur détecté. Le remplacement de la bague pare-feu en cuivre et de la bride est obligatoire."
    )
    result.mandatoryParts.push({
      designation: "Kit joint pare-feu cuivre + bague de centrage injecteur",
      ref: "SEC-JOINT-INJ",
      quantite: 1,
    })
  }

  return result
}
