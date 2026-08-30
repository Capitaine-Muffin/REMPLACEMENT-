import { useState } from 'react'
import { COULEURS, useStore } from '../store/AppStore'
import { euros, pourcent, versNombre } from '../domain/format'
import { tarifApplique } from '../domain/calcul'
import type { Contrat } from '../domain/types'
import { CATEGORIES } from '../domain/types'
import { Modale } from '../components/Modale'
import { IconeCorbeille, IconeInfo, IconePlus } from '../components/Icones'

export function PageContrats() {
  const s = useStore()
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <>
      <div className="note info">
        <IconeInfo />
        <span>
          Un contrat = un cabinet ou une sage-femme que tu remplaces. C'est ici
          que tu règles ton pourcentage de rétrocession et ce qu'il concerne.
        </span>
      </div>

      {s.donnees.contrats.map((c) => (
        <FicheContrat
          key={c.id}
          contrat={c}
          ouvert={ouvert === c.id}
          onBasculer={() => setOuvert(ouvert === c.id ? null : c.id)}
        />
      ))}

      <button
        type="button" className="btn principal large"
        onClick={() => setOuvert(s.ajouterContrat().id)}
      >
        <IconePlus /> Nouveau contrat
      </button>
    </>
  )
}

function FicheContrat({
  contrat, ouvert, onBasculer,
}: {
  contrat: Contrat
  ouvert: boolean
  onBasculer: () => void
}) {
  const s = useStore()
  const [tarifsOuverts, setTarifsOuverts] = useState(false)
  const maj = (c: Partial<Contrat>) => s.majContrat(contrat.id, c)
  const nbJournees = s.donnees.journees.filter((j) => j.contratId === contrat.id).length
  const nbDepassements = Object.keys(contrat.tarifs).length

  const assietteResume = [
    contrat.assiette.majorations && 'majorations',
    contrat.assiette.id && 'ID',
    contrat.assiette.ik && 'IK',
  ].filter(Boolean)

  return (
    <div className="carte">
      <button type="button" className="ligne" onClick={onBasculer} style={{ padding: '13px 14px' }}>
        <span className="pastille" style={{ background: contrat.couleur }} />
        <span className="principal-txt">
          <span className="titre">{contrat.nom}</span>
          <span className="meta">
            {pourcent(contrat.tauxRetrocession)} sur les actes
            {assietteResume.length > 0 && ` + ${assietteResume.join(' + ')}`}
            {!contrat.actif && ' · archive'}
          </span>
        </span>
        <span className="etiquette">{ouvert ? 'Fermer' : 'Modifier'}</span>
      </button>

      {ouvert && (
        <div className="carte-corps" style={{ borderTop: '1px solid var(--bordure)' }}>
          <label>
            Nom (cabinet ou consœur remplacée)
            <input
              type="text" value={contrat.nom}
              onChange={(e) => maj({ nom: e.target.value })}
            />
          </label>

          <div>
            <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--texte-doux)' }}>
              Couleur
            </span>
            <div className="puces" style={{ marginTop: 6 }}>
              {COULEURS.map((couleur) => (
                <button
                  key={couleur} type="button"
                  aria-label={`Couleur ${couleur}`}
                  aria-pressed={contrat.couleur === couleur}
                  onClick={() => maj({ couleur })}
                  style={{
                    width: 30, height: 30, flex: 'none', borderRadius: '50%',
                    background: couleur, cursor: 'pointer',
                    border: contrat.couleur === couleur
                      ? '3px solid var(--texte)'
                      : '1px solid var(--bordure)',
                  }}
                />
              ))}
            </div>
          </div>

          <label>
            Pourcentage de rétrocession
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number" inputMode="decimal" min={0} max={100} step={0.5}
                value={Math.round(contrat.tauxRetrocession * 1000) / 10}
                onChange={(e) =>
                  maj({ tauxRetrocession: Math.min(1, Math.max(0, versNombre(e.target.value) / 100)) })
                }
                style={{ maxWidth: 120 }}
              />
              <span style={{ fontWeight: 700 }}>%</span>
            </div>
          </label>

          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            <legend style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--texte-doux)', padding: 0 }}>
              La rétrocession s'applique aussi sur…
            </legend>
            <p style={{ fontSize: '.78rem', color: 'var(--texte-faible)', margin: 0 }}>
              Les actes cotés sont toujours comptés. Coche seulement ce que ton
              contrat prévoit en plus.
            </p>
            <Interrupteur
              titre="Les majorations (férié, dimanche, nuit)"
              coche={contrat.assiette.majorations}
              onChange={(v) => maj({ assiette: { ...contrat.assiette, majorations: v } })}
            />
            <Interrupteur
              titre="Les indemnités de déplacement (ID)"
              coche={contrat.assiette.id}
              onChange={(v) => maj({ assiette: { ...contrat.assiette, id: v } })}
            />
            <Interrupteur
              titre="Les indemnités kilométriques (IK)"
              coche={contrat.assiette.ik}
              onChange={(v) => maj({ assiette: { ...contrat.assiette, ik: v } })}
            />
          </fieldset>

          <div className="champs deux">
            <label>
              Début
              <input
                type="date" value={contrat.dateDebut ?? ''}
                onChange={(e) => maj({ dateDebut: e.target.value || undefined })}
              />
            </label>
            <label>
              Fin
              <input
                type="date" value={contrat.dateFin ?? ''}
                onChange={(e) => maj({ dateFin: e.target.value || undefined })}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              value={contrat.notes ?? ''}
              placeholder="Ex : rétrocession versée le 5 du mois"
              onChange={(e) => maj({ notes: e.target.value })}
            />
          </label>

          <button type="button" className="btn" onClick={() => setTarifsOuverts(true)}>
            Tarifs spécifiques à ce contrat
            {nbDepassements > 0 && (
              <span className="etiquette accent">{nbDepassements}</span>
            )}
          </button>

          <Interrupteur
            titre="Contrat actif"
            detail="Un contrat inactif n'apparaît plus dans la saisie du jour."
            coche={contrat.actif}
            onChange={(v) => maj({ actif: v })}
          />

          <div className="actions fin">
            <button
              type="button" className="btn danger petit"
              onClick={() => {
                const message = nbJournees
                  ? `Supprimer « ${contrat.nom} » et ses ${nbJournees} journee(s) enregistree(s) ? Cette action est definitive.`
                  : `Supprimer « ${contrat.nom} » ?`
                if (confirm(message)) s.supprimerContrat(contrat.id)
              }}
            >
              <IconeCorbeille /> Supprimer
            </button>
          </div>

          <TarifsDuContrat
            contrat={contrat}
            ouverte={tarifsOuverts}
            onFermer={() => setTarifsOuverts(false)}
          />
        </div>
      )}
    </div>
  )
}

