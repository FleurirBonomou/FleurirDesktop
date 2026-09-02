import { Info, Flag, Pencil, Trash2 } from 'lucide-react'

/**
 * En-tête de session : barre de progression verte (remplie selon
 * answeredCount/goal) + boutons d'action (Détails, Flag, Modifier, Supprimer).
 * À l'image du mobile, aucun compteur numérique : uniquement la barre de
 * progression et les boutons d'action.
 */
function SessionHeader({
  answeredCount,
  dailyQuestionGoal,
  flagged,
  onDetails,
  onFlag,
  onDelete
}: {
  answeredCount: number
  dailyQuestionGoal: number
  flagged: boolean
  onDetails: () => void
  onFlag: () => void
  onDelete: () => void
}): React.JSX.Element {
  const percent =
    dailyQuestionGoal > 0 ? Math.min(100, Math.round((answeredCount / dailyQuestionGoal) * 100)) : 0

  return (
    <div className="session-header">
      <div className="session-progress">
        <div
          className="session-progress-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={dailyQuestionGoal}
          aria-valuenow={Math.min(answeredCount, dailyQuestionGoal)}
          aria-label={`${answeredCount} question(s) sur ${dailyQuestionGoal} aujourd'hui`}
        />
      </div>
      <div className="session-actions">
        <button type="button" className="session-action-btn" title="Détails" onClick={onDetails}>
          <Info size={18} />
        </button>
        <button
          type="button"
          className={`session-action-btn${flagged ? ' session-action-flagged' : ''}`}
          title={flagged ? 'Démarquer' : 'Marquer'}
          aria-pressed={flagged}
          onClick={onFlag}
        >
          <Flag size={18} fill={flagged ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="session-action-btn" title="Modifier" disabled>
          <Pencil size={18} />
        </button>
        <button
          type="button"
          className="session-action-btn session-action-delete"
          title="Supprimer"
          onClick={onDelete}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

export default SessionHeader
