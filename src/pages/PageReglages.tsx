import { useRef, useState } from 'react'
import { useStore } from '../store/AppStore'
import { versNombre } from '../domain/format'
import { exporterSauvegarde, lireSauvegarde } from '../export/fichiers'
import { supabaseActif } from '../storage/supabase'
import { IconeExport, IconeInfo } from '../components/Icones'
import { useConfirmation } from '../components/Confirmation'

export function PageReglages() {
  const s = useStore()
  const demanderConfirmation = useConfirmation()
  const r = s.donnees.reglages
  const fichier = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const importer = async (f: File) => {
    try {
      const brut = await lireSauvegarde(f)
      const ok = await demanderConfirmation(
        'Tes données actuelles seront remplacées par le contenu de ce fichier.',
        { titre: 'Restaurer cette sauvegarde ?', confirmer: 'Restaurer' },
      )
      if (!ok) return
      s.remplacerDonnees(brut)
      setMessage('Sauvegarde restaurée.')
    } catch {
      setMessage("Ce fichier n'est pas une sauvegarde valide.")
    }
  }

  return (
    <>
      <div className="carte">
        <header><h2>Mes informations</h2></header>
        <div className="carte-corps">
          <label>
            Prénom
            <input
              type="text" value={r.prenom} placeholder="Ton prénom"
              onChange={(e) => s.majReglages({ prenom: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="carte">
        <header><h2>Mise de côté</h2></header>
        <div className="carte-corps">
          <p style={{ fontSize: '.83rem', color: 'var(--texte-doux)' }}>
            Affiche, sous chaque total, la somme à mettre de côté pour les
            cotisations et l'impôt. C'est une simple aide au calcul, sans valeur
            fiscale.
          </p>
          <label className="interrupteur">
            <input
              type="checkbox" checked={r.afficherProvision}
              onChange={(e) => s.majReglages({ afficherProvision: e.target.checked })}
            />
            <span>Afficher la mise de côté</span>
          </label>
          {r.afficherProvision && (
            <label>
              Pourcentage à mettre de côté
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" inputMode="decimal" min={0} max={100} step={1}
                  value={Math.round(r.tauxProvision * 1000) / 10}
                  onChange={(e) =>
                    s.majReglages({
                      tauxProvision: Math.min(1, Math.max(0, versNombre(e.target.value) / 100)),
                    })
                  }
                  style={{ maxWidth: 120 }}
                />
                <span style={{ fontWeight: 700 }}>%</span>
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="carte">
        <header><h2>Mes données</h2></header>
        <div className="carte-corps">
          <div className="note info">
            <IconeInfo />
            <span>
              Tout est enregistre {supabaseActif ? 'sur ton compte' : 'sur cet appareil uniquement'}.
              {!supabaseActif && ' Fais une sauvegarde de temps en temps : si tu changes de téléphone, rien ne suit tout seul.'}
            </span>
          </div>

          <div className="actions">
            <button type="button" className="btn" onClick={() => exporterSauvegarde(s.donnees)}>
              <IconeExport /> Enregistrer une sauvegarde
            </button>
            <button type="button" className="btn" onClick={() => fichier.current?.click()}>
              Restaurer une sauvegarde
            </button>
            <input
              ref={fichier} type="file" accept="application/json,.json" className="sr"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importer(f)
                e.target.value = ''
              }}
            />
          </div>

          {message && <p style={{ fontSize: '.83rem', color: 'var(--accent-texte)' }}>{message}</p>}

          <div className="actions fin">
            <button
              type="button" className="btn danger petit"
              onClick={async () => {
                const ok = await demanderConfirmation(
                  'Toutes tes journées, tes contrats et tes tarifs seront effacés. C\'est définitif.',
                  { titre: 'Tout effacer ?', confirmer: 'Tout effacer' },
                )
                if (ok) {
                  s.reinitialiser()
                  setMessage('Application réinitialisée.')
                }
              }}
            >
              Tout effacer
            </button>
          </div>
        </div>
      </div>

      <div className="carte">
        <header><h2>Vie privée</h2></header>
        <div className="carte-corps">
          <p style={{ fontSize: '.83rem', color: 'var(--texte-doux)', margin: 0 }}>
            Cette application ne contient aucune information sur les patientes :
            ni nom, ni date de naissance, ni motif. Uniquement des cotations, des
            quantités et des montants. Évite d'écrire un nom dans les notes.
          </p>
        </div>
      </div>
    </>
  )
}
