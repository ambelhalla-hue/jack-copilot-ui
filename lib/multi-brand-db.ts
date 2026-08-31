/** Multi-brand Technical Service Bulletin (TSB) & diagnostic knowledge base */

export interface EngineCode {
  code: string
  manufacturer: string
  name: string
  family: string
}

export interface TSBEntry {
  id: string
  manufacturer: string
  dtc: string
  engineCodes: string[]
  symptom: string
  rootCause: string
  replacement: string
  timeEstimate: number
  commonParts: string[]
}

export interface DTC {
  code: string
  description: string
  manufacturer: string[]
  commonCauses: string[]
}

// Engine codes database
export const ENGINE_CODES: Record<string, EngineCode> = {
  // Stellantis (Peugeot, Citroën)
  'DV5RC': { code: 'DV5RC', manufacturer: 'Stellantis', name: 'Peugeot 1.5 BlueHDi', family: 'DV5' },
  'DV5C': { code: 'DV5C', manufacturer: 'Stellantis', name: 'Peugeot 1.5 BlueHDi', family: 'DV5' },
  'EB2DTRH': { code: 'EB2DTRH', manufacturer: 'Stellantis', name: 'Peugeot 1.2 PureTech', family: 'EB2' },
  'EW12A': { code: 'EW12A', manufacturer: 'Stellantis', name: 'Citroën 1.2 Essence', family: 'EW' },

  // VAG (Volkswagen, Audi, Skoda, Seat)
  'CRBC': { code: 'CRBC', manufacturer: 'VAG', name: 'VW 2.0 TDI', family: 'TDI' },
  'CRLB': { code: 'CRLB', manufacturer: 'VAG', name: 'VW 1.6 TDI', family: 'TDI' },
  'CZCA': { code: 'CZCA', manufacturer: 'VAG', name: 'VW 1.4 TSI', family: 'TSI' },
  'CAXA': { code: 'CAXA', manufacturer: 'VAG', name: 'Audi 2.0 TDI', family: 'TDI' },

  // Renault-Nissan
  'K9K628': { code: 'K9K628', manufacturer: 'Renault', name: 'Renault 1.5 dCi', family: 'K9K' },
  'K9K608': { code: 'K9K608', manufacturer: 'Renault', name: 'Renault 1.5 dCi', family: 'K9K' },
  'H5M674': { code: 'H5M674', manufacturer: 'Renault', name: 'Renault 1.2 TCe', family: 'H5M' },
  'M4R782': { code: 'M4R782', manufacturer: 'Renault', name: 'Renault 1.6 essence', family: 'M4R' },

  // BMW
  'N47D20': { code: 'N47D20', manufacturer: 'BMW', name: 'BMW 2.0 diesel', family: 'N47' },
  'B47D20': { code: 'B47D20', manufacturer: 'BMW', name: 'BMW 2.0 diesel Euro 6', family: 'B47' },
  'N57D30': { code: 'N57D30', manufacturer: 'BMW', name: 'BMW 3.0 diesel', family: 'N57' },
  'B57D30': { code: 'B57D30', manufacturer: 'BMW', name: 'BMW 3.0 diesel Euro 6', family: 'B57' },
}

