import {
  aplatir, calculerPeriode, montantLigne, ventilerParContrat, type Totaux,
} from '../domain/calcul'
import { euros, libelleMois } from '../domain/format'
import type { Contrat, DonneesApp, Journee } from '../domain/types'

function telecharger(nom: string, contenu: string, type: string) {
  const blob = new Blob([contenu], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Échappement CSV : point-virgule comme séparateur (attendu par Excel FR). */
function cellule(v: string | number): string {
  const s = String(v).replace(/"/g, '""')
  return /[";\n]/.test(s) ? `"${s}"` : s
}

const enLigne = (cellules: (string | number)[]) => cellules.map(cellule).join(';')

/** Détail ligne à ligne du mois, exploitable dans Excel ou par le comptable. */
export function exporterMoisCSV(mois: string, journees: Journee[], contrats: Contrat[]) {
  const parId = new Map(contrats.map((c) => [c.id, c]))
  const lignes: string[] = [
    enLigne(['Date', 'Contrat', 'Cotation', 'Libellé', 'Catégorie', 'Quantité', 'Tarif unitaire', 'Montant']),
  ]

  const etiquettes: Record<string, string> = {
    acte: 'Acte', majoration: 'Majoration', id: 'Indemnité de déplacement', ik: 'Indemnité kilométrique',
  }

  for (const j of [...journees].sort((a, b) => a.date.localeCompare(b.date))) {
    const nom = parId.get(j.contratId)?.nom ?? 'Contrat supprimé'
    // Les suppléments d'un acte sont exportés comme des lignes à part entière :
    // le comptable attend une liste plate, pas une arborescence.
    for (const l of aplatir(j.lignes)) {
      lignes.push(
        enLigne([
          j.date, nom, l.code, l.libelle, etiquettes[l.categorie] ?? l.categorie,
          virgule(l.quantite), virgule(l.tarifUnitaire), virgule(montantLigne(l)),
        ]),
      )
    }
  }

  lignes.push('')
  lignes.push(enLigne(['Récapitulatif', libelleMois(mois)]))
  lignes.push(enLigne(['Contrat', 'Jours', 'Actes', 'Total encaissé', 'Base rétrocession', 'Rétrocession', 'Net remplaçante']))
  for (const v of ventilerParContrat(journees, contrats)) {
    const t = v.totaux
    lignes.push(
      enLigne([
        v.contrat?.nom ?? 'Contrat supprimé', v.nbJours, t.nbActes,
        virgule(t.brut), virgule(t.assiette), virgule(t.retrocession), virgule(t.net),
      ]),
    )
  }
  const global = calculerPeriode(journees, contrats)
  lignes.push(
    enLigne([
      'TOTAL', journees.length, global.nbActes,
      virgule(global.brut), virgule(global.assiette), virgule(global.retrocession), virgule(global.net),
    ]),
  )

  telecharger(`remplacement-${mois}.csv`, '﻿' + lignes.join('\n'), 'text/csv')
}

/** Nombre au format français, pour qu'Excel FR le reconnaisse. */
const virgule = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** Sauvegarde complète, réimportable à l'identique. */
export function exporterSauvegarde(donnees: DonneesApp) {
  const date = new Date().toISOString().slice(0, 10)
  telecharger(`sauvegarde-remplacement-${date}.json`, JSON.stringify(donnees, null, 2), 'application/json')
}

/** Lit un fichier de sauvegarde choisi par l'utilisatrice. */
export function lireSauvegarde(fichier: File): Promise<unknown> {
  return fichier.text().then((t) => JSON.parse(t))
}

/** Résumé court, à coller dans un message au titulaire. */
export function resumePourTitulaire(mois: string, contrat: Contrat, t: Totaux, nbJours: number): string {
  return [
    `Récapitulatif ${libelleMois(mois)} — ${contrat.nom}`,
    `${nbJours} jour(s) travaillé(s), ${t.nbActes} acte(s)`,
    `Total encaissé : ${euros(t.brut)}`,
    `Base de rétrocession : ${euros(t.assiette)}`,
    `Rétrocession ${Math.round(contrat.tauxRetrocession * 1000) / 10} % : ${euros(t.retrocession)}`,
    `Part remplaçante : ${euros(t.net)}`,
  ].join('\n')
}
