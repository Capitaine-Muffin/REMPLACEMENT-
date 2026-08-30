import { useEffect, useRef, type ReactNode } from 'react'

/** Fenetre modale basée sur <dialog>, fermable par Echap ou clic extérieur. */
export function Modale({
  titre, ouverte, onFermer, children, actions,
}: {
  titre: string
  ouverte: boolean
  onFermer: () => void
  children: ReactNode
  actions?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouverte && !d.open) d.showModal()
    if (!ouverte && d.open) d.close()
  }, [ouverte])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onFermer() }}
      onClick={(e) => { if (e.target === ref.current) onFermer() }}
    >
      <div className="carte" style={{ border: 0, boxShadow: 'none' }}>
        <header>
          <h2>{titre}</h2>
          <button type="button" className="btn discret petit" onClick={onFermer}>Fermer</button>
        </header>
        <div className="carte-corps">{children}</div>
        {actions && <div className="carte-corps" style={{ paddingTop: 0 }}>{actions}</div>}
      </div>
    </dialog>
  )
}
