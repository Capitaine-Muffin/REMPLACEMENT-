import { useEffect } from 'react'
import type { Theme } from '../domain/types'

/** Couleur de la barre du navigateur, accordée au fond de l'application. */
const FOND = { clair: '#f6f7f8', sombre: '#0d1117' }

/**
 * Applique l'apparence choisie à la page entière.
 *
 * Les deux palettes vivent dans la feuille de style, en jetons de couleur :
 * il suffit de marquer l'élément racine pour basculer. Sans marque, la page
 * suit le réglage du téléphone.
 */
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const racine = document.documentElement
    if (theme === 'systeme') racine.removeAttribute('data-theme')
    else racine.dataset.theme = theme === 'sombre' ? 'dark' : 'light'

    const sombre =
      theme === 'sombre' ||
      (theme === 'systeme' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', sombre ? FOND.sombre : FOND.clair)
  }, [theme])
}
