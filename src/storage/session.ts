import type { Session } from '@supabase/supabase-js'
import { obtenirClient, supabaseActif } from './supabase'

/**
 * Connexion au compte, par Google.
 *
 * La synchronisation est facultative : sans projet Supabase configuré, rien de
 * tout cela n'est chargé et l'application reste locale.
 */

/** Prévient à chaque changement d'état de connexion. Renvoie de quoi arrêter. */
export function surSession(ecouteur: (session: Session | null) => void): () => void {
  if (!supabaseActif) {
    ecouteur(null)
    return () => {}
  }

  let arrete = false
  let desabonner = () => {}

  obtenirClient()
    .then(async (client) => {
      if (arrete) return
      const { data } = await client.auth.getSession()
      if (arrete) return
      ecouteur(data.session)
      const { data: abonnement } = client.auth.onAuthStateChange((_, session) => {
        if (!arrete) ecouteur(session)
      })
      desabonner = () => abonnement.subscription.unsubscribe()
    })
    .catch(() => ecouteur(null))

  return () => {
    arrete = true
    desabonner()
  }
}

/** Ouvre la page de connexion Google, puis revient sur l'application. */
export async function connexionGoogle(): Promise<void> {
  const client = await obtenirClient()
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // On revient exactement là d'où on est parti, sous-chemin compris.
      redirectTo: window.location.href.split('#')[0],
    },
  })
  if (error) throw error
}

export async function deconnexion(): Promise<void> {
  const client = await obtenirClient()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
