import { useEffect } from 'react'
import type { ReactNode } from 'react'

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

/**
 * Menu « Détails » de la question courante (déclenché par le bouton Info du
 * header). Affiche les mêmes infos que le mobile : Thème, Maîtrise, Source,
 * Créée le, Mise à jour, Posée, Dernière réponse.
 */
function DetailsMenu({
  opened,
  onClose,
  onBackdrop,
  children
}: {
  opened: boolean
  onClose: () => void
  onBackdrop: () => void
  children: ReactNode
}): React.JSX.Element | null {
  // La touche Espace (ou Échap) ferme le menu quand il est ouvert.
  useEffect(() => {
    if (!opened) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [opened, onClose])

  if (!opened) return null
  return (
    <div className="details-overlay" onClick={onBackdrop}>
      <div className="details-card" onClick={(event) => event.stopPropagation()}>
        <div className="details-head">
          <span className="details-title">Détails de la question</span>
          <button type="button" className="details-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
        <button type="button" className="details-done" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}

export default DetailsMenu
export { DetailRow }
