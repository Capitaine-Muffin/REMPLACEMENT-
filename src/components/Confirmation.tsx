import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modale } from './Modale'

interface Demande {
  message: string
  titre: string
  confirmer: string
  danger: boolean
}

type Demander = (message: string, options?: Partial<Omit<Demande, 'message'>>) => Promise<boolean>

const Contexte = createContext<Demander | null>(null)

/**
 * Remplace le confirm() du navigateur : celui-ci est bloque dans certains
 * contextes (pages embarquees) et s'affiche mal sur telephone.
 */
export function useConfirmation(): Demander {
  const demander = useContext(Contexte)
  if (!demander) throw new Error('useConfirmation doit etre utilise dans <FournisseurConfirmation>')
  return demander
}

export function FournisseurConfirmation({ children }: { children: ReactNode }) {
  const [demande, setDemande] = useState<Demande | null>(null)
  const reponse = useRef<((ok: boolean) => void) | null>(null)

  const demander = useCallback<Demander>((message, options) => {
    setDemande({
      message,
      titre: options?.titre ?? 'Confirmer',
      confirmer: options?.confirmer ?? 'Confirmer',
      danger: options?.danger ?? true,
    })
    return new Promise<boolean>((resoudre) => {
      reponse.current = resoudre
    })
  }, [])

  const repondre = (ok: boolean) => {
    reponse.current?.(ok)
    reponse.current = null
    setDemande(null)
  }

  return (
    <Contexte.Provider value={demander}>
      {children}
      <Modale
        titre={demande?.titre ?? ''}
        ouverte={demande !== null}
        onFermer={() => repondre(false)}
        actions={
          <div className="actions fin">
            <button type="button" className="btn" onClick={() => repondre(false)}>
              Annuler
            </button>
            <button
              type="button"
              className={demande?.danger ? 'btn danger' : 'btn principal'}
              onClick={() => repondre(true)}
            >
              {demande?.confirmer}
            </button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: '.9rem', lineHeight: 1.5 }}>{demande?.message}</p>
      </Modale>
    </Contexte.Provider>
  )
}
