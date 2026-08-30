import type { ActeCatalogue, LettreCle } from './types'

/**
 * Valeurs de départ, relevées en août 2026 auprès des sources ci-dessous.
 *
 * - Lettres clés SF et SP portées à 3,20 € au 1er janvier 2025 (avenant 7 à la
 *   convention nationale des sages-femmes) — UNSSF.
 * - Majoration sage-femme MSF 3,50 €, consultation à 26,50 €, majoration de
 *   déplacement dimanche et jours fériés MDD 22,60 €, IK plaine 0,61 €,
 *   IK montagne 0,91 € — ameli.fr, avenant 7.
 * - Majorations d'urgence : 35 € (20 h - 0 h et 6 h - 8 h), 40 € (0 h - 6 h).
 * - Indemnité forfaitaire de déplacement : 2,75 €.
 *
 * TOUT reste modifiable, et surtout : les actes cotés au coefficient (SF 7,5,
 * SF 12...) se recalculent seuls dès que la valeur de la lettre clé change.
 * C'est le seul chiffre à corriger lors d'une revalorisation.
 *
 * Ces valeurs restent à vérifier avec la NGAP en vigueur avant de facturer.
 */
export const AVERTISSEMENT_TARIFS =
  'Valeurs relevées en août 2026 : vérifie-les avec la NGAP en vigueur, ' +
  'puis ajuste ce qu\'il faut ici.'

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
  {
    code: 'SF', libelle: 'Surveillance à domicile mère et enfant — 1er forfait',
    categorie: 'acte', cotation: [LETTRE_SF, 23],
    note: 'Deux premiers forfaits journaliers, J0 à J12',
  },
  {
    code: 'SF', libelle: 'Surveillance à domicile mère et enfant — forfait suivant',
    categorie: 'acte', cotation: [LETTRE_SF, 17],
  },
  {
    code: 'SF', libelle: 'Surveillance à domicile mère seule — 1er forfait',
    categorie: 'acte', cotation: [LETTRE_SF, 16.5],
  },
  {
    code: 'SF', libelle: 'Surveillance à domicile mère seule — forfait suivant',
    categorie: 'acte', cotation: [LETTRE_SF, 12],
  },

  // Cotations nues, pour coter librement ce qui n'est pas dans la liste.
  { code: 'SF', libelle: 'SF au coefficient libre', categorie: 'acte', cotation: [LETTRE_SF, 1], note: 'Mets le coefficient que tu veux' },
  { code: 'SP', libelle: 'SP au coefficient libre', categorie: 'acte', cotation: [LETTRE_SP, 1], note: 'Mets le coefficient que tu veux' },

  // --- Actes à montant fixe ---------------------------------------------
  {
    code: 'C', libelle: 'Consultation (majoration MSF comprise)', categorie: 'acte',
    forfait: 26.5, favori: true,
  },
  { code: 'MSF', libelle: 'Majoration sage-femme (MSF)', categorie: 'majoration', forfait: 3.5 },

  // --- Majorations -------------------------------------------------------
  {
    code: 'MDD', libelle: 'Majoration de déplacement dimanche et jour férié',
    categorie: 'majoration', forfait: 22.6, favori: true,
  },
  {
    code: 'N', libelle: "Majoration d'urgence de nuit (20 h - 0 h et 6 h - 8 h)",
    categorie: 'majoration', forfait: 35, favori: true,
  },
  {
    code: 'MM', libelle: "Majoration d'urgence de nuit (0 h - 6 h)",
    categorie: 'majoration', forfait: 40,
  },

  // --- Indemnités de déplacement -----------------------------------------
  {
    code: 'IFD', libelle: 'Indemnité forfaitaire de déplacement',
    categorie: 'id', forfait: 2.75, favori: true,
  },

  // --- Indemnités kilométriques ------------------------------------------
  {
    code: 'IK', libelle: 'IK plaine', categorie: 'ik', forfait: 0.61,
    unite: 'km', favori: true, note: 'Abattement de 4 km aller-retour',
  },
  {
    code: 'IKM', libelle: 'IK montagne', categorie: 'ik', forfait: 0.91,
    unite: 'km', note: 'Abattement de 2 km aller-retour',
  },
  { code: 'IKS', libelle: 'IK à pied ou à ski', categorie: 'ik', forfait: 4.5, unite: 'km' },
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
