import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'

/**
 * Boîte de dialogue de confirmation de suppression d'une question (portée du
 * mobile sur desktop). Contrôlée par le parent :
 * - `visible` ouvre/ferme ;
 * - `onCancel` referme sans rien faire ;
 * - `onConfirm` exécute la suppression (puis le parent enchaîne sur la question
 *   suivante).
 *
 * Action destructrice en rouge (« error »), texte de la question tronqué pour
 * contexte, comme sur le mobile.
 */
function DeleteConfirmModal({
  visible,
  questionLabel,
  onCancel,
  onConfirm
}: {
  visible: boolean
  /** Le texte (début) de la question à supprimer, pour contexte. */
  questionLabel: string
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element | null {
  // La touche Espace (ou Échap) annule (referme sans supprimer) quand le dialog
  // est ouvert.
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, onCancel])

  if (!visible) return null
  return (
    <div className="delete-overlay" onClick={onCancel}>
      <div className="delete-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
        <div className="delete-dialog-icon">
          <Trash2 size={22} />
        </div>
        <h2 className="delete-dialog-title">Supprimer la question ?</h2>
        <p className="delete-dialog-question">{questionLabel}</p>
        <p className="delete-dialog-hint">
          Elle sera retirée de la révision après synchronisation.
        </p>

        <div className="delete-dialog-actions">
          <button type="button" className="delete-dialog-btn delete-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="delete-dialog-btn delete-confirm" onClick={onConfirm}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
