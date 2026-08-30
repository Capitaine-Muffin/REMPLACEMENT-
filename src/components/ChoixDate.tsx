import { useEffect, useMemo, useState } from 'react'
import { Modale } from './Modale'
import { IconeDroite, IconeGauche } from './Icones'
import { aujourdhui, decalerJour, decalerMois, depuisISO, moisDe } from '../domain/format'
import { nomFerie } from '../domain/feries'

const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Toujours six semaines : la hauteur du calendrier ne doit pas sauter d'un
 *  mois à l'autre selon qu'il en compte quatre, cinq ou six. */
const SEMAINES = 6

/**
 * Calendrier de l'application, en remplacement de celui du téléphone.
 *
 * Le calendrier natif d'un champ date ne se laisse pas modifier : impossible
 * d'y marquer les jours déjà remplis. C'est pourtant ce qu'on vient y chercher
 * — « est-ce que j'ai noté mardi ? ». Celui-ci est aussi identique d'un
 * téléphone à l'autre, et ne bouge pas quand le système se met à jour.
 */
export function ChoixDate({
  date, joursRemplis, ouverte, onFermer, onChoisir,
}: {
  date: string
  /** Dates au format AAAA-MM-JJ qui contiennent déjà une saisie. */
  joursRemplis: Set<string>
  ouverte: boolean
  onFermer: () => void
  onChoisir: (date: string) => void
}) {
  const [mois, setMois] = useState(() => moisDe(date))

  // On rouvre toujours sur le mois de la date affichée, jamais sur celui qu'on
  // était en train de parcourir la fois précédente.
  useEffect(() => {
    if (ouverte) setMois(moisDe(date))
  }, [ouverte, date])

  const [annee, numeroMois] = mois.split('-').map(Number)

  /** Les 42 cases, du lundi précédant le 1er au dernier jour de la grille. */
  const cases = useMemo(() => {
    const premier = `${mois}-01`
    const recul = (depuisISO(premier).getDay() + 6) % 7
    const depart = decalerJour(premier, -recul)
    return Array.from({ length: SEMAINES * 7 }, (_, i) => decalerJour(depart, i))
  }, [mois])

  // Les années proposées : celles où quelque chose a été saisi, plus l'actuelle
  // et sa voisine, pour pouvoir noter une journée à l'avance.
  const annees = useMemo(() => {
    const actuelle = Number(aujourdhui().slice(0, 4))
    const vues = [...joursRemplis].map((j) => Number(j.slice(0, 4)))
    const min = Math.min(actuelle - 1, annee, ...vues)
    const max = Math.max(actuelle + 1, annee, ...vues)
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [joursRemplis, annee])

  const choisir = (jour: string) => {
    onChoisir(jour)
    onFermer()
  }

  return (
    <Modale titre="Choisir un jour" ouverte={ouverte} onFermer={onFermer}>
      <div className="navigateur">
        <button
          type="button" className="btn icone" aria-label="Mois précédent"
          onClick={() => setMois(decalerMois(mois, -1))}
        >
          <IconeGauche />
        </button>

        <select
          className="choix-mois" value={numeroMois} aria-label="Mois"
          onChange={(e) => setMois(`${annee}-${String(Number(e.target.value)).padStart(2, '0')}`)}
        >
          {MOIS.map((nom, i) => (
            <option key={nom} value={i + 1}>{nom}</option>
          ))}
        </select>
        <select
          className="choix-annee" value={annee} aria-label="Année"
          onChange={(e) => setMois(`${e.target.value}-${String(numeroMois).padStart(2, '0')}`)}
        >
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <button
          type="button" className="btn icone" aria-label="Mois suivant"
          onClick={() => setMois(decalerMois(mois, 1))}
        >
          <IconeDroite />
        </button>
      </div>

      <div className="calendrier">
        {JOURS.map((j) => (
          <span key={j} className="calendrier-entete" aria-hidden="true">{j}</span>
        ))}

        {cases.map((jour) => {
          const d = depuisISO(jour)
          const ferie = nomFerie(jour)
          const rempli = joursRemplis.has(jour)
          const classes = [
            'calendrier-jour',
            rempli && 'rempli',
            jour === date && 'choisi',
            jour === aujourdhui() && 'aujourdhui',
            (ferie || d.getDay() === 0) && 'chome',
            moisDe(jour) !== mois && 'voisin',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={jour} type="button" className={classes}
              aria-current={jour === date ? 'date' : undefined}
              title={ferie}
              onClick={() => choisir(jour)}
            >
              <span className="numero">{d.getDate()}</span>
              <span className="marque" aria-hidden="true" />
              {rempli && <span className="sr"> (journée saisie)</span>}
            </button>
          )
        })}
      </div>

      <p className="calendrier-legende">
        <span className="calendrier-jour rempli exemple" aria-hidden="true">
          <span className="numero">8</span>
          <span className="marque" />
        </span>
        Un point sous le nombre signale une journée déjà saisie. Les dimanches et
        jours fériés sont en couleur.
      </p>

      <div className="actions fin">
        <button type="button" className="btn petit" onClick={() => choisir(aujourdhui())}>
          Aujourd'hui
        </button>
      </div>
    </Modale>
  )
}
