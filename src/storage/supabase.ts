import type { SupabaseClient } from '@supabase/supabase-js'
import type { Contrat, DonneesApp, Journee, ActeCatalogue } from '../domain/types'
import { migrer, type Depot } from './depot'

/**
 * Synchronisation multi-appareils (optionnelle).
 *
 * Inactive tant que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas
 * définis : l'application fonctionne alors uniquement en local.
 * Le schéma SQL et les règles RLS correspondants sont dans supabase/schéma.sql.
 *
 * Rappel : aucune donnee de santé ni identité patiente n'est transmise, on
 * n'envoie que des cotations, des quantites et des montants.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseActif = Boolean(url && cle)

let client: Promise<SupabaseClient> | null = null

/**
 * Charge la librairie Supabase à la demande : tant que la synchronisation
 * n'est pas configurée, ces ~300 ko ne sont jamais téléchargés.
 */
export function obtenirClient(): Promise<SupabaseClient> {
  if (!supabaseActif) return Promise.reject(new Error('Synchronisation non configurée'))
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, cle!, { auth: { persistSession: true, autoRefreshToken: true } }),
  )
  return client
}

export class DepotSupabase implements Depot {
  readonly nom = 'supabase'

  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}

  async charger(): Promise<DonneesApp | null> {
    const [profil, contrats, actes, journees] = await Promise.all([
      this.client.from('profils').select('*').eq('user_id', this.userId).maybeSingle(),
      this.client.from('contrats').select('*').eq('user_id', this.userId),
      this.client.from('actes').select('*').eq('user_id', this.userId),
      this.client.from('journees').select('*').eq('user_id', this.userId),
    ])

    const erreur = profil.error ?? contrats.error ?? actes.error ?? journees.error
    if (erreur) throw erreur
    if (!profil.data && !contrats.data?.length) return null

    return migrer({
      reglages: profil.data?.reglages,
      contrats: (contrats.data ?? []).map(versContrat),
      catalogue: (actes.data ?? []).map(versActe),
      journees: (journees.data ?? []).map(versJournee),
    })
  }

  async sauvegarder(d: DonneesApp): Promise<void> {
    const u = this.userId
    const resultats = await Promise.all([
      this.client.from('profils').upsert({ user_id: u, reglages: d.reglages }),
      this.client.from('contrats').upsert(d.contrats.map((c) => ({ ...depuisContrat(c), user_id: u }))),
      this.client.from('actes').upsert(d.catalogue.map((a) => ({ ...depuisActe(a), user_id: u }))),
      this.client.from('journees').upsert(d.journees.map((j) => ({ ...depuisJournee(j), user_id: u }))),
    ])
    const erreur = resultats.find((r) => r.error)?.error
    if (erreur) throw erreur
    await this.supprimerOrphelins('contrats', d.contrats.map((c) => c.id))
    await this.supprimerOrphelins('actes', d.catalogue.map((a) => a.id))
    await this.supprimerOrphelins('journees', d.journees.map((j) => j.id))
  }

  /** Supprime cote serveur ce qui à ete supprimé cote client. */
  private async supprimerOrphelins(table: string, idsConserves: string[]): Promise<void> {
    const requete = this.client.from(table).delete().eq('user_id', this.userId)
    const { error } = idsConserves.length
      ? await requete.not('id', 'in', `(${idsConserves.map((i) => `"${i}"`).join(',')})`)
      : await requete
    if (error) throw error
  }
}

/* --- Correspondance colonnes SQL (snake_case) <-> modèle (camelCase) --- */

type Rang = Record<string, any>

const versContrat = (r: Rang): Contrat => ({
  id: r.id,
  nom: r.nom,
  couleur: r.couleur,
  tauxRetrocession: Number(r.taux_retrocession),
  assiette: r.assiette,
  tarifs: r.tarifs ?? {},
  actif: r.actif,
  dateDebut: r.date_debut ?? undefined,
  dateFin: r.date_fin ?? undefined,
  notes: r.notes ?? undefined,
})

const depuisContrat = (c: Contrat) => ({
  id: c.id,
  nom: c.nom,
  couleur: c.couleur,
  taux_retrocession: c.tauxRetrocession,
  assiette: c.assiette,
  tarifs: c.tarifs,
  actif: c.actif,
  date_debut: c.dateDebut ?? null,
  date_fin: c.dateFin ?? null,
  notes: c.notes ?? null,
})

const versActe = (r: Rang): ActeCatalogue => ({
  id: r.id,
  code: r.code,
  libelle: r.libelle,
  categorie: r.categorie,
  tarif: Number(r.tarif),
  unite: r.unite,
  favori: r.favori,
  archive: r.archive,
  personnalise: r.personnalise,
  note: r.note ?? undefined,
})

const depuisActe = (a: ActeCatalogue) => ({
  id: a.id,
  code: a.code,
  libelle: a.libelle,
  categorie: a.categorie,
  tarif: a.tarif,
  unite: a.unite,
  favori: a.favori,
  archive: a.archive,
  personnalise: a.personnalise,
  note: a.note ?? null,
})

const versJournee = (r: Rang): Journee => ({
  id: r.id,
  date: r.date,
  contratId: r.contrat_id,
  lignes: r.lignes ?? [],
  notes: r.notes ?? undefined,
  updatedAt: r.updated_at,
})

const depuisJournee = (j: Journee) => ({
  id: j.id,
  date: j.date,
  contrat_id: j.contratId,
  lignes: j.lignes,
  notes: j.notes ?? null,
  updated_at: j.updatedAt,
})
