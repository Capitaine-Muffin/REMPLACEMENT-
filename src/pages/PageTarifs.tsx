import { useState } from 'react'
import { useStore } from '../store/AppStore'
import { cotation, tarifCatalogue } from '../domain/calcul'
import { euros, versNombre } from '../domain/format'
import { AVERTISSEMENT_TARIFS } from '../domain/catalogue'
import type { ActeCatalogue, Categorie, LettreCle } from '../domain/types'
import { CATEGORIES } from '../domain/types'
import { useConfirmation } from '../components/Confirmation'
import {
  IconeAlerte, IconeCorbeille, IconeEtoile, IconeInfo, IconePlus,
} from '../components/Icones'

export function PageTarifs() {
  const s = useStore()
  const [categorie, setCategorie] = useState<Categorie>('acte')
  const [recherche, setRecherche] = useState('')
  const [voirArchives, setVoirArchives] = useState(false)

  const q = recherche.trim().toLowerCase()
  const actes = s.donnees.catalogue
    .filter((a) => voirArchives || !a.archive)
    .filter((a) => (q ? true : a.categorie === categorie))
    .filter((a) => !q || a.libelle.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))

  return (
    <>
      <LettresCles />

      <div className="note">
        <IconeAlerte />
        <span>{AVERTISSEMENT_TARIFS}</span>
      </div>

      <input
        type="text" placeholder="Rechercher un acte..."
        value={recherche} onChange={(e) => setRecherche(e.target.value)}
        autoComplete="off"
      />

      {!q && (
        <div className="puces" role="group" aria-label="Catégorie">
          {CATEGORIES.map((c) => (
            <button
              key={c.value} type="button" className="puce"
              aria-pressed={categorie === c.value}
              onClick={() => setCategorie(c.value)}
            >
              {c.court}
            </button>
          ))}
        </div>
      )}

      <div className="carte">
        {actes.length === 0 ? (
          <div className="vide">Aucun acte dans cette catégorie.</div>
        ) : (
          <div className="liste">
            {actes.map((a) => <FicheActe key={a.id} acte={a} />)}
          </div>
        )}
      </div>

      <div className="actions">
        <button
          type="button" className="btn principal"
          onClick={() =>
            s.ajouterActe({ categorie: q ? 'acte' : categorie, libelle: 'Nouvel acte' })
          }
        >
          <IconePlus /> Ajouter un acte
        </button>
        <button
          type="button" className="btn discret petit"
          onClick={() => setVoirArchives((v) => !v)}
        >
          {voirArchives ? 'Masquer les archives' : 'Voir les archives'}
        </button>
      </div>
    </>
  )
}

/* --- Valeur des lettres clés --------------------------------------------- */

/**
 * Le chiffre le plus important de l'application : tous les actes cotés au
 * coefficient en découlent. Une revalorisation conventionnelle se règle ici,
 * en une seule saisie.
 */
function LettresCles() {
  const s = useStore()
  const demanderConfirmation = useConfirmation()
  const [ouvert, setOuvert] = useState(false)

  const nbActes = (lettreId: string) =>
    s.donnees.catalogue.filter((a) => a.lettreCleId === lettreId && !a.archive).length

  return (
    <div className="carte">
      <button
        type="button" className="ligne" onClick={() => setOuvert((v) => !v)}
        style={{ padding: '13px 14px' }}
      >
        <span className="principal-txt">
          <span className="titre">Valeur des lettres clés</span>
          <span className="meta">
            {s.donnees.lettresCles.map((l) => `${l.code} = ${euros(l.valeur)}`).join(' · ')}
          </span>
        </span>
        <span className="etiquette">{ouvert ? 'Fermer' : 'Modifier'}</span>
      </button>

      {ouvert && (
        <div className="carte-corps" style={{ borderTop: '1px solid var(--bordure)' }}>
          <div className="note info">
            <IconeInfo />
            <span>
              Un acte coté SF 7,5 vaut 7,5 fois la valeur de SF. Quand la
              convention revalorise la lettre clé, tu changes ce seul chiffre et
              tous tes actes suivent. Les journées déjà saisies gardent leur
              montant d'origine.
            </span>
          </div>

          {s.donnees.lettresCles.map((l) => (
            <FicheLettre
              key={l.id}
              lettre={l}
              nbActes={nbActes(l.id)}
              onSupprimer={async () => {
                const ok = await demanderConfirmation(
                  nbActes(l.id)
                    ? `Les ${nbActes(l.id)} acte(s) cotés en ${l.code} garderont leur montant actuel, mais ils ne se recalculeront plus tout seuls.`
                    : 'Cette lettre clé sera retirée.',
                  { titre: `Supprimer la lettre ${l.code} ?`, confirmer: 'Supprimer' },
                )
                if (ok) s.supprimerLettreCle(l.id)
              }}
            />
          ))}

          <button type="button" className="btn petit" onClick={() => s.ajouterLettreCle()}>
            <IconePlus /> Ajouter une lettre clé
          </button>
        </div>
      )}
    </div>
  )
}

