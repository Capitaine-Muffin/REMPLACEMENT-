import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type {
  ActeCatalogue, Contrat, DonneesApp, Journee, LettreCle, Ligne, Reglages,
} from '../domain/types'
import { DepotLocal } from '../storage/local'
import { donneesInitiales, migrer, type Depot } from '../storage/depot'
import { arrondi } from '../domain/calcul'
import { nouvelId } from './id'

interface Store {
  donnees: DonneesApp
  pret: boolean
  /* Réglages */
  majReglages: (r: Partial<Reglages>) => void
  /* Lettres clés */
  majLettreCle: (id: string, l: Partial<LettreCle>) => void
  ajouterLettreCle: () => LettreCle
  supprimerLettreCle: (id: string) => void
  /* Contrats */
  ajouterContrat: (c?: Partial<Contrat>) => Contrat
  majContrat: (id: string, c: Partial<Contrat>) => void
  reordonnerContrats: (ids: string[]) => void
  supprimerContrat: (id: string) => void
  /* Catalogue */
  ajouterActe: (a?: Partial<ActeCatalogue>) => ActeCatalogue
  majActe: (id: string, a: Partial<ActeCatalogue>) => void
  supprimerActe: (id: string) => void
  /* Journées */
  journee: (date: string, contratId: string) => Journee | undefined
  journeesDuMois: (mois: string) => Journee[]
  ajouterLigne: (date: string, contratId: string, ligne: Omit<Ligne, 'id'>) => void
  majLigne: (journeeId: string, ligneId: string, ligne: Partial<Ligne>) => void
  supprimerLigne: (journeeId: string, ligneId: string) => void
  majNotesJournee: (journeeId: string, notes: string) => void
  supprimerJournee: (journeeId: string) => void
  dupliquerJournee: (journeeId: string, versDate: string) => void
  /* Données */
  remplacerDonnees: (d: unknown) => void
  reinitialiser: () => void
}

const Contexte = createContext<Store | null>(null)

export function useStore(): Store {
  const store = useContext(Contexte)
  if (!store) throw new Error('useStore doit être utilisé dans <FournisseurStore>')
  return store
}

const DELAI_SAUVEGARDE = 400