// DTC (Diagnostic Trouble Code) database
export const DTC_DATABASE: Record<string, DTC> = {
  'P0010': { code: 'P0010', description: 'Défaut position arbre à cames', manufacturer: ['*'], commonCauses: ['Capteur position arbre', 'Chaîne distribution', 'Calculateur moteur'] },
  'P0011': { code: 'P0011', description: 'Retard arbre à cames (Admission)', manufacturer: ['*'], commonCauses: ['Chaîne distribution usée', 'Tendeur huile', 'Capteur CMP'] },
  'P0014': { code: 'P0014', description: 'Retard arbre à cames (Échappement)', manufacturer: ['*'], commonCauses: ['Chaîne distribution', 'Capteur CMP échappement', 'VVT solénoïde'] },
  'P0100': { code: 'P0100', description: 'Défaut débitmètre masse d\'air', manufacturer: ['*'], commonCauses: ['Capteur MAF encrassé', 'Fuite admission', 'Filtre à air encrassé'] },
  'P0101': { code: 'P0101', description: 'Débitmètre masse d\'air hors plage', manufacturer: ['*'], commonCauses: ['Capteur MAF en défaut', 'Fuite d\'air', 'Filtre encrassé'] },
  'P0234': { code: 'P0234', description: 'Suralimentation insuffisante', manufacturer: ['*'], commonCauses: ['Turbo endommagé', 'Fuite compresseur', 'Vanne wastegate'] },
  'P0335': { code: 'P0335', description: 'Défaut capteur PMH', manufacturer: ['*'], commonCauses: ['Capteur PMH en défaut', 'Connecteur oxydé', 'Relucteur endommagé'] },
  'P0400': { code: 'P0400', description: 'Système EGR en défaut', manufacturer: ['*'], commonCauses: ['Vanne EGR encrassée', 'Électrovanne EGR', 'Conduit encrassé'] },
  'P0504': { code: 'P0504', description: 'Défaut corrélation freinage', manufacturer: ['*'], commonCauses: ['Liquide de frein bas', 'Détecteur usure plaquettes', 'Calculateur freinage'] },
  'P0725': { code: 'P0725', description: 'Défaut capteur vitesse moteur', manufacturer: ['*'], commonCauses: ['Capteur PMH en défaut', 'Connecteur oxydé', 'Calculateur moteur'] },
  'P1000': { code: 'P1000', description: 'Diagnostic système incomplet', manufacturer: ['*'], commonCauses: ['Batterie faible', 'Connexions oxydées'] },
}

// TSB Knowledge base (simplified)
export const TSB_DATABASE: TSBEntry[] = [
  {
    id: 'peugeot-dv5-timing-chain',
    manufacturer: 'Stellantis',
    dtc: 'P0011',
    engineCodes: ['DV5RC', 'DV5C'],
    symptom: 'Bruits chaîne distribution, perte puissance',
    rootCause: 'Usure chaîne distribution, tendeur défaut',
    replacement: 'Kit chaîne distribution complet : chaîne, tendeur hydraulique, pignons',
    timeEstimate: 4.5,
    commonParts: ['Kit chaîne complète', 'Tendeur hydraulique', 'Pignons distribution', 'Joint distribution', 'Liquide vidange'],
  },
  {
    id: 'peugeot-turbo-low-pressure',
    manufacturer: 'Stellantis',
    dtc: 'P0234',
    engineCodes: ['DV5RC', 'DV5C'],
    symptom: 'Perte de puissance, turbo siffle, fumée',
    rootCause: 'Fuite compresseur, arbre turbo endommagé',
    replacement: 'Turbocompresseur complet (remplacement moteur)',
    timeEstimate: 6.0,
    commonParts: ['Turbocompresseur', 'Tuyauterie admission', 'Intercooler', 'Filtres', 'Liquide vidange'],
  },
  {
    id: 'vag-tdi-dpf-regeneration',
    manufacturer: 'VAG',
    dtc: 'P0101',
    engineCodes: ['CRBC', 'CRLB'],
    symptom: 'Voyant moteur orange, ralenti instable, fumée noire',
    rootCause: 'FAP encrassé, problème régénération, EGR encrassée',
    replacement: 'Nettoyage/Remplacement FAP, nettoyage EGR',
    timeEstimate: 3.0,
    commonParts: ['Filtre à particules', 'Électrovanne EGR', 'Sonde lambda', 'Fluide de nettoyage'],
  },
  {
    id: 'renault-k9k-dci-injector',
    manufacturer: 'Renault',
    dtc: 'P0380',
    engineCodes: ['K9K628', 'K9K608'],
    symptom: 'Démarrage difficile, fumée blanche, moteur qui cliquète',
    rootCause: 'Injecteur encrassé ou endommagé, calculateur moteur',
    replacement: 'Remplacement 4 injecteurs + vidange filtre diesel',
    timeEstimate: 3.5,
    commonParts: ['Kit 4 injecteurs', 'Filtre carburant', 'Joints injecteurs', 'Produit nettoyage injection'],
  },
  {
    id: 'bmw-n47-timing-chain',
    manufacturer: 'BMW',
    dtc: 'P0011',
    engineCodes: ['N47D20', 'B47D20'],
    symptom: 'Craquement moteur au démarrage, bruit chaîne',
    rootCause: 'Usure chaîne distribution, défaut tendeur',
    replacement: 'Chaîne distribution, tendeur, pignons',
    timeEstimate: 5.0,
    commonParts: ['Kit chaîne complète', 'Tendeur', 'Pignons', 'Huile moteur', 'Filtre huile'],
  },
]