function Interrupteur({
  titre, detail, coche, onChange,
}: {
  titre: string
  detail?: string
  coche: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="interrupteur">
      <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {titre}
        {detail && <span className="detail">{detail}</span>}
      </span>
    </label>
  )
}

/**
 * Dépassements d'honoraires : un tarif propre à ce contrat, qui prend le pas
 * sur le tarif du catalogue sans le modifier pour les autres contrats.
 */
function TarifsDuContrat({
  contrat, ouverte, onFermer,
}: {
  contrat: Contrat
  ouverte: boolean
  onFermer: () => void
}) {
  const s = useStore()
  const actes = s.donnees.catalogue.filter((a) => !a.archive)

  const definir = (acteId: string, valeur: string) => {
    if (valeur.trim() === '') {
      const { [acteId]: _retire, ...reste } = contrat.tarifs
      s.majContrat(contrat.id, { tarifs: reste })
      return
    }
    s.majContrat(contrat.id, {
      tarifs: { ...contrat.tarifs, [acteId]: versNombre(valeur) },
    })
  }

  return (
    <Modale titre={`Tarifs — ${contrat.nom}`} ouverte={ouverte} onFermer={onFermer}>
      <div className="note info">
        <IconeInfo />
        <span>
          Laisse vide pour garder le tarif normal. Remplis seulement les actes
          pour lesquels ce cabinet pratique un dépassement d'honoraires.
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const duGroupe = actes.filter((a) => a.categorie === cat.value)
        if (!duGroupe.length) return null
        return (
          <div key={cat.value}>
            <h3 style={{ margin: '4px 0 8px', color: 'var(--texte-doux)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {cat.court}
            </h3>
            <div className="liste">
              {duGroupe.map((a) => {
                const perso = contrat.tarifs[a.id]
                return (
                  <div key={a.id} className="ligne">
                    <span className="principal-txt">
                      <span className="titre">{a.libelle || a.code}</span>
                      <span className="meta">Tarif normal : {euros(a.tarif)}</span>
                    </span>
                    <input
                      type="number" inputMode="decimal" min={0} step={0.05}
                      value={perso ?? ''}
                      placeholder={String(tarifApplique(a, undefined))}
                      onChange={(e) => definir(a.id, e.target.value)}
                      style={{ width: 100 }}
                      aria-label={`Tarif de ${a.libelle} pour ${contrat.nom}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </Modale>
  )
}
