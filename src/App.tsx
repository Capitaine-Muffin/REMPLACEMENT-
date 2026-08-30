import { useState } from 'react'
import { FournisseurStore, useStore } from './store/AppStore'
import { FournisseurConfirmation } from './components/Confirmation'
import { PageJour } from './pages/PageJour'
import { PageMois } from './pages/PageMois'
import { PageContrats } from './pages/PageContrats'
import { PageTarifs } from './pages/PageTarifs'
import { PageReglages } from './pages/PageReglages'
import { calculerPeriode } from './domain/calcul'
import { euros, libelleMois, moisActuel } from './domain/format'
import {
  IconeContrats, IconeJour, IconeMois, IconeReglages, IconeTarifs,
} from './components/Icones'

type Onglet = 'jour' | 'mois' | 'contrats' | 'tarifs' | 'reglages'

const ONGLETS: { id: Onglet; libelle: string; Icone: (p: { className?: string }) => JSX.Element }[] = [
  { id: 'jour', libelle: 'Jour', Icone: IconeJour },
  { id: 'mois', libelle: 'Mois', Icone: IconeMois },
  { id: 'contrats', libelle: 'Contrats', Icone: IconeContrats },
  { id: 'tarifs', libelle: 'Tarifs', Icone: IconeTarifs },
  { id: 'reglages', libelle: 'Réglages', Icone: IconeReglages },
]

const TITRES: Record<Onglet, string> = {
  jour: 'Ma journée',
  mois: 'Mon mois',
  contrats: 'Mes contrats',
  tarifs: 'Mes tarifs',
  reglages: 'Réglages',
}

export default function App() {
  return (
    <FournisseurStore>
      <FournisseurConfirmation>
        <Coquille />
      </FournisseurConfirmation>
    </FournisseurStore>
  )
}

function Coquille() {
  const s = useStore()
  const [onglet, setOnglet] = useState<Onglet>('jour')

  if (!s.pret) return <div className="vide">Chargement…</div>

  const mois = moisActuel()
  const netDuMois = calculerPeriode(s.journeesDuMois(mois), s.donnees.contrats).net

  return (
    <div className="app">
      <header className="entete">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{TITRES[onglet]}</h1>
          {/* Pas sur l'onglet Mois : la page y affiche le mois qu'on parcourt,
              et deux mois différents à l'écran en même temps se contredisent. */}
          {onglet !== 'mois' && (
            <div className="sous">
              {libelleMois(mois)} · {euros(netDuMois)} pour toi
            </div>
          )}
        </div>
      </header>

      <main className="contenu">
        {onglet === 'jour' && <PageJour />}
        {onglet === 'mois' && <PageMois />}
        {onglet === 'contrats' && <PageContrats />}
        {onglet === 'tarifs' && <PageTarifs />}
        {onglet === 'reglages' && <PageReglages />}
      </main>

      <nav className="barre-onglets" aria-label="Navigation principale">
        {ONGLETS.map(({ id, libelle, Icone }) => (
          <button
            key={id} type="button" className="onglet"
            aria-current={onglet === id ? 'page' : undefined}
            onClick={() => setOnglet(id)}
          >
            <Icone />
            {libelle}
          </button>
        ))}
      </nav>
    </div>
  )
}
