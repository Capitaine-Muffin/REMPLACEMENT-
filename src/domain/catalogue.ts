import type { ActeCatalogue, LettreCle } from './types'

/**
 * Catalogue livré à la première ouverture.
 *
 * Chaque montant porte son origine (`source`), affichée avec l'acte. Aucun
 * chiffre n'est déduit, arrondi ou reconstitué : soit il vient d'une
 * sage-femme en exercice, soit d'une source citée, soit il n'y est pas.
 *
 * Les cotations au coefficient (SF 7,5, SF 16,5...) ne dépendent pas d'un
 * tarif figé : elles suivent la valeur de la lettre clé, réglée dans l'écran
 * Tarifs.
 */
/**
 * Un acte dont le montant n'a encore été confirmé par personne. L'application
 * ne le signale plus d'elle-même, mais l'information sert toujours : à la mise
 * à jour, un acte vérifié garde la valeur que l'utilisatrice lui a donnée.
 */
export const aVerifier = (acte: Pick<ActeCatalogue, 'verifie'>) => !acte.verifie

const CONFIRME = 'Confirmé par une sage-femme en exercice'
const AVENANT_7 = 'Avenant 7 à la convention nationale, valeur au 1er janvier 2025'

export const LETTRE_SF = 'lc-sf'
export const LETTRE_SP = 'lc-sp'

/** Lettres clés livrées par défaut. */
export function lettresClesParDefaut(): LettreCle[] {
  return [
    { id: LETTRE_SF, code: 'SF', libelle: 'Actes obstétricaux de la sage-femme', valeur: 3.2 },
    { id: LETTRE_SP, code: 'SP', libelle: 'Actes de prévention et séances en groupe', valeur: 3.2 },
  ]
}

interface Defaut {
  /**
   * Identifiant stable, indépendant de l'ordre de la liste : c'est lui qui
   * permet de retrouver un acte d'une version à l'autre et de conserver ce que
   * l'utilisatrice y a corrigé.
   */
  id: string
  code: string
  libelle: string
  categorie: ActeCatalogue['categorie']
  /** Cotation au coefficient : [lettre clé, coefficient]. */
  cotation?: [string, number]
  /** Montant fixe, pour ce qui n'est pas coté au coefficient. */
  forfait?: number
  /** D'où vient ce montant. Obligatoire : rien n'entre ici sans provenance. */
  source: string
  /** true uniquement si une sage-femme a confirmé la valeur. */
  verifie?: boolean
  unite?: 'acte' | 'km'
  favori?: boolean
  note?: string
}

