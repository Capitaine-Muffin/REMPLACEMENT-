import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { DonneesApp } from '../domain/types'
import { DepotSupabase, obtenirClient, supabaseActif } from './supabase'
import { surSession } from './session'

/**
 * Synchronisation avec le compte.
 *
 * L'application reste locale d'abord : tout est écrit sur l'appareil, et la
 * copie distante suit. C'est ce qui permet de continuer à saisir sans réseau,
 * en visite à domicile par exemple.
 */
export type EtatSynchro =
  | 'inactive'      // pas de projet configuré, ou personne de connecté
  | 'chargement'
  | 'transfert'     // envoi des données locales vers un compte encore vide
  | 'conflit'       // des données des deux côtés : à l'utilisatrice de trancher
  | 'a_jour'
  | 'erreur'

const DELAI_ENVOI = 1500

export interface Synchronisation {
  session: Session | null
  etat: EtatSynchro
  message?: string
  /** Proposé seulement en cas de conflit. */
  garderLocal?: () => void
  garderCompte?: () => void
}

export function useSynchronisation(
  donnees: DonneesApp,
  remplacerDonnees: (d: DonneesApp) => void,
  pret: boolean,
): Synchronisation {
  const [session, setSession] = useState<Session | null>(null)
  const [etat, setEtat] = useState<EtatSynchro>('inactive')
  const [message, setMessage] = useState<string>()
  const [distantes, setDistantes] = useState<DonneesApp | null>(null)
  const minuteur = useRef<number | undefined>(undefined)
  // Ce que l'on vient d'adopter : inutile de le renvoyer aussitôt.
  const dernierEnvoi = useRef<string>('')

  useEffect(() => surSession(setSession), [])

  const depot = useCallback(
    async () => new DepotSupabase(await obtenirClient(), session!.user.id),
    [session],
  )

  const envoyer = useCallback(
    async (d: DonneesApp) => {
      const serialise = JSON.stringify(d)
      if (serialise === dernierEnvoi.current) return
      await (await depot()).sauvegarder(d)
      dernierEnvoi.current = serialise
    },
    [depot],
  )

  // À la connexion : on compare ce qu'il y a des deux côtés.
  useEffect(() => {
    if (!supabaseActif || !pret) return
    if (!session) {
      setEtat('inactive')
      setDistantes(null)
      return
    }

    let annule = false
    setEtat('chargement')
    ;(async () => {
      try {
        const compte = await (await depot()).charger()
        if (annule) return

        if (!compte) {
          setEtat('transfert')
          await envoyer(donnees)
          if (!annule) setEtat('a_jour')
          return
        }
        if (donnees.journees.length === 0) {
          // Rien de saisi ici : le compte fait foi, sans question à poser.
          dernierEnvoi.current = JSON.stringify(compte)
          remplacerDonnees(compte)
          setEtat('a_jour')
          return
        }
        setDistantes(compte)
        setEtat('conflit')
      } catch (e) {
        if (annule) return
        setEtat('erreur')
        setMessage(e instanceof Error ? e.message : 'Synchronisation impossible')
      }
    })()

    return () => {
      annule = true
    }
    // Volontairement lié à la seule session : la comparaison n'a lieu qu'à la
    // connexion, pas à chaque frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, pret])

  // Une fois d'accord, chaque modification part vers le compte.
  useEffect(() => {
    if (etat !== 'a_jour' || !session) return
    window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(() => {
      envoyer(donnees).catch((e) => {
        setEtat('erreur')
        setMessage(e instanceof Error ? e.message : 'Envoi impossible')
      })
    }, DELAI_ENVOI)
    return () => window.clearTimeout(minuteur.current)
  }, [donnees, etat, session, envoyer])

  const garderLocal = useCallback(() => {
    setEtat('transfert')
    envoyer(donnees)
      .then(() => setEtat('a_jour'))
      .catch(() => setEtat('erreur'))
  }, [donnees, envoyer])

  const garderCompte = useCallback(() => {
    if (!distantes) return
    dernierEnvoi.current = JSON.stringify(distantes)
    remplacerDonnees(distantes)
    setEtat('a_jour')
  }, [distantes, remplacerDonnees])

  return {
    session,
    etat,
    message,
    ...(etat === 'conflit' ? { garderLocal, garderCompte } : {}),
  }
}