export function FournisseurStore({
  children,
  depot = new DepotLocal(),
}: {
  children: ReactNode
  depot?: Depot
}) {
  const [donnees, setDonnees] = useState<DonneesApp>(donneesInitiales)
  const [pret, setPret] = useState(false)
  const minuteur = useRef<number | undefined>(undefined)

  useEffect(() => {
    let annule = false
    depot.charger().then((chargees) => {
      if (annule) return
      if (chargees) setDonnees(chargees)
      setPret(true)
    })
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sauvegarde différée : évite d'ecrire à chaque frappe clavier.
  useEffect(() => {
    if (!pret) return
    window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(() => {
      depot.sauvegarder(donnees).catch((e) => console.error('Sauvegarde impossible', e))
    }, DELAI_SAUVEGARDE)
    return () => window.clearTimeout(minuteur.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnees, pret])

  const modifier = useCallback((f: (d: DonneesApp) => DonneesApp) => setDonnees(f), [])

  /** Récupère la journée (date, contrat) ou la crée si elle n'existe pas. */
  const garantirJournee = (d: DonneesApp, date: string, contratId: string) => {
    const existante = d.journees.find((j) => j.date === date && j.contratId === contratId)
    if (existante) return { donnees: d, journee: existante }
    const journee: Journee = {
      id: nouvelId('j'),
      date,
      contratId,
      lignes: [],
      updatedAt: new Date().toISOString(),
    }
    return { donnees: { ...d, journees: [...d.journees, journee] }, journee }
  }

  const majJournee = (journeeId: string, f: (j: Journee) => Journee) =>
    modifier((d) => ({
      ...d,
      journees: d.journees.map((j) =>
        j.id === journeeId ? { ...f(j), updatedAt: new Date().toISOString() } : j,
      ),
    }))

  const store: Store = useMemo(
    () => ({
      donnees,
      pret,

      majReglages: (r) => modifier((d) => ({ ...d, reglages: { ...d.reglages, ...r } })),

      majLettreCle: (id, l) =>
        modifier((d) => ({
          ...d,
          lettresCles: d.lettresCles.map((x) => (x.id === id ? { ...x, ...l } : x)),
        })),
      ajouterLettreCle: () => {
        const lettre: LettreCle = { id: nouvelId('lc'), code: '', libelle: '', valeur: 0 }
        modifier((d) => ({ ...d, lettresCles: [...d.lettresCles, lettre] }))
        return lettre
      },
      supprimerLettreCle: (id) =>
        modifier((d) => ({
          ...d,
          lettresCles: d.lettresCles.filter((x) => x.id !== id),
          // Les actes cotés avec cette lettre basculent sur leur dernier
          // montant connu plutôt que de tomber à zéro.
          catalogue: d.catalogue.map((a) =>
            a.lettreCleId === id
              ? {
                  ...a,
                  tarification: 'forfait' as const,
                  tarif: arrondi(
                    (d.lettresCles.find((l) => l.id === id)?.valeur ?? 0) * (a.coefficient ?? 0),
                  ),
                  lettreCleId: undefined,
                  coefficient: undefined,
                }
              : a,
          ),
        })),

      ajouterContrat: (c) => {
        const contrat: Contrat = {
          id: nouvelId('c'),
          // Un nom court par défaut : il s'affiche sur les pastilles de la
          // feuille du jour, où la place est comptée.
          nom: nomDeContratLibre(donnees.contrats),
          couleur: COULEURS[donnees.contrats.length % COULEURS.length],
          tauxRetrocession: 0.3,
          assiette: { majorations: false, id: false, ik: false },
          tarifs: {},
          actif: true,
          ...c,
        }
        modifier((d) => ({ ...d, contrats: [...d.contrats, contrat] }))
        return contrat
      },
      majContrat: (id, c) =>
        modifier((d) => ({
          ...d,
          contrats: d.contrats.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),
      reordonnerContrats: (ids) =>
        modifier((d) => ({
          ...d,
          // L'ordre décide de l'affichage, et le premier contrat est celui
          // proposé à l'ouverture d'une journée.
          contrats: ids
            .map((id) => d.contrats.find((c) => c.id === id))
            .filter((c): c is Contrat => Boolean(c)),
        })),

      supprimerContrat: (id) =>
        modifier((d) => ({
          ...d,
          contrats: d.contrats.filter((x) => x.id !== id),
          // Les feuilles rattachées au contrat disparaissent avec lui.
          journees: d.journees.filter((j) => j.contratId !== id),
        })),

      ajouterActe: (a) => {
        const acte: ActeCatalogue = {
          id: nouvelId('a'),
          code: '',
          libelle: '',
          categorie: 'acte',
          tarification: 'forfait',
          tarif: 0,
          unite: 'acte',
          favori: false,
          archive: false,
          personnalise: true,
          // Ce que l'utilisatrice saisit elle-même n'a personne d'autre à
          // qui être confirmé.
          verifie: true,
          source: 'Saisi par toi',
          ...a,
        }
        modifier((d) => ({ ...d, catalogue: [...d.catalogue, acte] }))
        return acte
      },
      majActe: (id, a) =>
        modifier((d) => ({
          ...d,
          catalogue: d.catalogue.map((x) => (x.id === id ? { ...x, ...a } : x)),
        })),
      supprimerActe: (id) =>
        modifier((d) => ({
          ...d,
          catalogue: d.catalogue.filter((x) => x.id !== id),
          // Les lignes déjà saisies gardent leur montant : on coupe juste le lien.
          journees: d.journees.map((j) => ({
            ...j,
            lignes: j.lignes.map((l) => (l.acteId === id ? { ...l, acteId: undefined } : l)),
          })),
          contrats: d.contrats.map((c) => {
            if (!(id in c.tarifs)) return c
            const { [id]: _retire, ...reste } = c.tarifs
            return { ...c, tarifs: reste }
          }),
        })),

      journee: (date, contratId) =>
        donnees.journees.find((j) => j.date === date && j.contratId === contratId),
      journeesDuMois: (mois) =>
        donnees.journees
          .filter((j) => j.date.startsWith(mois))
          .sort((a, b) => a.date.localeCompare(b.date)),

      ajouterLigne: (date, contratId, ligne) =>
        modifier((d) => {
          const { donnees: avecJournee, journee } = garantirJournee(d, date, contratId)
          return {
            ...avecJournee,
            journees: avecJournee.journees.map((j) =>
              j.id === journee.id
                ? {
                    ...j,
                    lignes: [...j.lignes, { ...ligne, id: nouvelId('l') }],
                    updatedAt: new Date().toISOString(),
                  }
                : j,
            ),
          }
        }),
      majLigne: (journeeId, ligneId, ligne) =>
        majJournee(journeeId, (j) => ({
          ...j,
          lignes: j.lignes.map((l) => (l.id === ligneId ? { ...l, ...ligne } : l)),
        })),
      supprimerLigne: (journeeId, ligneId) =>
        majJournee(journeeId, (j) => ({ ...j, lignes: j.lignes.filter((l) => l.id !== ligneId) })),
      majNotesJournee: (journeeId, notes) => majJournee(journeeId, (j) => ({ ...j, notes })),
      supprimerJournee: (journeeId) =>
        modifier((d) => ({ ...d, journees: d.journees.filter((j) => j.id !== journeeId) })),
      dupliquerJournee: (journeeId, versDate) =>
        modifier((d) => {
          const source = d.journees.find((j) => j.id === journeeId)
          if (!source) return d
          const cible = d.journees.find(
            (j) => j.date === versDate && j.contratId === source.contratId,
          )
          const lignes = source.lignes.map((l) => ({ ...l, id: nouvelId('l') }))
          if (cible) {
            return {
              ...d,
              journees: d.journees.map((j) =>
                j.id === cible.id
                  ? { ...j, lignes: [...j.lignes, ...lignes], updatedAt: new Date().toISOString() }
                  : j,
              ),
            }
          }
          return {
            ...d,
            journees: [
              ...d.journees,
              {
                id: nouvelId('j'),
                date: versDate,
                contratId: source.contratId,
                lignes,
                notes: source.notes,
                updatedAt: new Date().toISOString(),
              },
            ],
          }
        }),

      remplacerDonnees: (brut) => setDonnees(migrer(brut)),
      reinitialiser: () => setDonnees(donneesInitiales()),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [donnees, pret],
  )

  return <Contexte.Provider value={store}>{children}</Contexte.Provider>
}

/** Premier « Contrat N » qui ne soit pas déjà pris. */
function nomDeContratLibre(contrats: Contrat[]): string {
  const pris = new Set(contrats.map((c) => c.nom))
  for (let n = 1; ; n++) {
    const nom = `Contrat ${n}`
    if (!pris.has(nom)) return nom
  }
}

export const COULEURS = [
  '#0f766e', '#7c3aed', '#be123c', '#b45309', '#1d4ed8', '#15803d', '#a21caf', '#0e7490',
]
