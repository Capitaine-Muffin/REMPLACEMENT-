import type { ActeCatalogue, LettreCle } from './types'

/**
 * Valeurs de départ.
 *
 * Confirmées par une sage-femme en exercice :
 * - rééducation périnéale SF 7,5 ;
 * - visites à domicile : SF 16,5 pour les deux premières (grossesse simple),
 *   SF 12 pour les suivantes dans les douze premiers jours, SF 22,6 pour les
 *   deux premières d'une grossesse gémellaire ;
 * - indemnité de déplacement MD : 10 €.
 *
 * Relevées en août 2026 et NON confirmées, donc marquées « à vérifier » dans
 * l'application : consultation, MSF, majorations dimanche/férié et de nuit,
 * indemnités kilométriques.
 *
 * Lettres clés SF et SP portées à 3,20 € au 1er janvier 2025 (avenant 7 à la
 * convention nationale des sages-femmes).
 *
 * TOUT reste modifiable, et surtout : les actes cotés au coefficient (SF 7,5,
 * SF 12...) se recalculent seuls dès que la valeur de la lettre clé change.
 * C'est le seul chiffre à corriger lors d'une revalorisation.
 *
 * Ces valeurs restent à vérifier avec la NGAP en vigueur avant de facturer.
 */
export const AVERTISSEMENT_TARIFS =
  'Les lignes marquées « à vérifier » viennent de mes recherches, pas de toi : ' +
  'contrôle-les avec la NGAP en vigueur avant de facturer.'

/**
 * Marque portée par les valeurs issues de recherches et non confirmées par une
 * sage-femme. L'application les signale pour qu'on ne facture jamais sur la
 * foi d'un chiffre que personne n'a validé.
 */
export const A_VERIFIER = 'À vérifier'

export const aVerifier = (note?: string) => Boolean(note?.startsWith(A_VERIFIER))

export const LETTRE_SF = 'lc-sf'
export const LETTRE_SP = 'lc-sp'

/** Lettres clés livrées par défaut. */
export function lettresClesParDefaut(): LettreCle[] {
  return [
    {
      id: LETTRE_SF,
      code: 'SF',
      libelle: 'Actes obstétricaux de la sage-femme',
      valeur: 3.2,
    },
    {
      id: LETTRE_SP,
      code: 'SP',
      libelle: 'Actes de prévention et séances en groupe',
      valeur: 3.2,
    },
  ]
}

interface Defaut {
  code: string
  libelle: string
  categorie: ActeCatalogue['categorie']
  /** Cotation au coefficient : [lettre clé, coefficient]. */
  cotation?: [string, number]
  /** Montant fixe, pour ce qui n'est pas coté au coefficient. */
  forfait?: number
  unite?: 'acte' | 'km'
  favori?: boolean
  note?: string
}

const DEFAUTS: Defaut[] = [
  // --- Actes cotés au coefficient ---------------------------------------
  {
    code: 'SF', libelle: 'Rééducation périnéale', categorie: 'acte',
    cotation: [LETTRE_SF, 7.5], favori: true,
  },
  {
    code: 'SF', libelle: 'Séance de préparation à la naissance (individuelle)',
    categorie: 'acte', cotation: [LETTRE_SF, 12], favori: true,
  },
  {
    code: 'SP', libelle: 'Séance postnatale en groupe (4 à 6 personnes)',
    categorie: 'acte', cotation: [LETTRE_SP, 6],
  },

  // --- Visites à domicile (sortie précoce / PRADO) ------------------------
  {
    code: 'SF', libelle: 'Visite à domicile — 2 premières visites (grossesse simple)',
    categorie: 'acte', cotation: [LETTRE_SF, 16.5], favori: true,
  },
  {
    code: 'SF', libelle: 'Visite à domicile — visites suivantes (dans les 12 premiers jours)',
    categorie: 'acte', cotation: [LETTRE_SF, 12], favori: true,
  },
  {
    code: 'SF', libelle: 'Visite à domicile — 2 premières visites (grossesse gémellaire)',
    categorie: 'acte', cotation: [LETTRE_SF, 22.6],
  },

  // Cotations nues, pour coter librement ce qui n'est pas dans la liste.
  {
    code: 'SF', libelle: 'SF au coefficient libre', categorie: 'acte',
    cotation: [LETTRE_SF, 1], note: 'Mets le coefficient que tu veux',
  },
  {
    code: 'SP', libelle: 'SP au coefficient libre', categorie: 'acte',
    cotation: [LETTRE_SP, 1], note: 'Mets le coefficient que tu veux',
  },

  // --- Actes à montant fixe ---------------------------------------------
  {
    code: 'C', libelle: 'Consultation (majoration MSF comprise)', categorie: 'acte',
    forfait: 26.5, favori: true, note: 'À vérifier',
  },
  {
    code: 'MSF', libelle: 'Majoration sage-femme (MSF)', categorie: 'majoration',
    forfait: 3.5, note: 'À vérifier',
  },

  // --- Majorations -------------------------------------------------------
  {
    code: 'MDD', libelle: 'Majoration dimanche et jour férié', categorie: 'majoration',
    forfait: 22.6, favori: true, note: 'À vérifier',
  },
  {
    code: 'N', libelle: "Majoration d'urgence de nuit (20 h - 0 h et 6 h - 8 h)",
    categorie: 'majoration', forfait: 35, note: 'À vérifier',
  },
  {
    code: 'MM', libelle: "Majoration d'urgence de nuit (0 h - 6 h)",
    categorie: 'majoration', forfait: 40, note: 'À vérifier',
  },

  // --- Indemnités de déplacement -----------------------------------------
  {
    code: 'MD', libelle: 'Indemnité de déplacement', categorie: 'id',
    forfait: 10, favori: true,
  },

  // --- Indemnités kilométriques ------------------------------------------
  {
    code: 'IK', libelle: 'IK plaine', categorie: 'ik', forfait: 0.61,
    unite: 'km', favori: true, note: 'À vérifier — abattement de 4 km aller-retour',
  },
  {
    code: 'IKM', libelle: 'IK montagne', categorie: 'ik', forfait: 0.91,
    unite: 'km', note: 'À vérifier — abattement de 2 km aller-retour',
  },
]

/** Construit le catalogue livré par défaut à la première ouverture. */
export function catalogueParDefaut(): ActeCatalogue[] {
  return DEFAUTS.map((d, i) => ({
    id: `def-${i + 1}`,
    code: d.code,
    libelle: d.libelle,
    categorie: d.categorie,
    tarification: d.cotation ? 'coefficient' : 'forfait',
    lettreCleId: d.cotation?.[0],
    coefficient: d.cotation?.[1],
    tarif: d.forfait ?? 0,
    unite: d.unite ?? 'acte',
    favori: d.favori ?? false,
    archive: false,
    personnalise: false,
    note: d.note,
  }))
}
