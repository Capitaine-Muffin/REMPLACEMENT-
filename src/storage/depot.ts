import type { ActeCatalogue, Contrat, DonneesApp } from '../domain/types'
import { VERSION_DONNEES } from '../domain/types'
import { catalogueParDefaut, lettresClesParDefaut } from '../domain/catalogue'

/**
 * Un depot est une source de persistance interchangeable.
 * v1 : le navigateur (hors-ligne, aucune donnee ne quitte l'appareil).
 * v2 : Supabase, pour la synchronisation multi-appareils (voir supabase.ts).
 */
export interface Depot {
  readonly nom: string
  charger(): Promise<DonneesApp | null>
  sauvegarder(donnees: DonneesApp): Promise<void>
}

export function donneesInitiales(): DonneesApp {
  return {
    version: VERSION_DONNEES,
    reglages: { prenom: '', tauxProvision: 0.25, afficherProvision: true },
    lettresCles: lettresClesParDefaut(),
    contrats: [
      {
        id: 'contrat-1',
        nom: 'Mon premier contrat',
        couleur: '#0f766e',
        tauxRetrocession: 0.3,
        // Cas le plus frequent : la rétrocession ne porte que sur les actes.
        assiette: { majorations: false, id: false, ik: false },
        tarifs: {},
        actif: true,
      },
    ],
    catalogue: catalogueParDefaut(),
    journees: [],
  }
}

/**
 * Complète des données chargées potentiellement anciennes ou partielles.
 * Toute future migration de schéma se branche ici.
 */
export function migrer(brut: unknown): DonneesApp {
  const base = donneesInitiales()
  if (!brut || typeof brut !== 'object') return base
  const d = brut as Partial<DonneesApp>

  return {
    version: VERSION_DONNEES,
    reglages: { ...base.reglages, ...(d.reglages ?? {}) },
    lettresCles:
      Array.isArray(d.lettresCles) && d.lettresCles.length ? d.lettresCles : base.lettresCles,
    contrats: migrerContrats(d, base),
    catalogue: migrerCatalogue(d, base),
    // Les journées gardent leurs montants : une revalorisation ne réécrit
    // jamais une feuille déjà remplie.
    journees: Array.isArray(d.journees) ? d.journees : [],
  }
}

/** Vrai pour un acte fourni par l'application (par opposition à créé par elle). */
const estFourni = (id: string) => id.startsWith('def-')

/**
 * Le catalogue livré évolue à chaque correction de cotation : il est donc
 * remplacé dès que les données viennent d'une version antérieure. Les actes
 * que l'utilisatrice a créés, eux, ne sont jamais touchés.
 *
 * Les journées déjà saisies ne dépendent pas du catalogue : chaque ligne porte
 * son propre libellé, sa cotation et son tarif.
 */
function migrerCatalogue(d: Partial<DonneesApp>, base: DonneesApp): ActeCatalogue[] {
  if (!Array.isArray(d.catalogue) || !d.catalogue.length) return base.catalogue
  if ((d.version ?? 1) >= VERSION_DONNEES) return d.catalogue

  const personnalises = d.catalogue
    .filter((a) => a.personnalise && !estFourni(a.id))
    .map<ActeCatalogue>((a) => ({
      ...a,
      tarification: a.tarification ?? 'forfait',
      verifie: a.verifie ?? true,
      source: a.source ?? 'Saisi par toi',
    }))

  return [...base.catalogue, ...personnalises]
}

/**
 * Les identifiants du catalogue livré sont réattribués quand celui-ci est
 * remplacé : un tarif de contrat qui les visait désignerait alors un autre
 * acte. Ces dépassements-là sont donc retirés plutôt que déplacés sur le
 * mauvais acte ; ceux qui visent un acte créé par l'utilisatrice restent.
 */
function migrerContrats(d: Partial<DonneesApp>, base: DonneesApp): Contrat[] {
  if (!Array.isArray(d.contrats) || !d.contrats.length) return base.contrats
  if ((d.version ?? 1) >= VERSION_DONNEES) return d.contrats

  return d.contrats.map((c) => ({
    ...c,
    tarifs: Object.fromEntries(
      Object.entries(c.tarifs ?? {}).filter(([acteId]) => !estFourni(acteId)),
    ),
  }))
}
