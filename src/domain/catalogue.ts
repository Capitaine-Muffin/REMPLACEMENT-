import type { ActeCatalogue } from './types'

/**
 * ATTENTION — Les tarifs ci-dessous sont des valeurs de DEPART indicatives,
 * destinées à eviter une saisie initiale fastidieuse. Les valeurs
 * conventionnelles (lettre cle SF, majorations, IFD, IK) evoluent avec les
 * avenants à la convention nationale : vérifie chaque montant avec la NGAP en
 * vigueur avant de facturer, et corrige-les dans l'écran "Tarifs".
 *
 * Tout est modifiable : montant, Libellé, code, et ajout de tes propres actes
 * ou de tes dépassements d'honoraires.
 */
export const AVERTISSEMENT_TARIFS =
  "Tarifs de départ indicatifs : vérifie-les avec la NGAP en vigueur et ajuste-les dans l'écran Tarifs."

interface Defaut {
  code: string
  libelle: string
  categorie: ActeCatalogue['categorie']
  tarif: number
  unite?: 'acte' | 'km'
  favori?: boolean
  note?: string
}

const DEFAUTS: Defaut[] = [
  // --- Consultations et actes cotés ---
  { code: 'C', libelle: 'Consultation sage-femme', categorie: 'acte', tarif: 25, favori: true },
  { code: 'C', libelle: 'Consultation de suivi gynécologique de prévention', categorie: 'acte', tarif: 25 },
  { code: 'SF12', libelle: 'Séance de préparation à la naissance (individuelle)', categorie: 'acte', tarif: 48.6, favori: true },
  { code: 'SF15', libelle: 'Rééducation périnéale', categorie: 'acte', tarif: 60.75, favori: true },
  { code: 'SF15', libelle: 'Entretien prénatal précoce', categorie: 'acte', tarif: 60.75 },
  { code: 'SF12', libelle: 'Visite à domicile post-natale', categorie: 'acte', tarif: 48.6, favori: true },
  { code: 'SF15', libelle: 'Surveillance à domicile de grossesse pathologique', categorie: 'acte', tarif: 60.75 },
  { code: 'SF9', libelle: 'Monitorage / enregistrement du rythme cardiaque fœtal', categorie: 'acte', tarif: 36.45 },

  // --- Lettres cles brutes, pour coter librement ---
  { code: 'SF6', libelle: 'SF 6', categorie: 'acte', tarif: 24.3, note: 'Lettre clé brute' },
  { code: 'SF7', libelle: 'SF 7', categorie: 'acte', tarif: 28.35, note: 'Lettre clé brute' },
  { code: 'SF9', libelle: 'SF 9', categorie: 'acte', tarif: 36.45, note: 'Lettre clé brute' },
  { code: 'SF12', libelle: 'SF 12', categorie: 'acte', tarif: 48.6, note: 'Lettre clé brute' },
  { code: 'SF15', libelle: 'SF 15', categorie: 'acte', tarif: 60.75, note: 'Lettre clé brute' },
  { code: 'SF20', libelle: 'SF 20', categorie: 'acte', tarif: 81, note: 'Lettre clé brute' },
  { code: 'SF25', libelle: 'SF 25', categorie: 'acte', tarif: 101.25, note: 'Lettre clé brute' },

  // --- Majorations ---
  { code: 'MD', libelle: 'Majoration dimanche et jour férié', categorie: 'majoration', tarif: 19.06, favori: true },
  { code: 'MN', libelle: 'Majoration de nuit (20h - 8h)', categorie: 'majoration', tarif: 35, favori: true },
  { code: 'MU', libelle: "Majoration d'urgence", categorie: 'majoration', tarif: 0, note: 'À renseigner selon ton contrat' },

  // --- Indemnités de déplacement ---
  { code: 'IFD', libelle: 'Indemnité forfaitaire de déplacement', categorie: 'id', tarif: 2.5, favori: true },

  // --- Indemnités kilométriques ---
  { code: 'IK', libelle: 'IK plaine', categorie: 'ik', tarif: 0.35, unite: 'km', favori: true },
  { code: 'IKM', libelle: 'IK montagne', categorie: 'ik', tarif: 0.5, unite: 'km' },
  { code: 'IKP', libelle: 'IK à pied / à ski', categorie: 'ik', tarif: 3.4, unite: 'km' },
]

/** Construit le catalogue livre par defaut à la première ouverture. */
export function catalogueParDefaut(): ActeCatalogue[] {
  return DEFAUTS.map((d, i) => ({
    id: `def-${i + 1}`,
    code: d.code,
    libelle: d.libelle,
    categorie: d.categorie,
    tarif: d.tarif,
    unite: d.unite ?? 'acte',
    favori: d.favori ?? false,
    archive: false,
    personnalise: false,
    note: d.note,
  }))
}
