import type { DonneesApp } from '../domain/types'
import { VERSION_DONNEES } from '../domain/types'
import { catalogueParDefaut } from '../domain/catalogue'

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
    contrats: Array.isArray(d.contrats) && d.contrats.length ? d.contrats : base.contrats,
    catalogue: Array.isArray(d.catalogue) && d.catalogue.length ? d.catalogue : base.catalogue,
    journees: Array.isArray(d.journees) ? d.journees : [],
  }
}
