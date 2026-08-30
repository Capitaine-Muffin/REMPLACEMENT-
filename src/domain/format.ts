const EUROS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const NOMBRE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const euros = (n: number) => EUROS.format(n || 0)
export const nombre = (n: number) => NOMBRE.format(n || 0)
export const pourcent = (fraction: number) => `${NOMBRE.format((fraction || 0) * 100)} %`

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Date du jour au format YYYY-MM-DD, en heure locale. */
export function aujourdhui(): string {
  return versISO(new Date())
}

export function versISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Parse une date YYYY-MM-DD en Date locale (évite le décalage UTC). */
export function depuisISO(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, (m ?? 1) - 1, j ?? 1)
}

/** "lundi 2 mars" */
export function dateLongue(iso: string): string {
  return depuisISO(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

/** "lun. 02/03" */
export function dateCourte(iso: string): string {
  return depuisISO(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })
}

/** "mars 2026" */
export function libelleMois(mois: string): string {
  const [a, m] = mois.split('-').map(Number)
  return `${MOIS[(m ?? 1) - 1]} ${a}`
}

/** Extrait le mois YYYY-MM d'une date YYYY-MM-DD. */
export const moisDe = (iso: string) => iso.slice(0, 7)

export function moisActuel(): string {
  return moisDe(aujourdhui())
}

/** Décale un mois YYYY-MM de n mois. */
export function decalerMois(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number)
  const d = new Date(a, (m ?? 1) - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function decalerJour(iso: string, n: number): string {
  const d = depuisISO(iso)
  d.setDate(d.getDate() + n)
  return versISO(d)
}

/** Toutes les dates d'un mois YYYY-MM. */
export function joursDuMois(mois: string): string[] {
  const [a, m] = mois.split('-').map(Number)
  const nb = new Date(a, m, 0).getDate()
  return Array.from({ length: nb }, (_, i) => `${mois}-${String(i + 1).padStart(2, '0')}`)
}

export const estDimanche = (iso: string) => depuisISO(iso).getDay() === 0

/** Convertit une saisie utilisateur ("12,5") en nombre. */
export function versNombre(valeur: string): number {
  const n = Number(valeur.replace(',', '.').replace(/\s/g, ''))
  return Number.isFinite(n) ? n : 0
}
