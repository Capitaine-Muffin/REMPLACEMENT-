import type { DonneesApp } from '../domain/types'
import { migrer, type Depot } from './depot'

const CLE = 'remplacement.donnees.v1'

/** Persistance dans le navigateur : hors-ligne, prive, sans compte. */
export class DepotLocal implements Depot {
  readonly nom = 'local'

  async charger(): Promise<DonneesApp | null> {
    try {
      const brut = localStorage.getItem(CLE)
      return brut ? migrer(JSON.parse(brut)) : null
    } catch {
      // Mode navigation privée, quota, JSON corrompu : on repart proprement.
      return null
    }
  }

  async sauvegarder(donnees: DonneesApp): Promise<void> {
    localStorage.setItem(CLE, JSON.stringify(donnees))
  }
}
