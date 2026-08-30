import { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { calculerJournee, calculerPeriode, ventilerParContrat } from '../domain/calcul'
import {
  dateCourte, decalerMois, euros, libelleMois, moisActuel, nombre,
} from '../domain/format'
import { nomFerie } from '../domain/feries'
import { DetailTotaux } from '../components/Totaux'
import { exporterMoisCSV, resumePourTitulaire } from '../export/fichiers'
import { IconeDroite, IconeExport, IconeGauche, IconeImprimer } from '../components/Icones'
import { Modale } from '../components/Modale'

export function PageMois() {
  const s = useStore()
  const [mois, setMois] = useState(moisActuel)
  const [copie, setCopie] = useState<string | null>(null)
  const [aCopierAlaMain, setACopierAlaMain] = useState<string | null>(null)

  const journees = s.journeesDuMois(mois)
  const contrats = s.donnees.contrats
  const vide = journees.length === 0
  // Une même date travaillée pour deux contrats fait deux feuilles, mais une
  // seule journée de travail.
  const joursTravailles = new Set(journees.map((j) => j.date)).size

  const ventilation = useMemo(() => ventilerParContrat(journees, contrats), [journees, contrats])
  const global = useMemo(() => calculerPeriode(journees, contrats), [journees, contrats])

  const copier = async (texte: string, cle: string) => {
    try {
      await navigator.clipboard.writeText(texte)
      setCopie(cle)
      setTimeout(() => setCopie(null), 2000)
    } catch {
      // Presse-papier refusé (connexion non sécurisée, permission) : on affiche
      // le texte pour qu'il puisse être selectionné à la main.
      setACopierAlaMain(texte)
    }
  }

  return (
    <>
      <header className="impression entete-impression">
        <h1>Récapitulatif — {libelleMois(mois)}</h1>
        {s.donnees.reglages.prenom && <p>{s.donnees.reglages.prenom}</p>}
      </header>

      <div className="carte">
        <div className="carte-corps">
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

            {/* Toujours présents, désactivés sur un mois vide : des boutons qui
                apparaissent et disparaissent font sauter la barre d'un mois à
                l'autre. */}
            <div className="actions-icones">
              <button
                type="button" className="btn icone"
                disabled={vide}
                aria-label="Exporter le mois vers Excel"
                title={vide ? 'Rien à exporter ce mois-ci' : 'Exporter vers Excel'}
                onClick={() => exporterMoisCSV(mois, journees, contrats)}
              >
                <IconeExport />
              </button>
              <button
                type="button" className="btn icone"
                disabled={vide}
                aria-label="Imprimer le récapitulatif"
                title={vide ? 'Rien à imprimer ce mois-ci' : 'Imprimer'}
                onClick={() => window.print()}
              >
                <IconeImprimer />
              </button>
            </div>
          </div>
          {/* Trois compteurs, pas de montant : le net figure déjà dans l'en-tête
              de l'application et dans la carte de chaque contrat. Des nombres
              courts tiennent sans être rognés, quelle que soit la largeur. */}
          <div className="vignettes">
            <div className="vignette">
              <div className="cle">Jours</div>
              <div className="val">{joursTravailles}</div>
            </div>
            <div className="vignette">
              <div className="cle">Actes</div>
              <div className="val">{nombre(global.nbActes)}</div>
            </div>
            <div className="vignette">
              <div className="cle">Km</div>
              <div className="val">{nombre(global.km)}</div>
            </div>
          </div>
        </div>
      </div>

      {vide ? (
        <div className="carte">
          <div className="vide">
            <strong>Rien ce mois-ci</strong>
            Les journées que tu saisis apparaîtront ici automatiquement.
          </div>
        </div>
      ) : (
        <>
          {/* Un bloc par contrat : c'est ce qu'on envoie au titulaire */}
          {ventilation.map((v) => (
            <div className="carte" key={v.contratId}>
              <header>
                <span className="pastille" style={{ background: v.contrat?.couleur ?? '#999' }} />
                <h2>{v.contrat?.nom ?? 'Contrat supprimé'}</h2>
                <span className="etiquette">{v.nbJours} j</span>
              </header>
              <div className="carte-corps">
                <DetailTotaux
                  totaux={v.totaux}
                  contrat={v.contrat}
                  provision={
                    s.donnees.reglages.afficherProvision
                      ? { taux: s.donnees.reglages.tauxProvision }
                      : undefined
                  }
                />
                {v.contrat && (
                  <div className="actions no-print">
                    <button
                      type="button" className="btn petit"
                      onClick={() =>
                        copier(
                          resumePourTitulaire(mois, v.contrat!, v.totaux, v.nbJours),
                          v.contratId,
                        )
                      }
                    >
                      {copie === v.contratId ? 'Copié !' : 'Copier le récapitulatif'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Total tous contrats confondus */}
          {ventilation.length > 1 && (
            <div className="carte">
              <header><h2>Tous contrats confondus</h2></header>
              <div className="carte-corps">
                <div className="totaux">
                  <div className="total-ligne">
                    <span className="libelle">Total encaissé</span>
                    <span className="valeur">{euros(global.brut)}</span>
                  </div>
                  <div className="total-ligne retro">
                    <span className="libelle">Rétrocessions</span>
                    <span className="valeur">- {euros(global.retrocession)}</span>
                  </div>
                  <div className="total-ligne net">
                    <span className="libelle">Il te reste</span>
                    <span className="valeur">{euros(global.net)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Détail jour par jour : encombrant à l'écran, indispensable sur le
              papier remis à la titulaire ou au comptable. */}
          <div className="carte impression">
            <header><h2>Jour par jour</h2></header>
            <div className="defilant">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Jour</th><th>Contrat</th><th>Actes</th>
                    <th>Encaissé</th><th>Rétro.</th><th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {journees.map((j) => {
                    const c = contrats.find((x) => x.id === j.contratId)
                    const t = calculerJournee(j, c)
                    const ferie = nomFerie(j.date)
                    return (
                      <tr key={j.id}>
                        <td>
                          {dateCourte(j.date)}
                          {ferie && <span className="etiquette alerte" style={{ marginLeft: 6 }}>férié</span>}
                        </td>
                        <td style={{ textAlign: 'left' }}>{c?.nom ?? '—'}</td>
                        <td>{nombre(t.nbActes)}</td>
                        <td>{euros(t.brut)}</td>
                        <td>{euros(t.retrocession)}</td>
                        <td><strong>{euros(t.net)}</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      <Modale
        titre="Récapitulatif à copier"
        ouverte={aCopierAlaMain !== null}
        onFermer={() => setACopierAlaMain(null)}
      >
        <p style={{ fontSize: '.85rem', color: 'var(--texte-doux)', margin: 0 }}>
          La copie automatique n'est pas autorisée ici. Sélectionne le texte
          ci-dessous et copie-le à la main.
        </p>
        <textarea
          readOnly
          value={aCopierAlaMain ?? ''}
          rows={8}
          onFocus={(e) => e.currentTarget.select()}
        />
      </Modale>
    </>
  )
}
