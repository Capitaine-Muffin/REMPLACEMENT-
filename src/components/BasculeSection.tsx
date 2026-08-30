import { IconeChevron } from './Icones'

/**
 * En-tête d'une carte qui se replie. Le résumé n'apparaît qu'une fois la carte
 * fermée : replier ne doit pas faire perdre le chiffre qu'on venait chercher.
 */
export function BasculeSection({
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
