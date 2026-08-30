import type { Totaux } from '../domain/calcul'
import type { Contrat } from '../domain/types'
import { euros, pourcent } from '../domain/format'

/**
 * Détail du calcul, dans l'ordre de la feuille papier :
 * actes + majorations + ID + IK = brut, moins la rétrocession = net.
 * Les postes exclus de l'assiette sont signalés pour lever toute ambiguïté.
 */
export function DetailTotaux({
  totaux, contrat, provision,
}: {
  totaux: Totaux
  contrat: Contrat | undefined
  provision?: { taux: number }
}) {
  const a = contrat?.assiette ?? { majorations: false, id: false, ik: false }
  const taux = contrat?.tauxRetrocession ?? 0
  const misDeCote = provision ? Math.round(totaux.net * provision.taux * 100) / 100 : 0

  return (
    <div className="totaux">
      <Poste libelle="Actes cotés" valeur={totaux.actes} />
      {totaux.majorations > 0 && (
        <Poste libelle="Majorations (férié, nuit)" valeur={totaux.majorations} horsAssiette={!a.majorations} />
      )}
      {totaux.id > 0 && (
        <Poste libelle="Indemnités de déplacement" valeur={totaux.id} horsAssiette={!a.id} />
      )}
      {totaux.ik > 0 && (
        <Poste libelle="Indemnités kilométriques" valeur={totaux.ik} horsAssiette={!a.ik} />
      )}

      <div className="total-ligne somme">
        <span className="libelle">Total encaissé</span>
        <span className="valeur">{euros(totaux.brut)}</span>
      </div>

      <div className="total-ligne">
        <span className="libelle">Base de la rétrocession</span>
        <span className="valeur">{euros(totaux.assiette)}</span>
      </div>

      <div className="total-ligne retro">
        <span className="libelle">Rétrocession ({pourcent(taux)})</span>
        <span className="valeur">- {euros(totaux.retrocession)}</span>
      </div>

      <div className="total-ligne net">
        <span className="libelle">Il te reste</span>
        <span className="valeur">{euros(totaux.net)}</span>
      </div>

      {provision && provision.taux > 0 && (
        <div className="total-ligne">
          <span className="libelle">À mettre de côté ({pourcent(provision.taux)})</span>
          <span className="valeur">{euros(misDeCote)}</span>
        </div>
      )}
    </div>
  )
}

function Poste({
  libelle, valeur, horsAssiette,
}: { libelle: string; valeur: number; horsAssiette?: boolean }) {
  return (
    <div className={`total-ligne${horsAssiette ? ' hors-assiette' : ''}`}>
      <span className="libelle">{libelle}</span>
      <span className="valeur">{euros(valeur)}</span>
    </div>
  )
}
