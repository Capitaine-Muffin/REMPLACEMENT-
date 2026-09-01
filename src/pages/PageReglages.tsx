import { useRef, useState } from 'react'
import { useStore } from '../store/AppStore'
import { versNombre } from '../domain/format'
import { THEMES } from '../domain/types'
import { exporterSauvegarde, lireSauvegarde } from '../export/fichiers'
import { supabaseActif } from '../storage/supabase'
import { connexionGoogle, connexionParCourriel, deconnexion } from '../storage/session'
import { useSynchro } from '../store/SynchroContexte'
import { IconeAlerte, IconeExport, IconeInfo } from '../components/Icones'
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
        <header><h2>Apparence</h2></header>
        <div className="carte-corps">
          <div className="puces" role="group" aria-label="Apparence">
            {THEMES.map((t) => (
              <button
                key={t.value} type="button" className="puce"
                aria-pressed={r.theme === t.value}
                onClick={() => s.majReglages({ theme: t.value })}
              >
                {t.libelle}
              </button>
            ))}
          </div>
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

      <CarteCompte />

      <div className="carte">
        <header><h2>Mes données</h2></header>
        <div className="carte-corps">
          <div className="note info">
            <IconeInfo />
            <span>
              Tout est enregistré {supabaseActif ? 'sur ton compte' : 'sur cet appareil uniquement'}.
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
            <strong style={{ color: 'var(--texte)' }}>
              Il est interdit d'inscrire dans cette application une donnée
              médicale ou une donnée permettant d'identifier une patiente
            </strong>{' '}
            — nom, date de naissance, adresse, motif de consultation. Toute
            information saisie doit être anonymisée par le professionnel de
            santé qui la renseigne.
          </p>
          <p style={{ fontSize: '.83rem', color: 'var(--texte-doux)', margin: 0 }}>
            Seules les cotations, les quantités et les montants ont leur place
            ici. C'est à cette condition que l'application ne relève pas de
            l'hébergement de données de santé.
          </p>
        </div>
      </div>
    </>
  )
}

/**
 * Traduit les pannes les plus courantes. Les messages d'origine arrivent en
 * anglais et ne disent pas quoi faire : ici, chaque phrase indique le geste
 * suivant.
 */
function messageErreur(e: unknown): string {
  const brut = e instanceof Error ? e.message : ''
  if (/failed to fetch|networkerror|network request/i.test(brut))
    return "Impossible de joindre le serveur. Vérifie ta connexion internet, puis réessaie."
  if (/rate limit|too many/i.test(brut))
    return "Trop de demandes d'affilée. Attends quelques minutes avant de redemander un lien."
  if (/not enabled|disabled/i.test(brut))
    return "Ce mode de connexion n'est pas encore activé côté serveur."
  if (/invalid.*email/i.test(brut))
    return "Cette adresse e-mail n'est pas valide."
  return brut || 'Opération impossible'
}

/* --- Le compte, pour retrouver ses données sur un autre appareil ---------- */

function CarteCompte() {
  const synchro = useSynchro()
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string>()
  const [courrielSaisi, setCourrielSaisi] = useState('')
  const [envoye, setEnvoye] = useState(false)

  // Sans projet Supabase configuré, il n'y a pas de compte du tout : la carte
  // n'a rien à dire et ne s'affiche pas.
  if (!supabaseActif) return null

  const agir = async (action: () => Promise<void>) => {
    setOccupe(true)
    setErreur(undefined)
    try {
      await action()
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setOccupe(false)
    }
  }

  const courriel = synchro.session?.user.email

  return (
    <div className="carte">
      <header><h2>Mon compte</h2></header>
      <div className="carte-corps">
        {!synchro.session ? (
          <>
            <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--texte-doux)' }}>
              En te connectant, tes journées, tes contrats et tes tarifs sont
              enregistrés sur ton compte. Tu les retrouves ensuite sur un autre
              téléphone ou sur un ordinateur, et tu ne les perds pas en changeant
              d'appareil.
            </p>
            {/* Le lien par courriel est propose en premier : il ne demande
                aucun mot de passe a retenir, et rien a installer. */}
            <form
              className="formulaire-courriel"
              onSubmit={(e) => {
                e.preventDefault()
                agir(async () => {
                  await connexionParCourriel(courrielSaisi.trim())
                  setEnvoye(true)
                })
              }}
            >
              <input
                type="email" required autoComplete="email" inputMode="email"
                placeholder="mon.adresse@gmail.com" value={courrielSaisi}
                aria-label="Mon adresse e-mail"
                onChange={(e) => { setEnvoye(false); setCourrielSaisi(e.target.value) }}
              />
              <button type="submit" className="btn principal" disabled={occupe}>
                Recevoir mon lien
              </button>
            </form>

            {envoye && (
              <div className="note info">
                <IconeInfo />
                <span>
                  Un lien vient de partir sur <strong>{courrielSaisi.trim()}</strong>.
                  Ouvre-le depuis cet appareil pour te connecter. Pense a
                  regarder dans les courriers indésirables.
                </span>
              </div>
            )}

            <button
              type="button" className="btn" disabled={occupe}
              onClick={() => agir(connexionGoogle)}
            >
              Se connecter avec Google
            </button>
          </>
        ) : (
          <>
            <div className="note info">
              <IconeInfo />
              <span>
                Connectée en tant que <strong>{courriel}</strong>.{' '}
                {synchro.etat === 'a_jour' && 'Tes données sont sur ton compte.'}
                {synchro.etat === 'chargement' && 'Lecture du compte…'}
                {synchro.etat === 'transfert' && 'Transfert de tes données en cours…'}
                {synchro.etat === 'erreur' &&
                  `Synchronisation interrompue : ${synchro.message ?? ''} Tes données restent sur cet appareil.`}
              </span>
            </div>

            {synchro.etat === 'conflit' && (
              <div className="note" style={{ display: 'grid', gap: 10 }}>
                <span style={{ display: 'flex', gap: 9 }}>
                  <IconeAlerte />
                  <span>
                    Il y a des journées des deux côtés : sur cet appareil et sur
                    ton compte. Elles ne peuvent pas être fusionnées sans risque
                    de doublons — choisis lesquelles garder. L'autre version sera
                    remplacée.
                  </span>
                </span>
                <div className="actions">
                  <button type="button" className="btn" onClick={synchro.garderCompte}>
                    Garder celles du compte
                  </button>
                  <button type="button" className="btn" onClick={synchro.garderLocal}>
                    Garder celles de cet appareil
                  </button>
                </div>
              </div>
            )}

            <div className="actions fin">
              <button
                type="button" className="btn petit" disabled={occupe}
                onClick={() => agir(deconnexion)}
              >
                Se déconnecter
              </button>
            </div>
          </>
        )}

        {erreur && (
          <p style={{ margin: 0, fontSize: '.83rem', color: 'var(--negatif)' }}>{erreur}</p>
        )}
      </div>
    </div>
  )
}
