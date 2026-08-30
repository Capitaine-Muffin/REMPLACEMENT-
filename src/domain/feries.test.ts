import { describe, expect, it } from 'vitest'
import { nomFerie } from './feries'

describe('nomFerie', () => {
  it('reconnait les fériés à date fixe', () => {
    expect(nomFerie('2026-01-01')).toBe("Jour de l'an")
    expect(nomFerie('2026-05-01')).toBe('Fête du Travail')
    expect(nomFerie('2026-12-25')).toBe('Noel')
  })

  it('calcule les fériés mobiles à partir de Pâques', () => {
    // Pâques 2026 : 5 avril
    expect(nomFerie('2026-04-06')).toBe('Lundi de Pâques')
    expect(nomFerie('2026-05-14')).toBe('Ascension')
    expect(nomFerie('2026-05-25')).toBe('Lundi de Pentecôte')
    // Pâques 2025 : 20 avril
    expect(nomFerie('2025-04-21')).toBe('Lundi de Pâques')
    expect(nomFerie('2025-05-29')).toBe('Ascension')
  })

  it('renvoie undefined pour un jour ordinaire', () => {
    expect(nomFerie('2026-03-03')).toBeUndefined()
  })
})
