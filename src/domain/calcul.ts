import type { ActeCatalogue, Categorie, Contrat, Journee, Ligne } from './types'

/** Arrondi comptable au centime. */
export function arrondi(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Totaux d'une feuille journaliere ou d'un ensemble de feuilles. */
export interface Totaux {
  /** Total des actes cotés. */
  actes: number
  /** Total des majorations (nuit, dimanche, férié...). */
  majorations: number
  /** Total des indemnités forfaitaires de déplacement. */
  id: number
  /** Total des indemnités kilométriques. */
  ik: number
  /** Total encaissé avant rétrocession. */
  brut: number
  /** Part du brut sur laquelle s'appliqué le taux de rétrocession. */
  assiette: number
  /** Montant reversé au titulaire. */
  retrocession: number
  /** Ce qui reste à la remplaçante. */
  net: number
  /** Nombre d'actes réalisés (hors majorations et indemnités). */
  nbActes: number
  /** Kilomètres parcourus. */
  km: number
}

export const TOTAUX_VIDES: Totaux = {
  actes: 0, majorations: 0, id: 0, ik: 0,
  brut: 0, assiette: 0, retrocession: 0, net: 0,
  nbActes: 0, km: 0,
}

export function montantLigne(l: Ligne): number {
  return arrondi(l.quantite * l.tarifUnitaire)
}

/** Somme des montants des lignes d'une catégorie donnee. */
function sommeCategorie(lignes: Ligne[], categorie: Categorie): number {
  return arrondi(
    lignes.filter((l) => l.categorie === categorie).reduce((s, l) => s + montantLigne(l), 0),
  )
}

/**
 * Calcule les totaux d'une journée.
 *
 * Règle métier : les actes cotés entrent toujours dans l'assiette de la
 * rétrocession. Les majorations (férié / nuit), les indemnités de déplacement
 * et les indemnités kilométriques n'y entrent que si le contrat le prevoit —
 * d'ou les trois interrupteurs de `contrat.assiette`.
 */
export function calculerJournee(journee: Journee, contrat: Contrat | undefined): Totaux {
  return calculerLignes(journee.lignes, contrat)
}

export function calculerLignes(lignes: Ligne[], contrat: Contrat | undefined): Totaux {
  const actes = sommeCategorie(lignes, 'acte')
  const majorations = sommeCategorie(lignes, 'majoration')
  const id = sommeCategorie(lignes, 'id')
  const ik = sommeCategorie(lignes, 'ik')
  const brut = arrondi(actes + majorations + id + ik)

  const regles = contrat?.assiette ?? { majorations: false, id: false, ik: false }
  const assiette = arrondi(
    actes +
      (regles.majorations ? majorations : 0) +
      (regles.id ? id : 0) +
      (regles.ik ? ik : 0),
  )

  const taux = contrat?.tauxRetrocession ?? 0
  const retrocession = arrondi(assiette * taux)
  const net = arrondi(brut - retrocession)

  const nbActes = lignes
    .filter((l) => l.categorie === 'acte')
    .reduce((s, l) => s + l.quantite, 0)
  const km = lignes
    .filter((l) => l.categorie === 'ik')
    .reduce((s, l) => s + l.quantite, 0)

  return { actes, majorations, id, ik, brut, assiette, retrocession, net, nbActes, km }
}

/** Additionne des totaux déjà calculés (recap mensuel, cumul annuel...). */
export function additionner(liste: Totaux[]): Totaux {
  return liste.reduce<Totaux>(
    (a, t) => ({
      actes: arrondi(a.actes + t.actes),
      majorations: arrondi(a.majorations + t.majorations),
      id: arrondi(a.id + t.id),
      ik: arrondi(a.ik + t.ik),
      brut: arrondi(a.brut + t.brut),
      assiette: arrondi(a.assiette + t.assiette),
      retrocession: arrondi(a.retrocession + t.retrocession),
      net: arrondi(a.net + t.net),
      nbActes: a.nbActes + t.nbActes,
      km: arrondi(a.km + t.km),
    }),
    TOTAUX_VIDES,
  )
}

/**
 * Totaux d'un ensemble de journées, chacune calculee avec les règles de son
 * propre contrat (indispensable quand on remplace plusieurs titulaires).
 */
export function calculerPeriode(
  journees: Journee[],
  contrats: Contrat[],
): Totaux {
  const parId = new Map(contrats.map((c) => [c.id, c]))
  return additionner(journees.map((j) => calculerJournee(j, parId.get(j.contratId))))
}

/** Ventilation des totaux par contrat, triée par net décroissant. */
export function ventilerParContrat(
  journees: Journee[],
  contrats: Contrat[],
): { contrat: Contrat | undefined; contratId: string; totaux: Totaux; nbJours: number }[] {
  const parId = new Map(contrats.map((c) => [c.id, c]))
  const groupes = new Map<string, Journee[]>()
  for (const j of journees) {
    const liste = groupes.get(j.contratId) ?? []
    liste.push(j)
    groupes.set(j.contratId, liste)
  }
  return [...groupes.entries()]
    .map(([contratId, liste]) => ({
      contratId,
      contrat: parId.get(contratId),
      totaux: calculerPeriode(liste, contrats),
      nbJours: liste.length,
    }))
    .sort((a, b) => b.totaux.net - a.totaux.net)
}

/** Tarif appliqué pour un acte dans le cadre d'un contrat (dépassements inclus). */
export function tarifApplique(acte: ActeCatalogue, contrat: Contrat | undefined): number {
  const perso = contrat?.tarifs?.[acte.id]
  return typeof perso === 'number' ? perso : acte.tarif
}

/** Vrai si le contrat appliqué un tarif différent du catalogue pour cet acte. */
export function estDepassement(acte: ActeCatalogue, contrat: Contrat | undefined): boolean {
  const perso = contrat?.tarifs?.[acte.id]
  return typeof perso === 'number' && arrondi(perso) !== arrondi(acte.tarif)
}
