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
    reglages: { prenom: '', theme: 'clair', tauxProvision: 0.25, afficherProvision: true },
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
  const { catalogue, correspondances } = migrerCatalogue(d, base)

  return {
    version: VERSION_DONNEES,
    reglages: { ...base.reglages, ...(d.reglages ?? {}) },
    lettresCles:
      Array.isArray(d.lettresCles) && d.lettresCles.length ? d.lettresCles : base.lettresCles,
    contrats: migrerContrats(d, base, catalogue, correspondances),
    catalogue,
    // Les journées gardent leurs montants : une revalorisation ne réécrit
    // jamais une feuille déjà remplie. On écarte en revanche les feuilles
    // restées vides, héritées d'une version qui ne les refermait pas.
    journees: Array.isArray(d.journees)
      ? d.journees.filter((j) => j.lignes?.length || j.notes?.trim())
      : [],
  }
}

/**
 * Le libellé, réduit à sa forme comparable : c'est lui qui identifie un acte
 * aux yeux de l'utilisatrice, indépendamment des identifiants internes.
 */
const cleLibelle = (libelle: string) =>
  libelle.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
function migrerCatalogue(
  d: Partial<DonneesApp>,
  base: DonneesApp,
): { catalogue: ActeCatalogue[]; correspondances: Map<string, string> } {
  const correspondances = new Map<string, string>()
  if (!Array.isArray(d.catalogue) || !d.catalogue.length) {
    return { catalogue: base.catalogue, correspondances }
  }
  if ((d.version ?? 1) >= VERSION_DONNEES) {
    return { catalogue: d.catalogue, correspondances }
  }

  const anciens = new Map(d.catalogue.map((a) => [a.id, a]))
  // Les identifiants du catalogue livré ont déjà changé une fois. Le libellé
  // sert donc de second point de reconnaissance : sans lui, un acte dont
  // l'identifiant a changé était conservé À CÔTÉ de son remplaçant, et se
  // retrouvait en double dans la liste.
  const parLibelle = new Map(d.catalogue.map((a) => [cleLibelle(a.libelle), a]))
  const reconnus = new Set<string>()

  const fournis = base.catalogue.map<ActeCatalogue>((neuf) => {
    const ancien = anciens.get(neuf.id) ?? parLibelle.get(cleLibelle(neuf.libelle))
    if (!ancien) return neuf
    reconnus.add(ancien.id)
    correspondances.set(ancien.id, neuf.id)
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

  // Un acte portant le libellé d'un acte livré est le même acte, quel que soit
  // son identifiant : le garder à côté produirait le doublon qu'on répare ici.
  const libellesFournis = new Set(base.catalogue.map((a) => cleLibelle(a.libelle)))

  const conserves = d.catalogue
    .filter(
      (a) =>
        !reconnus.has(a.id) &&
        !libellesFournis.has(cleLibelle(a.libelle)) &&
        (a.personnalise || a.verifie === true),
    )
    .map<ActeCatalogue>((a) => ({
      ...a,
      tarification: a.tarification ?? 'forfait',
      verifie: a.verifie ?? true,
      source: a.source ?? 'Saisi par toi',
      personnalise: true,
    }))

  return { catalogue: [...fournis, ...conserves], correspondances }
}

/**
 * Les dépassements d'honoraires suivent leur acte quand son identifiant change.
 * Ceux qui visent un acte disparu du catalogue ne désignent plus rien et sont
 * retirés plutôt que laissés à traîner.
 */
function migrerContrats(
  d: Partial<DonneesApp>,
  base: DonneesApp,
  catalogue: ActeCatalogue[],
  correspondances: Map<string, string>,
): Contrat[] {
  if (!Array.isArray(d.contrats) || !d.contrats.length) return base.contrats
  if ((d.version ?? 1) >= VERSION_DONNEES) return d.contrats

  const connus = new Set(catalogue.map((a) => a.id))
  return d.contrats.map((c) => ({
    ...c,
    // « Mon premier contrat » était le nom livré : il allongeait les pastilles
    // de la feuille du jour. Renommé s'il n'a jamais été personnalisé.
    nom: c.nom === 'Mon premier contrat' ? 'Contrat 1' : c.nom,
    tarifs: Object.fromEntries(
      Object.entries(c.tarifs ?? {})
        .map(([acteId, tarif]) => [correspondances.get(acteId) ?? acteId, tarif] as const)
        .filter(([acteId]) => connus.has(acteId)),
    ),
  }))
}
