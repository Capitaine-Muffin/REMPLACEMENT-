import { useCallback, useState } from 'react'

/**
 * Mémorise si une section est repliée. C'est un confort d'affichage propre à
 * l'appareil, pas une donnée de travail : il reste donc dans le navigateur et
 * n'est ni sauvegardé ni synchronisé.
 */
export function useRepli(cle: string): [boolean, () => void] {
  const stockage = `remplacement.repli.${cle}`

  const [replie, setReplie] = useState(() => {
    try {
      return localStorage.getItem(stockage) === '1'
    } catch {
      return false
    }
  })

  const basculer = useCallback(() => {
    setReplie((avant) => {
      const apres = !avant
      try {
        localStorage.setItem(stockage, apres ? '1' : '0')
      } catch {
        // Navigation privée ou quota plein : le repli vaut pour cette visite.
      }
      return apres
    })
  }, [stockage])

  return [replie, basculer]
}