const DEFAUTS: Defaut[] = [
  // --- Cotations confirmées par une sage-femme ---------------------------
  {
    id: 'reeducation-perineale',
    code: 'SF', libelle: 'Rééducation périnéale', categorie: 'acte',
    cotation: [LETTRE_SF, 7.5], source: CONFIRME, verifie: true, favori: true,
  },
  {
    id: 'vad-2-premieres',
    code: 'SF', libelle: 'Visite à domicile — 2 premières visites (grossesse simple)',
    categorie: 'acte', cotation: [LETTRE_SF, 16.5],
    source: CONFIRME, verifie: true, favori: true,
  },
  {
    id: 'vad-suivantes',
    code: 'SF', libelle: 'Visite à domicile — visites suivantes (dans les 12 premiers jours)',
    categorie: 'acte', cotation: [LETTRE_SF, 12],
    source: CONFIRME, verifie: true, favori: true,
  },
  {
    id: 'vad-2-premieres-gemellaire',
    code: 'SF', libelle: 'Visite à domicile — 2 premières visites (grossesse gémellaire)',
    categorie: 'acte', cotation: [LETTRE_SF, 22.6], source: CONFIRME, verifie: true,
  },
  {
    id: 'md-deplacement',
    code: 'MD', libelle: 'Indemnité de déplacement', categorie: 'id',
    forfait: 10, source: CONFIRME, verifie: true, favori: true,
  },

  // --- Cotations trouvées en ligne, non confirmées ------------------------
  {
    id: 'pnp-individuelle',
    code: 'SF', libelle: 'Séance de préparation à la naissance (individuelle)',
    categorie: 'acte', cotation: [LETTRE_SF, 12],
    source: 'Recherche web (ONSSF, Maieuticapp) — coefficient SF 12', favori: true,
  },
  {
    id: 'seance-postnatale-groupe',
    code: 'SP', libelle: 'Séance postnatale en groupe (4 à 6 personnes)',
    categorie: 'acte', cotation: [LETTRE_SP, 6],
    source: 'Recherche web (ONSSF) — coefficient SP 6',
  },
  {
    id: 'consultation-msf',
    code: 'C + MSF', libelle: 'Consultation (majoration MSF comprise)', categorie: 'acte',
    forfait: 26.5, source: 'Recherche web (ameli.fr, avenant 7)', favori: true,
  },
  {
    id: 'msf',
    code: 'MSF', libelle: 'Majoration sage-femme (MSF)', categorie: 'acte',
    forfait: 3.5, source: 'Recherche web (ameli.fr, avenant 7)',
    // Rangée avec les actes et non les majorations : la MSF fait partie des
    // honoraires. La catégorie « majorations » ne sert ici qu'au férié, au
    // dimanche et à la nuit, que le contrat peut sortir de l'assiette.
  },

  // --- Actes CCAM ---------------------------------------------------------
  // Les codes sont stables d'une source à l'autre. Les montants, non : quand
  // les sources divergent, les deux valeurs sont écrites plutôt qu'arbitrées.
  {
    id: 'ccam-frottis',
    code: 'JKHD001', libelle: 'Frottis — prélèvement cervico-vaginal', categorie: 'acte',
    forfait: 12.46, source: 'Recherche web (aideaucodage.fr)', favori: true,
    note: 'Se cumule avec la consultation : compte une ligne C + MSF en plus',
  },
  {
    id: 'ccam-pose-diu',
    code: 'JKLD001', libelle: "Pose d'un dispositif intra-utérin (DIU)", categorie: 'acte',
    forfait: 38.4, favori: true,
    source: 'Recherche web — sources divergentes : 38,40 € ou 62,70 €',
  },
  {
    id: 'ccam-changement-diu',
    code: 'JKKD001', libelle: "Changement d'un dispositif intra-utérin (DIU)",
    categorie: 'acte', forfait: 38.4, source: 'Recherche web (lemedecin.fr)',
  },
  {
    id: 'ccam-ablation-diu',
    code: 'JKGD001',
    libelle: "Ablation d'un DIU par matériel de préhension, par voie vaginale",
    categorie: 'acte', forfait: 0,
    source: "Montant introuvable : à renseigner. Seul le code est vérifié",
  },
  {
    id: 'ccam-pose-implant',
    code: 'QZLA004', libelle: "Pose d'un implant contraceptif (sous-cutané)",
    categorie: 'acte', forfait: 17.99, favori: true,
    source: 'Recherche web — sources divergentes : 17,99 € ou 14,47 €',
  },
  {
    id: 'ccam-retrait-implant',
    code: 'QZGA002', libelle: "Retrait ou changement d'un implant contraceptif",
    categorie: 'acte', forfait: 41.8, favori: true,
    source: 'Recherche web (Walter Learning)',
  },

  // --- Majorations --------------------------------------------------------
  {
    id: 'majoration-dimanche-ferie',
    code: 'MDD', libelle: 'Majoration dimanche et jour férié', categorie: 'majoration',
    forfait: 22.6, favori: true, source: 'Recherche web (ameli.fr, avenant 7)',
  },
  {
    id: 'majoration-nuit',
    code: 'N', libelle: "Majoration d'urgence de nuit (20 h - 0 h et 6 h - 8 h)",
    categorie: 'majoration', forfait: 35, source: 'Recherche web (NGAP article 14)',
  },
  {
    id: 'majoration-nuit-profonde',
    code: 'MM', libelle: "Majoration d'urgence de nuit (0 h - 6 h)",
    categorie: 'majoration', forfait: 40, source: 'Recherche web (NGAP article 14)',
  },

  // --- Indemnités kilométriques -------------------------------------------
  {
    id: 'ik-plaine',
    code: 'IK', libelle: 'IK plaine', categorie: 'ik', forfait: 0.61, unite: 'km',
    favori: true, source: AVENANT_7, note: 'Abattement de 4 km aller-retour',
  },
  {
    id: 'ik-montagne',
    code: 'IKM', libelle: 'IK montagne', categorie: 'ik', forfait: 0.91, unite: 'km',
    source: AVENANT_7, note: 'Abattement de 2 km aller-retour',
  },

  // --- Cotations nues, pour coter ce qui n'est pas dans la liste ----------
  {
    id: 'sf-libre',
    code: 'SF', libelle: 'SF au coefficient libre', categorie: 'acte',
    cotation: [LETTRE_SF, 1], verifie: true,
    source: 'Cotation vide : mets le coefficient que tu veux',
  },
  {
    id: 'sp-libre',
    code: 'SP', libelle: 'SP au coefficient libre', categorie: 'acte',
    cotation: [LETTRE_SP, 1], verifie: true,
    source: 'Cotation vide : mets le coefficient que tu veux',
  },
]

/** Construit le catalogue livré par défaut à la première ouverture. */
export function catalogueParDefaut(): ActeCatalogue[] {
  return DEFAUTS.map((d) => ({
    id: `def-${d.id}`,
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
    verifie: d.verifie ?? false,
    source: d.source,
    note: d.note,
  }))
}
