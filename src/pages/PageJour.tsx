import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import {
  calculerLignes, cotation, montantLigne, tarifApplique, tarifCatalogue,
} from '../domain/calcul'
import {
  aujourdhui, dateLongue, decalerJour, estDimanche, euros, versNombre,
} from '../domain/format'
import { nomFerie } from '../domain/feries'
import { aVerifier } from '../domain/catalogue'
import type { ActeCatalogue, Groupe, Ligne } from '../domain/types'
import { CATEGORIES, GROUPES, categoriesDuGroupe } from '../domain/types'
import { DetailTotaux } from '../components/Totaux'
import { useConfirmation } from '../components/Confirmation'
import { Modale } from '../components/Modale'
import {
  IconeAlerte, IconeChevron, IconeCopie, IconeCorbeille, IconeDroite, IconeGauche,
  IconePlus, IconeValide,
} from '../components/Icones'
import { useRepli } from '../store/repli'

export function PageJour() {
  const s = useStore()
  const demanderConfirmation = useConfirmation()
  const [date, setDate] = useState(aujourdhui)
  const contratsActifs = s.donnees.contrats.filter((c) => c.actif)
  const [contratId, setContratId] = useState(
    () => s.donnees.reglages.contratParDefautId ?? contratsActifs[0]?.id ?? '',
  )
  const [choixOuvert, setChoixOuvert] = useState(false)
  const [nbAjoutes, setNbAjoutes] = useState(0)
  const [dernierAjout, setDernierAjout] = useState<string | null>(null)
  const [actesReplies, basculerActes] = useRepli('jour-actes')
  const [totalReplie, basculerTotal] = useRepli('jour-total')
  // Les notes servent rarement : repliées d'origine, elles restent ouvertes
  // ensuite si on les ouvre une fois.
  const [notesRepliees, basculerNotes] = useRepli('jour-notes', true)
  const [copieOuverte, setCopieOuverte] = useState(false)

  const contrat =
    s.donnees.contrats.find((c) => c.id === contratId) ?? contratsActifs[0] ?? s.donnees.contrats[0]
  const journee = contrat ? s.journee(date, contrat.id) : undefined
  const lignes = journee?.lignes ?? []
  const totaux = useMemo(() => calculerLignes(lignes, contrat), [lignes, contrat])

  const ferie = nomFerie(date)
  const dimanche = estDimanche(date)

  const totalDuJour = s.donnees.journees
    .filter((j) => j.date === date)
    .reduce((somme, j) => {
      const c = s.donnees.contrats.find((x) => x.id === j.contratId)
      return somme + calculerLignes(j.lignes, c).brut
    }, 0)

  if (!contrat) {
    return (
      <div className="carte">
        <div className="vide">
          <strong>Aucun contrat</strong>
          Crée d'abord un contrat dans l'onglet Contrats : c'est lui qui porte
          ton pourcentage de rétrocession.
        </div>
      </div>
    )
  }

  // La liste reste ouverte : une consultation avec frottis, c'est trois
  // lignes (C + MSF + acte CCAM), autant les enchaîner d'un même geste.
  const ajouter = (acte: ActeCatalogue) => {
    setNbAjoutes((n) => n + 1)
    setDernierAjout(acte.libelle || acte.code)
    s.ajouterLigne(date, contrat.id, {
      acteId: acte.id,
      // On fige la cotation et le tarif du jour : la ligne reste lisible même
      // si la lettre clé est revalorisée plus tard.
      code: cotation(acte, s.donnees.lettresCles),
      libelle: acte.libelle,
      categorie: acte.categorie,
      quantite: 1,
      tarifUnitaire: tarifApplique(acte, contrat, s.donnees.lettresCles),
    })
  }

  return (
    <>
      {/* Navigation dans les jours */}
      <div className="carte">
        <div className="carte-corps">
          <div className="navigateur">
            <button
              type="button" className="btn icone" aria-label="Jour précédent"
              onClick={() => setDate(decalerJour(date, -1))}
            >
              <IconeGauche />
            </button>
            <div className="courant">
              <label className="sr" htmlFor="date-jour">Date</label>
              <input
                id="date-jour" type="date" value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                style={{ textAlign: 'center' }}
              />
            </div>
            <button
              type="button" className="btn icone" aria-label="Jour suivant"
              onClick={() => setDate(decalerJour(date, 1))}
            >
              <IconeDroite />
            </button>
          </div>

          <div className="actions">
            <span style={{ flex: 1, fontSize: '.85rem', color: 'var(--texte-doux)', alignSelf: 'center' }}>
              {dateLongue(date)}
            </span>
            {date !== aujourdhui() && (
              <button type="button" className="btn petit" onClick={() => setDate(aujourdhui())}>
                Aujourd'hui
              </button>
            )}
          </div>

          {(ferie || dimanche) && (
            <div className="note">
              <IconeAlerte />
              <span>
                {ferie ? `${ferie} — jour férié.` : 'Dimanche.'} Pense à ajouter
                la majoration si tu as travaillé.
              </span>
            </div>
          )}

          {contratsActifs.length > 1 && (
            <div className="ligne-contrats">
              <div className="puces" role="group" aria-label="Contrat">
              {contratsActifs.map((c) => {
                // Le montant déjà noté pour ce contrat ce jour-là : sans lui, on
                // croit sa journée vide alors qu'elle est saisie sur l'autre.
                const sienne = s.journee(date, c.id)
                const total = sienne ? calculerLignes(sienne.lignes, c).brut : 0
                return (
                  <button
                    key={c.id} type="button" className="puce"
                    aria-pressed={c.id === contrat.id}
                    onClick={() => setContratId(c.id)}
                  >
                    {c.nom}
                    {total > 0 && <span className="puce-montant">{euros(total)}</span>}
                  </button>
                )
              })}
              </div>

              {/* Hors de la rangée qui défile : le total de la date, tous
                  contrats confondus, doit rester visible en permanence. */}
              {totalDuJour > 0 && (
                <span className="puce puce-lecture">Total {euros(totalDuJour)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feuille du jour */}
      <div className="carte">
        <header>
          <BasculeSection
            titre="Actes de la journée"
            replie={actesReplies}
            onBasculer={basculerActes}
            resume={
              lignes.length > 0
                ? `${lignes.length} ligne${lignes.length > 1 ? 's' : ''} · ${euros(totaux.brut)}`
                : undefined
            }
          />
          <button
            type="button" className="btn principal petit"
            onClick={() => { setNbAjoutes(0); setDernierAjout(null); setChoixOuvert(true) }}
          >
            <IconePlus /> Ajouter
          </button>
        </header>

        {!actesReplies &&
          (lignes.length === 0 ? (
            <div className="vide">
              <strong>Journée vide</strong>
              Appuie sur « Ajouter » pour noter ton premier acte.
            </div>
          ) : (
            <div className="liste">
              {lignes.map((l) => (
                <LigneSaisie
                  key={l.id}
                  ligne={l}
                  onQuantite={(q) => s.majLigne(journee!.id, l.id, { quantite: q })}
                  onTarif={(t) => s.majLigne(journee!.id, l.id, { tarifUnitaire: t })}
                  onSupprimer={() => s.supprimerLigne(journee!.id, l.id)}
                />
              ))}
            </div>
          ))}
      </div>

      {/* Totaux du jour */}
      {lignes.length > 0 && (
        <div className="carte">
          <header>
            <BasculeSection
              titre="Total de la journée"
              replie={totalReplie}
              onBasculer={basculerTotal}
              resume={`il te reste ${euros(totaux.net)}`}
            />
          </header>
          {!totalReplie && (
          <div className="carte-corps">
            <DetailTotaux
              totaux={totaux}
              contrat={contrat}
              provision={
                s.donnees.reglages.afficherProvision
                  ? { taux: s.donnees.reglages.tauxProvision }
                  : undefined
              }
            />
          </div>
          )}
        </div>
      )}

      {/* Notes et actions */}
      {journee && (
        <div className="carte">
          <header>
            <BasculeSection
              titre="Notes et actions"
              replie={notesRepliees}
              onBasculer={basculerNotes}
              resume={journee.notes?.trim() || undefined}
            />
          </header>
          {!notesRepliees && (
          <div className="carte-corps">
            <label>
              Notes (pas de nom ni d'information médicale)
              <textarea
                value={journee.notes ?? ''}
                placeholder="Ex : remplacement à la journée, cabinet fermé le matin"
                onChange={(e) => s.majNotesJournee(journee.id, e.target.value)}
              />
            </label>
            <div className="actions">
              <button type="button" className="btn petit" onClick={() => setCopieOuverte(true)}>
                <IconeCopie /> Copier vers un autre jour
              </button>
              <button
                type="button" className="btn petit danger"
                onClick={async () => {
                  const ok = await demanderConfirmation(
                    'Toutes les lignes de cette journée seront effacées.',
                    { titre: 'Vider la journée ?', confirmer: 'Vider' },
                  )
                  if (ok) s.supprimerJournee(journee.id)
                }}
              >
                <IconeCorbeille /> Vider la journée
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      <ChoixActe
        ouverte={choixOuvert}
        nbAjoutes={nbAjoutes}
        dernierAjout={dernierAjout}
        onEffacerConfirmation={() => setDernierAjout(null)}
        onFermer={() => setChoixOuvert(false)}
        onChoisir={ajouter}
      />

      {journee && (
        <CopieJournee
          ouverte={copieOuverte}
          dateSource={date}
          onFermer={() => setCopieOuverte(false)}
          onCopier={(vers) => {
            s.dupliquerJournee(journee.id, vers)
            setCopieOuverte(false)
            setDate(vers)
          }}
        />
      )}
    </>
  )
}

/**
 * En-tête d'une carte qui se replie. Le résumé n'apparaît qu'une fois la carte
 * fermée : replier ne doit pas faire perdre le chiffre qu'on venait chercher.
 */
function BasculeSection({
  titre, replie, resume, onBasculer,
}: {
  titre: string
  replie: boolean
  resume?: string
  onBasculer: () => void
}) {
  return (
    <button type="button" className="bascule" onClick={onBasculer} aria-expanded={!replie}>
      <IconeChevron className={`chevron${replie ? ' replie' : ''}`} />
      <span>
        <h2>{titre}</h2>
        {replie && resume && <span className="resume">{resume}</span>}
      </span>
    </button>
  )
}

/* --- Une ligne de la feuille -------------------------------------------- */

function LigneSaisie({
  ligne, onQuantite, onTarif, onSupprimer,
}: {
  ligne: Ligne
  onQuantite: (q: number) => void
  onTarif: (t: number) => void
  onSupprimer: () => void
}) {
  const [tarifOuvert, setTarifOuvert] = useState(false)
  const km = ligne.categorie === 'ik'
  const pas = km ? 1 : 1

  return (
    <div className="saisie">
      <div className="saisie-haut">
        <span className="titre">{ligne.libelle || ligne.code}</span>
        <span className="montant">{euros(montantLigne(ligne))}</span>
      </div>

      <div className="saisie-bas">
        <div className="compteur">
          <button
            type="button" aria-label="Diminuer la quantité"
            onClick={() => onQuantite(Math.max(0, ligne.quantite - pas))}
          >
            −
          </button>
          <input
            type="number" inputMode="decimal" min={0} step={pas}
            value={ligne.quantite}
            aria-label={km ? 'Nombre de kilomètres' : "Nombre d'actes"}
            onChange={(e) => onQuantite(versNombre(e.target.value))}
          />
          <button
            type="button" aria-label="Augmenter la quantité"
            onClick={() => onQuantite(ligne.quantite + pas)}
          >
            +
          </button>
        </div>

        <button
          type="button" className="tarif-unitaire"
          onClick={() => setTarifOuvert((v) => !v)}
          title="Modifier le tarif de cette ligne"
        >
          {/* La cotation vaut autant que le montant : c'est elle qu'on relit. */}
          {ligne.code && <strong>{ligne.code}</strong>}{' '}
          {km ? 'km ×' : '×'} {euros(ligne.tarifUnitaire)}
        </button>

        <button
          type="button" className="btn discret petit icone"
          aria-label="Supprimer la ligne" onClick={onSupprimer}
        >
          <IconeCorbeille />
        </button>
      </div>

      {tarifOuvert && (
        <label className="saisie-tarif">
          Tarif unitaire pour cette ligne uniquement
          <input
            type="number" inputMode="decimal" min={0} step={0.05}
            value={ligne.tarifUnitaire}
            onChange={(e) => onTarif(versNombre(e.target.value))}
          />
        </label>
      )}
    </div>
  )
}

/* --- Choix d'un acte dans le catalogue ----------------------------------- */

function ChoixActe({
  ouverte, nbAjoutes, dernierAjout, onEffacerConfirmation, onFermer, onChoisir,
}: {
  ouverte: boolean
  nbAjoutes: number
  dernierAjout: string | null
  onEffacerConfirmation: () => void
  onFermer: () => void
  onChoisir: (a: ActeCatalogue) => void
}) {
  const s = useStore()
  const [recherche, setRecherche] = useState('')
  const [groupe, setGroupe] = useState<Groupe | 'favoris'>('favoris')
  const lettres = s.donnees.lettresCles

  // La confirmation s'efface seule : c'est un accusé de réception, pas un
  // message à congédier.
  useEffect(() => {
    if (!dernierAjout) return
    const minuteur = window.setTimeout(onEffacerConfirmation, 2200)
    return () => window.clearTimeout(minuteur)
  }, [dernierAjout, nbAjoutes, onEffacerConfirmation])

  const disponibles = s.donnees.catalogue.filter((a) => !a.archive)
  const q = recherche.trim().toLowerCase()

  const resultats = q
    ? disponibles.filter(
        (a) => a.libelle.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
      )
    : groupe === 'favoris'
      ? disponibles.filter((a) => a.favori)
      : disponibles.filter((a) => categoriesDuGroupe(groupe).includes(a.categorie))

  return (
    <Modale
      titre="Ajouter à la journée"
      ouverte={ouverte}
      onFermer={onFermer}
      actions={
        <>
          {dernierAjout && (
            <div className="confirmation" role="status" key={nbAjoutes}>
              <IconeValide />
              {/* Tournure neutre : « ajouté » ne s'accorde pas avec le nom de
                  l'acte, qui peut être masculin ou féminin. */}
              <span>Ajouté : {dernierAjout}</span>
            </div>
          )}
        <div className="actions">
          <span style={{ flex: 1, alignSelf: 'center', fontSize: '.85rem', fontWeight: 600 }}>
            {nbAjoutes === 0
              ? 'Touche un acte pour l\'ajouter'
              : `${nbAjoutes} ligne${nbAjoutes > 1 ? 's' : ''} ajoutée${nbAjoutes > 1 ? 's' : ''}`}
          </span>
          <button type="button" className="btn principal" onClick={onFermer}>
            Terminé
          </button>
        </div>
        </>
      }
    >
      <input
        type="text" placeholder="Rechercher un acte, un code..."
        value={recherche} onChange={(e) => setRecherche(e.target.value)}
        autoComplete="off"
      />

      {!q && (
        <div className="puces" role="group" aria-label="Filtrer">
          <button
            type="button" className="puce" aria-pressed={groupe === 'favoris'}
            onClick={() => setGroupe('favoris')}
          >
            Mes favoris
          </button>
          {GROUPES.map((g) => (
            <button
              key={g.value} type="button" className="puce"
              aria-pressed={groupe === g.value}
              onClick={() => setGroupe(g.value)}
            >
              {g.court}
            </button>
          ))}
        </div>
      )}

      <div className="liste" style={{ margin: '0 -14px' }}>
        {resultats.length === 0 ? (
          <div className="vide">
            {groupe === 'favoris' && !q
              ? "Aucun favori. Marque tes actes courants d'une étoile dans l'onglet Tarifs."
              : 'Aucun résultat.'}
          </div>
        ) : (
          resultats.map((a) => (
            <button key={a.id} type="button" className="ligne" onClick={() => onChoisir(a)}>
              <div className="principal-txt">
                <div className="titre">{a.libelle || a.code}</div>
                <div className="meta">
                  {cotation(a, lettres)} · {CATEGORIES.find((c) => c.value === a.categorie)?.court}
                </div>
              </div>
              {aVerifier(a) && <span className="etiquette alerte">à vérifier</span>}
              <span className="montant">
                {euros(tarifCatalogue(a, lettres))}
                {a.unite === 'km' && <span style={{ fontWeight: 500 }}> /km</span>}
              </span>
            </button>
          ))
        )}
      </div>
    </Modale>
  )
}

/* --- Copie d'une journée vers une autre date ----------------------------- */

function CopieJournee({
  ouverte, dateSource, onFermer, onCopier,
}: {
  ouverte: boolean
  dateSource: string
  onFermer: () => void
  onCopier: (vers: string) => void
}) {
  const [cible, setCible] = useState(() => decalerJour(dateSource, 1))

  return (
    <Modale
      titre="Copier la journée"
      ouverte={ouverte}
      onFermer={onFermer}
      actions={
        <div className="actions fin">
          <button type="button" className="btn" onClick={onFermer}>Annuler</button>
          <button type="button" className="btn principal" onClick={() => onCopier(cible)}>
            Copier
          </button>
        </div>
      }
    >
      <p style={{ color: 'var(--texte-doux)', fontSize: '.85rem' }}>
        Les lignes du {dateLongue(dateSource)} seront ajoutees a la date choisie.
      </p>
      <label>
        Copier vers le
        <input type="date" value={cible} onChange={(e) => setCible(e.target.value)} />
      </label>
    </Modale>
  )
}
