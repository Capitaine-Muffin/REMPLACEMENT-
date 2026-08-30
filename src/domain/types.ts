/**
 * Modèle de données de l'application.
 *
 * Principe RGPD : on ne stocke AUCUNE donnée de santé ni identité patiente.
 * Une journée de travail = un nombre d'actes + leurs cotations + les indemnités.
 *
 * Le champ libre "notes" ne fait pas exception : il est réservé à
 * l'organisation (ex : "cabinet fermé l'après-midi"). Y inscrire une donnée
 * médicale ou identifiante est interdit, et l'anonymisation incombe au
 * professionnel de santé qui renseigne l'application.
 */

/** Nature d'une ligne de la feuille journalière. */
export type Categorie = 'acte' | 'majoration' | 'id' | 'ik'

export const CATEGORIES: { value: Categorie; label: string; court: string }[] = [
  { value: 'acte', label: 'Actes cotés', court: 'Actes' },
  { value: 'majoration', label: 'Majorations (nuit, dimanche, férié...)', court: 'Majorations' },
  { value: 'id', label: 'Indemnités de déplacement (ID / MD)', court: 'ID' },
  { value: 'ik', label: 'Indemnités kilométriques (IK)', court: 'IK' },
]

/**
 * Regroupement des catégories pour naviguer dans le catalogue. Les indemnités
 * de déplacement et les indemnités kilométriques répondent à la même question
 * — « je me suis déplacée » — et tiennent donc dans un seul onglet, même si
 * elles restent distinctes dans les totaux et dans les règles du contrat.
 */
export type Groupe = 'acte' | 'majoration' | 'deplacement'

export const GROUPES: { value: Groupe; court: string; categories: Categorie[] }[] = [
  { value: 'acte', court: 'Actes', categories: ['acte'] },
  { value: 'majoration', court: 'Majorations', categories: ['majoration'] },
  { value: 'deplacement', court: 'Déplacements', categories: ['id', 'ik'] },
]

/** Catégories couvertes par un onglet. */
export const categoriesDuGroupe = (groupe: Groupe): Categorie[] =>
  GROUPES.find((g) => g.value === groupe)?.categories ?? []

/**
 * Une lettre clé de la NGAP (SF, SP...). Sa valeur est fixée par la convention
 * et change à chaque revalorisation : c'est le seul chiffre à mettre à jour
 * pour que tous les actes cotés au coefficient suivent.
 */
export interface LettreCle {
  id: string
  code: string
  libelle: string
  valeur: number
}

/**
 * Comment le tarif d'un acte est obtenu.
 * - 'coefficient' : lettre clé × coefficient, la règle NGAP (ex. SF 7,5).
 * - 'forfait'     : un montant fixe (consultation, majorations, indemnités).
 */
export type Tarification = 'coefficient' | 'forfait'

/** Un acte / une majoration / une indemnité du catalogue paramétrable. */
export interface ActeCatalogue {
  id: string
  code: string
  libelle: string
  categorie: Categorie
  tarification: Tarification
  /** Cotation au coefficient : quelle lettre clé, et quel coefficient. */
  lettreCleId?: string
  coefficient?: number
  /** Montant fixe. Utilisé uniquement quand tarification vaut 'forfait'. */
  tarif: number
  /** Unité de la quantité : un acte, ou un kilomètre pour les IK. */
  unite: 'acte' | 'km'
  favori: boolean
  archive: boolean
  /** true si l'acte a été créé par l'utilisatrice (et non fourni par l'application). */
  personnalise: boolean
  /**
   * false tant que le montant n'a pas été confirmé par une sage-femme.
   * L'application le signale partout : un chiffre trouvé sur internet ne doit
   * jamais avoir l'air d'un chiffre validé.
   */
  verifie: boolean
  /** D'où vient ce montant, en clair. Affiché avec l'acte. */
  source?: string
  note?: string
}

/**
 * Règles d'assiette : quelles lignes entrent dans le calcul de la rétrocession.
 * Les actes cotés y sont toujours ; le reste dépend du contrat signé.
 */
export interface AssietteRetrocession {
  majorations: boolean
  id: boolean
  ik: boolean
}

/** Un contrat de remplacement avec un titulaire / un cabinet. */
export interface Contrat {
  id: string
  nom: string
  couleur: string
  /** Taux de rétrocession en fraction : 0.30 = 30 %. */
  tauxRetrocession: number
  assiette: AssietteRetrocession
  /** Tarifs spécifiques à ce contrat : acteId -> tarif. Prime sur le catalogue. */
  tarifs: Record<string, number>
  actif: boolean
  dateDebut?: string
  dateFin?: string
  notes?: string
}

/** Une ligne saisie sur une feuille journalière. */
export interface Ligne {
  id: string
  /** Référence au catalogue quand la ligne en vient (sinon saisie libre). */
  acteId?: string
  code: string
  libelle: string
  categorie: Categorie
  /** Nombre d'actes, ou nombre de kilomètres pour les IK. */
  quantite: number
  /**
   * Tarif figé au moment de la saisie. Une revalorisation de la lettre clé ne
   * réécrit donc jamais une journée déjà passée.
   */
  tarifUnitaire: number
}

/** Une feuille journalière, pour une date et un contrat donnés. */
export interface Journee {
  id: string
  /** Format ISO court : YYYY-MM-DD. */
  date: string
  contratId: string
  lignes: Ligne[]
  notes?: string
  updatedAt: string
}

/**
 * Apparence choisie. « systeme » suit le réglage du téléphone ; les deux autres
 * l'emportent dessus.
 */
export type Theme = 'clair' | 'sombre' | 'systeme'

export const THEMES: { value: Theme; libelle: string }[] = [
  { value: 'clair', libelle: 'Clair' },
  { value: 'sombre', libelle: 'Sombre' },
  { value: 'systeme', libelle: 'Comme le téléphone' },
]

/** Réglages généraux. */
export interface Reglages {
  prenom: string
  theme: Theme
  /** Provision mise de côté pour les cotisations et l'impôt, en fraction. */
  tauxProvision: number
  afficherProvision: boolean
}

/** L'intégralité des données de l'application. */
export interface DonneesApp {
  version: number
  reglages: Reglages
  lettresCles: LettreCle[]
  contrats: Contrat[]
  catalogue: ActeCatalogue[]
  journees: Journee[]
}

export const VERSION_DONNEES = 6
