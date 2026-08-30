import type { ActeCatalogue, DonneesApp } from '../domain/types'
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
    contrats: Array.isArray(d.contrats) && d.contrats.length ? d.contrats : base.contrats,
    catalogue: migrerCatalogue(d, base),
    // Les journées gardent leurs montants : une revalorisation ne réécrit
    // jamais une feuille déjà remplie.
    journees: Array.isArray(d.journees) ? d.journees : [],
  }
}

/**
 * Version 1 : chaque acte portait un prix en dur. Version 2 : les actes sont
 * cotés « lettre clé × coefficient », ce qui rend les revalorisations
 * indolores. Les actes fournis par l'application sont donc remplacés par le
 * nouveau catalogue ; ceux que l'utilisatrice a créés sont conservés tels
 * quels, comme des montants fixes.
 */
function migrerCatalogue(d: Partial<DonneesApp>, base: DonneesApp): ActeCatalogue[] {
  if (!Array.isArray(d.catalogue) || !d.catalogue.length) return base.catalogue
  if ((d.version ?? 1) >= 2) return d.catalogue

  const personnalises = d.catalogue
    .filter((a) => a.personnalise)
    .map<ActeCatalogue>((a) => ({ ...a, tarification: a.tarification ?? 'forfait' }))

  return [...base.catalogue, ...personnalises]
}
