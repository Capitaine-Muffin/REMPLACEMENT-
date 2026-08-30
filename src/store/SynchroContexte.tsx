import { createContext, useContext, type ReactNode } from 'react'
import { useStore } from './AppStore'
import { useSynchronisation, type Synchronisation } from '../storage/synchro'

const Contexte = createContext<Synchronisation | null>(null)

export function useSynchro(): Synchronisation {
  const synchro = useContext(Contexte)
  if (!synchro) throw new Error('useSynchro doit être utilisé dans <FournisseurSynchro>')
  return synchro
}

export function FournisseurSynchro({ children }: { children: ReactNode }) {
  const s = useStore()
  const synchro = useSynchronisation(s.donnees, s.remplacerDonnees, s.pret)
  return <Contexte.Provider value={synchro}>{children}</Contexte.Provider>
}
