import { describe, expect, it } from 'vitest'
import { calculerLignes, calculerPeriode, tarifApplique, ventilerParContrat } from './calcul'
import type { ActeCatalogue, Contrat, Journee, Ligne } from './types'

function contrat(over: Partial<Contrat> = {}): Contrat {
  return {
    id: 'c1',
    nom: 'Cabinet test',
    couleur: '#0f766e',
    tauxRetrocession: 0.3,
    assiette: { majorations: false, id: false, ik: false },
    tarifs: {},
    actif: true,
    ...over,
  }
}

function ligne(over: Partial<Ligne> & Pick<Ligne, 'categorie'>): Ligne {
  return {
    id: Math.random().toString(36).slice(2),
    code: 'X',
    libelle: 'ligne',
    quantite: 1,
    tarifUnitaire: 0,
    ...over,
  }
}

/** Journée type : 3 actes à 25 EUR, 1 majoration férié, 2 ID, 12 km. */
const lignesJournee: Ligne[] = [
  ligne({ categorie: 'acte', quantite: 3, tarifUnitaire: 25 }), // 75
  ligne({ categorie: 'majoration', quantite: 1, tarifUnitaire: 19.06 }), // 19.06
  ligne({ categorie: 'id', quantite: 2, tarifUnitaire: 2.5 }), // 5
  ligne({ categorie: 'ik', quantite: 12, tarifUnitaire: 0.35 }), // 4.20
]

describe('calculerLignes', () => {
  it('ventile les montants par catégorie', () => {
    const t = calculerLignes(lignesJournee, contrat())
    expect(t.actes).toBe(75)
    expect(t.majorations).toBe(19.06)
    expect(t.id).toBe(5)
    expect(t.ik).toBe(4.2)
    expect(t.brut).toBe(103.26)
    expect(t.nbActes).toBe(3)
    expect(t.km).toBe(12)
  })

  it('exclut majorations, ID et IK de l assiette quand le contrat les exclut', () => {
    const t = calculerLignes(lignesJournee, contrat())
    expect(t.assiette).toBe(75)
    expect(t.retrocession).toBe(22.5)
    expect(t.net).toBe(80.76) // 103.26 - 22.50
  })

  it('inclut tout dans l assiette quand le contrat le prevoit', () => {
    const c = contrat({ assiette: { majorations: true, id: true, ik: true } })
    const t = calculerLignes(lignesJournee, c)
    expect(t.assiette).toBe(103.26)
    expect(t.retrocession).toBe(30.98) // 30 % de 103,26
    expect(t.net).toBe(72.28)
  })

  it('gere une inclusion partielle (férié dans l assiette, déplacements dehors)', () => {
    const c = contrat({ assiette: { majorations: true, id: false, ik: false } })
    const t = calculerLignes(lignesJournee, c)
    expect(t.assiette).toBe(94.06)
    expect(t.retrocession).toBe(28.22)
    expect(t.net).toBe(75.04)
  })

  it('applique un taux de rétrocession personnalise', () => {
    const t = calculerLignes(lignesJournee, contrat({ tauxRetrocession: 0.2 }))
    expect(t.retrocession).toBe(15)
    expect(t.net).toBe(88.26)
  })

  it('sans contrat, aucune rétrocession n est deduite', () => {
    const t = calculerLignes(lignesJournee, undefined)
    expect(t.retrocession).toBe(0)
    expect(t.net).toBe(t.brut)
  })

  it('arrondit au centime sans deriver', () => {
    const lignes = Array.from({ length: 3 }, () =>
      ligne({ categorie: 'acte', quantite: 1, tarifUnitaire: 60.75 }),
    )
    const t = calculerLignes(lignes, contrat({ tauxRetrocession: 0.3 }))
    expect(t.actes).toBe(182.25)
    expect(t.retrocession).toBe(54.68)
    expect(t.net).toBe(127.57)
  })

  it('renvoie des totaux nuls pour une journée vide', () => {
    const t = calculerLignes([], contrat())
    expect(t.brut).toBe(0)
    expect(t.net).toBe(0)
  })
})

describe('calculerPeriode et ventilerParContrat', () => {
  const c1 = contrat({ id: 'c1', nom: 'A' })
  const c2 = contrat({
    id: 'c2',
    nom: 'B',
    tauxRetrocession: 0.25,
    assiette: { majorations: true, id: true, ik: true },
  })

  const journees: Journee[] = [
    { id: 'j1', date: '2026-03-02', contratId: 'c1', lignes: lignesJournee, updatedAt: '' },
    { id: 'j2', date: '2026-03-03', contratId: 'c1', lignes: lignesJournee, updatedAt: '' },
    { id: 'j3', date: '2026-03-04', contratId: 'c2', lignes: lignesJournee, updatedAt: '' },
  ]

  it('applique à chaque journée les regles de son propre contrat', () => {
    const t = calculerPeriode(journees, [c1, c2])
    // c1 : 2 x 22,50 de rétrocession ; c2 : 25 % de 103,26 = 25,82
    expect(t.retrocession).toBe(70.82)
    expect(t.brut).toBe(309.78)
    expect(t.net).toBe(238.96)
  })

  it('ventile par contrat avec le nombre de jours travaillés', () => {
    const v = ventilerParContrat(journees, [c1, c2])
    expect(v).toHaveLength(2)
    const a = v.find((x) => x.contratId === 'c1')!
    expect(a.nbJours).toBe(2)
    expect(a.totaux.net).toBe(161.52)
    const b = v.find((x) => x.contratId === 'c2')!
    expect(b.nbJours).toBe(1)
    expect(b.totaux.net).toBe(77.44)
  })
})

describe('tarifApplique', () => {
  const acte: ActeCatalogue = {
    id: 'a1', code: 'C', libelle: 'Consultation', categorie: 'acte',
    tarif: 25, unite: 'acte', favori: false, archive: false, personnalise: false,
  }

  it('utilisé le tarif du catalogue par defaut', () => {
    expect(tarifApplique(acte, contrat())).toBe(25)
  })

  it('utilisé le dépassement d honoraires defini sur le contrat', () => {
    expect(tarifApplique(acte, contrat({ tarifs: { a1: 32 } }))).toBe(32)
  })

  it('respecte un tarif contractuel à zéro', () => {
    expect(tarifApplique(acte, contrat({ tarifs: { a1: 0 } }))).toBe(0)
  })
})
