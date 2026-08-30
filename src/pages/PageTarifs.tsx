import { useState } from 'react'
import { useStore } from '../store/AppStore'
import { euros, versNombre } from '../domain/format'
import { AVERTISSEMENT_TARIFS } from '../domain/catalogue'
import type { ActeCatalogue, Categorie } from '../domain/types'
import { CATEGORIES } from '../domain/types'
import { IconeAlerte, IconeCorbeille, IconeEtoile, IconePlus } from '../components/Icones'

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
        <div className="puces" role="group" aria-label="Categorie">
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
          onClick={() => s.ajouterActe({ categorie: q ? 'acte' : categorie, libelle: 'Nouvel acte' })}
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

function FicheActe({ acte }: { acte: ActeCatalogue }) {
  const s = useStore()
  const [deplie, setDeplie] = useState(false)
  const maj = (a: Partial<ActeCatalogue>) => s.majActe(acte.id, a)
  const utilise = s.donnees.journees.some((j) => j.lignes.some((l) => l.acteId === acte.id))

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
            {acte.code || 'sans code'}
            {acte.archive && ' · archive'}
            {acte.note && ` · ${acte.note}`}
          </div>
        </button>
        <span className="montant">
          {euros(acte.tarif)}
          {acte.unite === 'km' && <span style={{ fontWeight: 500 }}> /km</span>}
        </span>
      </div>

      {deplie && (
        <div className="carte-corps" style={{ background: 'var(--surface-2)' }}>
          <div className="champs deux">
            <label>
              Code
              <input type="text" value={acte.code} onChange={(e) => maj({ code: e.target.value })} />
            </label>
            <label>
              Tarif {acte.unite === 'km' ? '(par km)' : ''}
              <input
                type="number" inputMode="decimal" min={0} step={0.05}
                value={acte.tarif}
                onChange={(e) => maj({ tarif: versNombre(e.target.value) })}
              />
            </label>
          </div>
          <label>
            Libellé
            <input
              type="text" value={acte.libelle}
              onChange={(e) => maj({ libelle: e.target.value })}
            />
          </label>
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
              {acte.archive ? 'Reactiver' : 'Archiver'}
            </button>
            <button
              type="button" className="btn petit danger"
              onClick={() => {
                const message = utilise
                  ? 'Cet acte est utilisé dans des journées déjà saisies. Les montants déjà notés seront conservés. Le supprimer du catalogue ?'
                  : 'Supprimer cet acte du catalogue ?'
                if (confirm(message)) s.supprimerActe(acte.id)
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
