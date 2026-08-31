import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import {
  calculerLignes, cotation, journeeVide, montantLigne, montantTotalLigne,
  tarifApplique, tarifCatalogue,
} from '../domain/calcul'
import {
  aujourdhui, dateLongue, decalerJour, estDimanche, euros, versNombre,
} from '../domain/format'
import { nomFerie } from '../domain/feries'
import type { ActeCatalogue, Contrat, Groupe, Ligne } from '../domain/types'
import { CATEGORIES, GROUPES, dansLeGroupe } from '../domain/types'
import { DetailTotaux } from '../components/Totaux'
import { useConfirmation } from '../components/Confirmation'
import { Modale } from '../components/Modale'
import { ChoixDate } from '../components/ChoixDate'
import {
  IconeAlerte, IconeCopie, IconeCorbeille, IconeDroite, IconeGauche, IconeInfo,
  IconePlus, IconeValide,
} from '../components/Icones'
import { useRepli } from '../store/repli'
import { BasculeSection } from '../components/BasculeSection'

export function PageJour() {
  const s = useStore()
  const demanderConfirmation = useConfirmation()
  const [date, setDate] = useState(aujourdhui)
  const contratsActifs = s.donnees.contrats.filter((c) => c.actif)
  // Le premier contrat de la liste : c'est l'ordre défini dans l'écran
  // Contrats qui décide, plutôt qu'un réglage séparé à tenir à jour.
  const [contratId, setContratId] = useState(() => contratsActifs[0]?.id ?? '')
  const [choixOuvert, setChoixOuvert] = useState(false)
  const [nbAjoutes, setNbAjoutes] = useState(0)
  const [calendrierOuvert, setCalendrierOuvert] = useState(false)
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

  // Les dates déjà remplies, tous contrats confondus : le calendrier les met en
  // gras pour répondre d'un coup d'œil à « est-ce que j'ai noté mardi ? ».
  const joursRemplis = useMemo(
    () => new Set(s.donnees.journees.filter((j) => !journeeVide(j)).map((j) => j.date)),
    [s.donnees.journees],
  )

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
            <button
              type="button" className="btn choix-date"
              onClick={() => setCalendrierOuvert(true)}
            >
              {dateLongue(date)}
              {date.slice(0, 4) !== aujourdhui().slice(0, 4) && ` ${date.slice(0, 4)}`}
            </button>
            <button
              type="button" className="btn icone" aria-label="Jour suivant"
              onClick={() => setDate(decalerJour(date, 1))}
            >
              <IconeDroite />
            </button>
          </div>

          {date !== aujourdhui() && (
            <div className="actions fin">
              <button type="button" className="btn petit" onClick={() => setDate(aujourdhui())}>
                Revenir à aujourd'hui
              </button>
            </div>
          )}

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
                // Inutile sur le contrat affiché, dont le total figure juste
                // en dessous — et la place gagnée évite de rogner les pastilles.
                const sienne = s.journee(date, c.id)
                const total =
                  c.id === contrat.id ? 0 : sienne ? calculerLignes(sienne.lignes, c).brut : 0
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
                <span
                  className="puce puce-lecture"
                  title="Total de la journée, tous contrats confondus"
                >
                  {/* Le sigma tient en un caractère ; le mot reste lisible par
                      les lecteurs d'écran, pour qui « Σ » ne veut rien dire. */}
                  <span className="sr">Total de la journée : </span>
                  <span aria-hidden="true">Σ</span> {euros(totalDuJour)}
                </span>
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
                  journeeId={journee!.id}
                  contrat={contrat}
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
              Notes — aucune donnée médicale ni nominative
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

      <ChoixDate
        date={date}
        joursRemplis={joursRemplis}
        ouverte={calendrierOuvert}
        onFermer={() => setCalendrierOuvert(false)}
        onChoisir={setDate}
      />

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

/* --- Une ligne de la feuille -------------------------------------------- */

function LigneSaisie({
  ligne, journeeId, contrat,
}: {
  ligne: Ligne
  journeeId: string
  contrat: Contrat
}) {
  const s = useStore()
  const [tarifOuvert, setTarifOuvert] = useState(false)
  const [choixOuvert, setChoixOuvert] = useState(false)
  const [aideOuverte, setAideOuverte] = useState(false)
  const km = ligne.categorie === 'ik'
  const supplements = ligne.supplements ?? []
  const lettres = s.donnees.lettresCles

  // Ce qui peut se rattacher à un acte : déplacements et majorations. Un
  // supplément n'en porte pas lui-même, sans quoi la lecture s'emboîterait.
  const rattachables =
    ligne.categorie === 'acte'
      ? s.donnees.catalogue.filter((a) => !a.archive && a.categorie !== 'acte')
      : []
  const dejaLa = new Set(supplements.map((x) => x.acteId))
  const favoris = rattachables.filter((a) => a.favori && !dejaLa.has(a.id))

  const ajouter = (acte: ActeCatalogue) => {
    s.ajouterSupplement(journeeId, ligne.id, {
      acteId: acte.id,
      code: cotation(acte, lettres),
      libelle: acte.libelle,
      categorie: acte.categorie,
      quantite: acte.unite === 'km' ? 0 : 1,
      tarifUnitaire: tarifApplique(acte, contrat, lettres),
    })
    setChoixOuvert(false)
  }

  return (
    <div className="saisie">
      <div className="saisie-haut">
        <span className="titre">{ligne.libelle || ligne.code}</span>
        <span className="montant">{euros(montantTotalLigne(ligne))}</span>
      </div>

      <div className="saisie-bas">
        <Compteur
          valeur={ligne.quantite}
          km={km}
          onChange={(q) => s.majLigne(journeeId, ligne.id, { quantite: q })}
        />
        <button
          type="button" className="tarif-unitaire"
          onClick={() => setTarifOuvert((v) => !v)}
          title="Modifier le tarif de cette ligne"
        >
          {ligne.code && <strong>{ligne.code}</strong>}{' '}
          {km ? 'km ×' : '×'} {euros(ligne.tarifUnitaire)}
        </button>
        <button
          type="button" className="btn discret petit icone"
          aria-label="Supprimer la ligne"
          onClick={() => s.supprimerLigne(journeeId, ligne.id)}
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
            onChange={(e) =>
              s.majLigne(journeeId, ligne.id, { tarifUnitaire: versNombre(e.target.value) })
            }
          />
        </label>
      )}

      {supplements.map((x) => (
        <div className="supplement" key={x.id}>
          <div className="supplement-haut">
            <span className="supplement-nom">{x.libelle || x.code}</span>
            <span className="supplement-montant">{euros(montantLigne(x))}</span>
            <button
              type="button" className="btn discret petit icone"
              aria-label={`Retirer ${x.libelle}`}
              onClick={() => s.supprimerSupplement(journeeId, ligne.id, x.id)}
            >
              <IconeCorbeille />
            </button>
          </div>
          {/* Le kilométrage prend sa propre ligne : le mettre à côté du nom
              forçait à tronquer « IK plaine » en « IK pl… ». */}
          {x.categorie === 'ik' && (
            <Compteur
              petit km
              valeur={x.quantite}
              onChange={(q) => s.majSupplement(journeeId, ligne.id, x.id, { quantite: q })}
            />
          )}
        </div>
      ))}

      {rattachables.length > 0 && (
        <div className="puces saisie-puces">
          {/* Le sigle suffit sur le bouton : ces codes sont le vocabulaire
              quotidien, et le nom complet apparaît dès que l'élément est
              ajouté, sur la ligne en dessous. */}
          {favoris.map((a) => (
            <button
              key={a.id} type="button" className="puce"
              title={a.libelle} aria-label={`Ajouter ${a.libelle}`}
              onClick={() => ajouter(a)}
            >
              + {cotation(a, lettres)}
            </button>
          ))}
          <button
            type="button" className="puce puce-plus"
            aria-label="Ajouter un autre déplacement ou une majoration"
            title="Autres déplacements et majorations"
            onClick={() => setChoixOuvert(true)}
          >
            <IconePlus />
          </button>
          <button
            type="button" className="puce-aide"
            aria-label="D'où viennent ces pastilles ?"
            title="D'où viennent ces pastilles ?"
            onClick={() => setAideOuverte(true)}
          >
            <IconeInfo />
          </button>
        </div>
      )}

      <Modale
        titre="D'où viennent ces pastilles ?"
        ouverte={aideOuverte}
        onFermer={() => setAideOuverte(false)}
      >
        <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.55 }}>
          Les pastilles reprennent les déplacements et majorations que tu as mis
          en <strong>favori</strong>. Elles t'évitent d'ouvrir une liste pour ce
          que tu ajoutes tous les jours.
        </p>
        <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.55 }}>
          Pour en ajouter une ou en retirer une : va dans l'onglet{' '}
          <strong>Tarifs</strong>, choisis Déplacements ou Majorations, et touche
          l'<strong>étoile</strong> à gauche de l'élément. Une étoile pleine
          donne une pastille ici.
        </p>
        <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.55 }}>
          Le bouton <strong>+</strong> ouvre la liste complète, pour un élément
          dont tu as besoin une fois sans vouloir le mettre en favori.
        </p>
      </Modale>

      <Modale
        titre={`Ajouter à « ${ligne.libelle || ligne.code} »`}
        ouverte={choixOuvert}
        onFermer={() => setChoixOuvert(false)}
      >
        <div className="note info">
          <IconeInfo />
          <span>
            Mets un élément en favori dans l'onglet Tarifs pour l'avoir en
            pastille, sans passer par cette liste.
          </span>
        </div>
        <div className="liste" style={{ margin: '0 -14px' }}>
          {rattachables.map((a) => (
            <button
              key={a.id} type="button" className="ligne"
              disabled={dejaLa.has(a.id)}
              onClick={() => ajouter(a)}
            >
              <span className="principal-txt">
                <span className="titre">{a.libelle || a.code}</span>
                <span className="meta">
                  {cotation(a, lettres)} ·{' '}
                  {CATEGORIES.find((c) => c.value === a.categorie)?.court}
                  {dejaLa.has(a.id) && ' · déjà ajouté'}
                </span>
              </span>
              <span className="montant">
                {euros(tarifCatalogue(a, lettres))}
                {a.unite === 'km' && <span style={{ fontWeight: 500 }}> /km</span>}
              </span>
            </button>
          ))}
        </div>
      </Modale>
    </div>
  )
}

/** Le sélecteur de quantité, partagé par une ligne et par ses suppléments. */
function Compteur({
  valeur, km, petit, onChange,
}: {
  valeur: number
  km?: boolean
  petit?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className={`compteur${petit ? ' petit' : ''}`}>
      <button
        type="button" aria-label="Diminuer la quantité"
        onClick={() => onChange(Math.max(0, valeur - 1))}
      >
        −
      </button>
      <input
        type="number" inputMode="decimal" min={0} step={1}
        value={valeur}
        aria-label={km ? 'Nombre de kilomètres' : "Nombre d'actes"}
        onChange={(e) => onChange(versNombre(e.target.value))}
      />
      <button type="button" aria-label="Augmenter la quantité" onClick={() => onChange(valeur + 1)}>
        +
      </button>
      {km && <span className="compteur-unite">km</span>}
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
      : disponibles.filter((a) => dansLeGroupe(groupe, a))

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