// Brake & wear related rules
export const BRAKE_RULES = {
  discsWorn: {
    symptom: 'Disques usés',
    mustReplace: ['Disques', 'Plaquettes'],
    labor: 1.2,
    tier: 'T1'
  },
  padsWorn: {
    symptom: 'Plaquettes usées',
    mustReplace: ['Plaquettes'],
    labor: 0.8,
    tier: 'T1'
  },
  fluidAirWorn: {
    symptom: 'Liquide frein aéré',
    mustReplace: ['Liquide frein', 'Plaquettes'],
    labor: 1.0,
    tier: 'T1'
  }
}

// Tire wear levels
export const TIRE_WEAR_LEVELS = {
  good: { value: 'bon', threshold: '> 4 mm', action: null },
  caution: { value: 'usure', threshold: '3-4 mm', action: 'Inspection rapide, maintenir surveillance' },
  critical: { value: 'critique', threshold: '< 3 mm', action: 'Remplacement obligatoire' },
}

// Battery status levels
export const BATTERY_STATUS_LEVELS = {
  good: { value: 'bon', voltage: '> 12.5V', charge: '> 80%' },
  aging: { value: 'vieillissant', voltage: '12.0-12.5V', charge: '60-80%', recommendation: 'Prévoir changement 6-12 mois' },
  critical: { value: 'critique', voltage: '< 12.0V', charge: '< 60%', action: 'Remplacement immédiat' },
}

export function getManufacturerFromEngine(engineCode: string): string {
  const eng = ENGINE_CODES[engineCode]
  return eng ? eng.manufacturer : 'Unknown'
}

export function getTSBsForDTC(dtc: string, manufacturer: string): TSBEntry[] {
  return TSB_DATABASE.filter(t => t.dtc === dtc && t.manufacturer === manufacturer)
}

export function getTSBsForEngine(engineCode: string): TSBEntry[] {
  return TSB_DATABASE.filter(t => t.engineCodes.includes(engineCode))
}

export function getDTCInfo(dtc: string): DTC | null {
  return DTC_DATABASE[dtc] || null
}

export function getManufacturerRules(manufacturer: string): {
  name: string
  torqueSpecs: Record<string, number>
  timingPinInfo: Record<string, string>
  commonIssues: string[]
} {
  const rules: Record<string, any> = {
    'Stellantis': {
      name: 'Stellantis (Peugeot, Citroën)',
      torqueSpecs: {
        'Vis distribution': 50,
        'Culasse': 85,
        'Poulie vilebrequin': 120,
      },
      timingPinInfo: {
        'piston1': 'PMH culasse, aligner traits distribution',
        'tool': 'Outil calage distribution Peugeot'
      },
      commonIssues: ['Chaîne distribution usée', 'Tendeur défaut', 'Capteur MAF encrassé']
    },
    'VAG': {
      name: 'VAG (VW, Audi, Skoda)',
      torqueSpecs: {
        'Culasse': 90,
        'Poulie vilebrequin': 150,
        'Couronne volant': 60,
      },
      timingPinInfo: {
        'piston1': 'PMH culasse, utiliser outil calage VAG',
        'tool': 'Outil T40060 ou équivalent'
      },
      commonIssues: ['FAP encrassé', 'EGR encrassée', 'Injecteurs encrassés']
    },
    'Renault': {
      name: 'Renault-Nissan',
      torqueSpecs: {
        'Culasse': 75,
        'Poulie vilebrequin': 110,
        'Support moteur': 55,
      },
      timingPinInfo: {
        'piston1': 'PMH culasse, repères alignés',
        'tool': 'Outil calage Renault'
      },
      commonIssues: ['Injecteurs encrassés', 'Capteur PMH défaut', 'Tendeur hydraulique']
    },
    'BMW': {
      name: 'BMW',
      torqueSpecs: {
        'Culasse': 100,
        'Poulie vilebrequin': 160,
        'Support moteur': 65,
      },
      timingPinInfo: {
        'piston1': 'PMH, utiliser outil calage BMW spécifique',
        'tool': 'Outil T40001 ou équivalent'
      },
      commonIssues: ['Chaîne distribution usée', 'Tendeur de chaîne', 'Capteurs lambda']
    }
  }
  
  return rules[manufacturer] || {
    name: manufacturer,
    torqueSpecs: {},
    timingPinInfo: {},
    commonIssues: []
  }
}
