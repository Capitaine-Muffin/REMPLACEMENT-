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
        nom: 'Contrat 1',
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
  const catalogue = migrerCatalogue(d, base)

  return {
    version: VERSION_DONNEES,
    reglages: { ...base.reglages, ...(d.reglages ?? {}) },
    lettresCles:
      Array.isArray(d.lettresCles) && d.lettresCles.length ? d.lettresCles : base.lettresCles,
    contrats: migrerContrats(d, base, catalogue),
    catalogue,
    // Les journées gardent leurs montants : une revalorisation ne réécrit
    // jamais une feuille déjà remplie.
    journees: Array.isArray(d.journees) ? d.journees : [],
  }
}

/**
 * Le catalogue livré évolue à chaque correction de cotation. Il est donc repris
 * de la nouvelle version, mais sans écraser le travail de l'utilisatrice :
 *
 * - un acte fourni qu'elle a confirmé ou corrigé garde SON montant, sa cotation
 *   et sa provenance — vérifier un tarif est un travail, il ne doit pas être
 *   perdu à la mise à jour suivante ;
 * - ses favoris et ses archives sont conservés dans tous les cas ;
 * - les actes qu'elle a créés ne sont jamais touchés ;
 * - un acte fourni disparu du nouveau catalogue disparaît, à moins qu'elle ne
 *   l'ait confirmé, auquel cas il est gardé comme un acte à elle.
 *
 * Les journées déjà saisies ne dépendent d'aucun de ces identifiants : chaque
 * ligne porte son propre libellé, sa cotation et son tarif.
 */
function migrerCatalogue(d: Partial<DonneesApp>, base: DonneesApp): ActeCatalogue[] {
  if (!Array.isArray(d.catalogue) || !d.catalogue.length) return base.catalogue
  if ((d.version ?? 1) >= VERSION_DONNEES) return d.catalogue

  const anciens = new Map(d.catalogue.map((a) => [a.id, a]))

  const fournis = base.catalogue.map<ActeCatalogue>((neuf) => {
    const ancien = anciens.get(neuf.id)
    if (!ancien) return neuf
    const sien = ancien.verifie === true
    return {
      ...neuf,
      favori: ancien.favori,
      archive: ancien.archive,
      ...(sien
        ? {
            tarification: ancien.tarification ?? neuf.tarification,
            lettreCleId: ancien.lettreCleId ?? neuf.lettreCleId,
            coefficient: ancien.coefficient ?? neuf.coefficient,
            tarif: ancien.tarif,
            verifie: true,
            source: ancien.source,
          }
        : {}),
    }
  })

  const fournisIds = new Set(base.catalogue.map((a) => a.id))
  const conserves = d.catalogue
    .filter((a) => !fournisIds.has(a.id) && (a.personnalise || a.verifie === true))
    .map<ActeCatalogue>((a) => ({
      ...a,
      tarification: a.tarification ?? 'forfait',
      verifie: a.verifie ?? true,
      source: a.source ?? 'Saisi par toi',
      personnalise: true,
    }))

  return [...fournis, ...conserves]
}

/**
 * Un tarif de contrat qui vise un acte disparu du catalogue ne désigne plus
 * rien : il est retiré plutôt que laissé à traîner.
 */
function migrerContrats(d: Partial<DonneesApp>, base: DonneesApp, catalogue: ActeCatalogue[]): Contrat[] {
  if (!Array.isArray(d.contrats) || !d.contrats.length) return base.contrats
  if ((d.version ?? 1) >= VERSION_DONNEES) return d.contrats

  const connus = new Set(catalogue.map((a) => a.id))
  return d.contrats.map((c) => ({
    ...c,
    // « Mon premier contrat » était le nom livré : il allongeait les pastilles
    // de la feuille du jour. Renommé s'il n'a jamais été personnalisé.
    nom: c.nom === 'Mon premier contrat' ? 'Contrat 1' : c.nom,
    tarifs: Object.fromEntries(
      Object.entries(c.tarifs ?? {}).filter(([acteId]) => connus.has(acteId)),
    ),
  }))
}
