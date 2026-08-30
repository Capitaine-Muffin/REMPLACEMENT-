import { useRef, useState, type ReactNode } from 'react'
import { IconePoignee } from './Icones'

/**
 * Liste que l'on réordonne en faisant glisser une poignée.
 *
 * Le glissement seul ne suffit pas : sur un téléphone il rate souvent sa cible,
 * et il est inutilisable au clavier. La poignée répond donc aussi aux flèches
 * haut et bas, ce qui donne un moyen sûr de déplacer un élément d'un cran.
 */
export function Reordonnable<T extends { id: string }>({
  elements, onReordonner, children,
}: {
  elements: T[]
  onReordonner: (ids: string[]) => void
  children: (element: T, poignee: ReactNode) => ReactNode
}) {
  const conteneur = useRef<HTMLDivElement>(null)
  const [glisse, setGlisse] = useState<{ index: number; dy: number; cible: number } | null>(null)
  const mesures = useRef<{ haut: number; hauteur: number }[]>([])

  const blocs = () =>
    [...(conteneur.current?.children ?? [])].map((el) => {
      const r = el.getBoundingClientRect()
      return { haut: r.top, hauteur: r.height }
    })

  const deplacer = (de: number, vers: number) => {
    if (de === vers) return
    const ordre = elements.map((e) => e.id)
    const [pris] = ordre.splice(de, 1)
    ordre.splice(vers, 0, pris)
    onReordonner(ordre)
  }

  const commencer = (e: React.PointerEvent, index: number) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    mesures.current = blocs()
    const depart = e.clientY
    const bloc = mesures.current[index]

    const bouger = (ev: PointerEvent) => {
      const dy = ev.clientY - depart
      const centre = bloc.haut + bloc.hauteur / 2 + dy
      let cible = index
      mesures.current.forEach((m, i) => {
        const milieu = m.haut + m.hauteur / 2
        if (i < index && centre < milieu) cible = Math.min(cible, i)
        if (i > index && centre > milieu) cible = Math.max(cible, i)
      })
      setGlisse({ index, dy, cible })
    }

    const finir = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', bouger)
      window.removeEventListener('pointerup', finir)
      window.removeEventListener('pointercancel', finir)
      setGlisse((g) => {
        if (g) deplacer(g.index, g.cible)
        return null
      })
      ev.preventDefault()
    }

    window.addEventListener('pointermove', bouger)
    window.addEventListener('pointerup', finir)
    window.addEventListener('pointercancel', finir)
  }

  const auClavier = (e: React.KeyboardEvent, index: number) => {
    const sens = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
    if (!sens) return
    e.preventDefault()
    const vers = index + sens
    if (vers < 0 || vers >= elements.length) return
    deplacer(index, vers)
  }

  /** Décalage visuel d'un bloc pendant qu'un autre le survole. */
  const decalage = (i: number): number => {
    if (!glisse) return 0
    const { index, cible, dy } = glisse
    if (i === index) return dy
    const hauteur = mesures.current[index]?.hauteur ?? 0
    if (i > index && i <= cible) return -hauteur
    if (i < index && i >= cible) return hauteur
    return 0
  }

  return (
    <div className="reordonnable" ref={conteneur}>
      {elements.map((element, i) => (
        <div
          key={element.id}
          className={`reordonnable-bloc${glisse?.index === i ? ' saisi' : ''}`}
          style={{
            transform: decalage(i) ? `translateY(${decalage(i)}px)` : undefined,
            transition: glisse?.index === i ? 'none' : undefined,
          }}
        >
          {children(
            element,
            <button
              type="button"
              className="poignee"
              aria-label={`Déplacer ${'nom' in element ? String(element.nom) : ''} dans la liste`}
              title="Glisser pour réordonner, ou flèches haut et bas"
              onPointerDown={(e) => commencer(e, i)}
              onKeyDown={(e) => auClavier(e, i)}
            >
              <IconePoignee />
            </button>,
          )}
        </div>
      ))}
    </div>
  )
}
