import { versISO } from './format'

/** Dimanche de Pâques pour une année donnee (algorithme de Meeus/Butcher). */
function paques(annee: number): Date {
  const a = annee % 19
  const b = Math.floor(annee / 100)
  const c = annee % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(annee, mois - 1, jour)
}

function decale(base: Date, jours: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + jours)
  return d
}

const cache = new Map<number, Map<string, string>>()

/** Jours fériés légaux français (métropole) pour une année. */
export function feriesDeLAnnee(annee: number): Map<string, string> {
  const enCache = cache.get(annee)
  if (enCache) return enCache

  const p = paques(annee)
  const feries = new Map<string, string>([
    [`${annee}-01-01`, "Jour de l'an"],
    [versISO(decale(p, 1)), 'Lundi de Pâques'],
    [`${annee}-05-01`, 'Fête du Travail'],
    [`${annee}-05-08`, 'Victoire 1945'],
    [versISO(decale(p, 39)), 'Ascension'],
    [versISO(decale(p, 50)), 'Lundi de Pentecôte'],
    [`${annee}-07-14`, 'Fête nationale'],
    [`${annee}-08-15`, 'Assomption'],
    [`${annee}-11-01`, 'Toussaint'],
    [`${annee}-11-11`, 'Armistice 1918'],
    [`${annee}-12-25`, 'Noel'],
  ])
  cache.set(annee, feries)
  return feries
}

/** Nom du jour férié si la date en est un, sinon undefined. */
export function nomFerie(iso: string): string | undefined {
  return feriesDeLAnnee(Number(iso.slice(0, 4))).get(iso)
}