function FicheLettre({
  lettre, nbActes, onSupprimer,
}: {
  lettre: LettreCle
  nbActes: number
  onSupprimer: () => void
}) {
  const s = useStore()
  const maj = (l: Partial<LettreCle>) => s.majLettreCle(lettre.id, l)

  return (
    <div className="carte-corps" style={{ background: 'var(--surface-2)', borderRadius: 8 }}>
      <div className="champs deux">
        <label>
          Lettre
          <input
            type="text" value={lettre.code} maxLength={6}
            onChange={(e) => maj({ code: e.target.value.toUpperCase() })}
          />
        </label>
        <label>
          Valeur
          <input
            type="number" inputMode="decimal" min={0} step={0.01}
            value={lettre.valeur}
            onChange={(e) => maj({ valeur: versNombre(e.target.value) })}
          />
        </label>
      </div>
      <label>
        À quoi elle sert
        <input
          type="text" value={lettre.libelle}
          onChange={(e) => maj({ libelle: e.target.value })}
        />
      </label>
      <div className="actions fin">
        <span style={{ flex: 1, fontSize: '.76rem', color: 'var(--texte-doux)', alignSelf: 'center' }}>
          {nbActes} acte(s) cotés avec cette lettre
        </span>
        <button type="button" className="btn petit danger" onClick={onSupprimer}>
          <IconeCorbeille /> Supprimer
        </button>
      </div>
    </div>
  )
}

/* --- Un acte du catalogue ------------------------------------------------ */

function FicheActe({ acte }: { acte: ActeCatalogue }) {
  const s = useStore()
  const demanderConfirmation = useConfirmation()
  const [deplie, setDeplie] = useState(false)
  const lettres = s.donnees.lettresCles
  const maj = (a: Partial<ActeCatalogue>) => s.majActe(acte.id, a)
  const utilise = s.donnees.journees.some((j) => j.lignes.some((l) => l.acteId === acte.id))
  const auCoefficient = acte.tarification === 'coefficient'

  return (
    <div>
      <div className="ligne">
        <button
          type="button"
          className="btn discret petit icone"
          aria-label={acte.favori ? 'Retirer des favoris' : 'Mettre en favori'}
          aria-pressed={acte.favori}
          onClick={() => maj({ favori: !acte.favori })}
          style={{ color: acte.favori ? 'var(--accent-texte)' : 'var(--texte-faible)' }}
        >
          <IconeEtoile pleine={acte.favori} />
        </button>
        <button
          type="button"
          onClick={() => setDeplie((v) => !v)}
          style={{ flex: 1, minWidth: 0, background: 'none', border: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0 }}
        >
          <div className="titre">{acte.libelle || '(sans nom)'}</div>
          <div className="meta">
            {cotation(acte, lettres) || 'sans cotation'}
            {acte.archive && ' · archivé'}
            {acte.note && ` · ${acte.note}`}
          </div>
        </button>
        <span className="montant">
          {euros(tarifCatalogue(acte, lettres))}
          {acte.unite === 'km' && <span style={{ fontWeight: 500 }}> /km</span>}
        </span>
      </div>

      {deplie && (
        <div className="carte-corps" style={{ background: 'var(--surface-2)' }}>
          <label>
            Nom de l'acte
            <input
              type="text" value={acte.libelle}
              onChange={(e) => maj({ libelle: e.target.value })}
            />
          </label>

          <div className="puces" role="group" aria-label="Mode de tarification">
            <button
              type="button" className="puce" aria-pressed={auCoefficient}
              onClick={() =>
                maj({
                  tarification: 'coefficient',
                  lettreCleId: acte.lettreCleId ?? lettres[0]?.id,
                  coefficient: acte.coefficient ?? 1,
                })
              }
            >
              Coté au coefficient
            </button>
            <button
              type="button" className="puce" aria-pressed={!auCoefficient}
              onClick={() =>
                // On conserve le montant calculé, pour ne pas repartir de zéro.
                maj({ tarification: 'forfait', tarif: tarifCatalogue(acte, lettres) })
              }
            >
              Montant fixe
            </button>
          </div>

          {auCoefficient ? (
            <>
              <div className="champs deux">
                <label>
                  Lettre clé
                  <select
                    value={acte.lettreCleId ?? ''}
                    onChange={(e) => maj({ lettreCleId: e.target.value })}
                  >
                    {lettres.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} ({euros(l.valeur)})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Coefficient
                  <input
                    type="number" inputMode="decimal" min={0} step={0.5}
                    value={acte.coefficient ?? 0}
                    onChange={(e) => maj({ coefficient: versNombre(e.target.value) })}
                  />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--texte-doux)' }}>
                {cotation(acte, lettres)} = <strong>{euros(tarifCatalogue(acte, lettres))}</strong>
              </p>
            </>
          ) : (
            <div className="champs deux">
              <label>
                Code
                <input
                  type="text" value={acte.code}
                  onChange={(e) => maj({ code: e.target.value })}
                />
              </label>
              <label>
                Montant {acte.unite === 'km' ? '(par km)' : ''}
                <input
                  type="number" inputMode="decimal" min={0} step={0.05}
                  value={acte.tarif}
                  onChange={(e) => maj({ tarif: versNombre(e.target.value) })}
                />
              </label>
            </div>
          )}

          <label>
            Catégorie
            <select
              value={acte.categorie}
              onChange={(e) => {
                const categorie = e.target.value as Categorie
                maj({ categorie, unite: categorie === 'ik' ? 'km' : 'acte' })
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          <div className="actions fin">
            <button type="button" className="btn petit" onClick={() => maj({ archive: !acte.archive })}>
              {acte.archive ? 'Réactiver' : 'Archiver'}
            </button>
            <button
              type="button" className="btn petit danger"
              onClick={async () => {
                const ok = await demanderConfirmation(
                  utilise
                    ? 'Cet acte est utilisé dans des journées déjà saisies. Les montants déjà notés seront conservés : seul le catalogue change.'
                    : 'Cet acte sera retiré de ton catalogue.',
                  { titre: `Supprimer « ${acte.libelle || acte.code} » ?`, confirmer: 'Supprimer' },
                )
                if (ok) s.supprimerActe(acte.id)
              }}
            >
              <IconeCorbeille /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
