import { describe, expect, it } from 'vitest'
import { catalogueParDefaut, lettresClesParDefaut } from '../domain/catalogue'
import { donneesInitiales } from './depot'
import type { Journee } from '../domain/types'
import {
  depuisActe, depuisContrat, depuisJournee, depuisLettre,
  versActe, versContrat, versJournee, versLettre,
} from './supabase'

/**
 * La sauvegarde sur le compte passe par des colonnes SQL nommees autrement que
 * le modele. Un champ ajoute au modele et oublie ici disparait silencieusement
 * au premier aller-retour : ces tests le font echouer tout de suite.
 */
describe('aller-retour avec le compte', () => {
  it('rend chaque acte du catalogue a l identique', () => {
    for (const acte of catalogueParDefaut()) {
      expect(versActe(depuisActe(acte))).toEqual(acte)
    }
  })

  it('garde le libelle court de la pastille', () => {
    const frottis = catalogueParDefaut().find((a) => a.court)!
    expect(frottis.court).toBeTruthy()
    expect(versActe(depuisActe(frottis)).court).toBe(frottis.court)
  })

  it('rend chaque lettre cle a l identique', () => {
    for (const lettre of lettresClesParDefaut()) {
      expect(versLettre(depuisLettre(lettre))).toEqual(lettre)
    }
  })

  it('rend chaque contrat a l identique', () => {
    for (const contrat of donneesInitiales().contrats) {
      expect(versContrat(depuisContrat(contrat))).toEqual(contrat)
    }
  })

  it('rend une journee a l identique', () => {
    const journee: Journee = {
      id: 'j1',
      date: '2026-09-01',
      contratId: 'c1',
      lignes: [{
        id: 'l1', acteId: 'def-consultation', code: 'C+MSF',
        libelle: 'Consultation ou visite', categorie: 'acte',
        quantite: 1, tarifUnitaire: 26.5,
        supplements: [{
          id: 'l2', acteId: 'def-md-deplacement', code: 'MD',
          libelle: 'Indemnite de deplacement', categorie: 'id',
          quantite: 1, tarifUnitaire: 10,
        }],
      }],
      notes: 'deux cabinets',
      updatedAt: '2026-09-01T08:00:00.000Z',
    }
    expect(versJournee(depuisJournee(journee))).toEqual(journee)
  })

  it('note le rang d affichage pour le retrouver dans l ordre', () => {
    const [premier, second] = donneesInitiales().contrats
    expect(depuisContrat(premier, 0).ordre).toBe(0)
    if (second) expect(depuisContrat(second, 1).ordre).toBe(1)
  })
})
