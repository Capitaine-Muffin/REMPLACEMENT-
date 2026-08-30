import { useEffect, useState } from 'react'
import { Modale } from './Modale'
import { IconeDroite, IconeGauche } from './Icones'
import {
  aujourdhui, decalerMois, depuisISO, joursDuMois, libelleMois, moisDe,
} from '../domain/format'
import { nomFerie } from '../domain/feries'

const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

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

  const jours = joursDuMois(mois)
  // Lundi en première colonne, comme un calendrier français.
  const decalage = (depuisISO(jours[0]).getDay() + 6) % 7

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
        <span className="courant">{libelleMois(mois)}</span>
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
        {Array.from({ length: decalage }, (_, i) => <span key={`vide-${i}`} />)}

        {jours.map((jour) => {
          const d = depuisISO(jour)
          const ferie = nomFerie(jour)
          const rempli = joursRemplis.has(jour)
          const classes = [
            'calendrier-jour',
            rempli && 'rempli',
            jour === date && 'choisi',
            jour === aujourdhui() && 'aujourdhui',
            (ferie || d.getDay() === 0) && 'chome',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={jour} type="button" className={classes}
              aria-current={jour === date ? 'date' : undefined}
              title={ferie}
              onClick={() => choisir(jour)}
            >
              {d.getDate()}
              {rempli && <span className="sr"> (journée saisie)</span>}
            </button>
          )
        })}
      </div>

      <p className="calendrier-legende">
        <span className="calendrier-jour rempli exemple" aria-hidden="true">8</span>
        Les jours en gras contiennent déjà une saisie. Les dimanches et jours
        fériés sont en couleur.
      </p>

      <div className="actions fin">
        <button type="button" className="btn petit" onClick={() => choisir(aujourdhui())}>
          Aujourd'hui
        </button>
      </div>
    </Modale>
  )
}
