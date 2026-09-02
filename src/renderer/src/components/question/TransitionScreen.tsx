import { useEffect, useState, useCallback } from 'react'
import LatexText from '../LatexText'

const SLIDE_DIRECTIONS = ['left', 'right', 'top', 'bottom'] as const
type SlideDirection = (typeof SLIDE_DIRECTIONS)[number]

const OPPOSITE: Record<SlideDirection, SlideDirection> = {
  left: 'right',
  right: 'left',
  top: 'bottom',
  bottom: 'top'
}

function randomDirection(): SlideDirection {
  return SLIDE_DIRECTIONS[Math.floor(Math.random() * SLIDE_DIRECTIONS.length)]
}

/**
 * Écran plein de transition entre deux questions (copié du mobile). S'affiche à
 * la place de la carte après une réponse :
 * - « Bon ! » (vert) si correct, « Raté... » (rouge) sinon ;
 * - le contexte de la question (question.history) en dessous UNIQUEMENT après
 *   une erreur, pour lecture ;
 * - slide-in aléatoire à l'apparition, slide-out inverse au passage à la
 *   question suivante ;
 * - bonne réponse : avance automatiquement après `autoAdvanceMs` ;
 * - erreur : pas de timer d'avance, un clic ou une touche du clavier (sauf
 *   Échap) fait passer à la question suivante (après le slide-out).
 */
const SLIDE_OUT_MS = 260

function TransitionScreen({
  correct,
  history,
  autoAdvanceMs,
  onNext
}: {
  correct: boolean
  history: string
  autoAdvanceMs?: number
  onNext: () => void
}): React.JSX.Element {
  const [direction] = useState(randomDirection)
  const [exiting, setExiting] = useState(false)

  // Déclenche le slide-out à la fin de l'auto-avance.
  useEffect(() => {
    if (autoAdvanceMs === undefined) return
    const timer = setTimeout(() => setExiting(true), autoAdvanceMs)
    return () => clearTimeout(timer)
  }, [autoAdvanceMs])

  // Après le slide-out, passe à la question suivante.
  useEffect(() => {
    if (!exiting) return
    const timer = setTimeout(onNext, SLIDE_OUT_MS)
    return () => clearTimeout(timer)
  }, [exiting, onNext])

  const triggerExit = useCallback(() => {
    if (!exiting) setExiting(true)
  }, [exiting])

  // Touche du clavier (sauf Échap) → avance à la question suivante.
  useEffect(() => {
    if (correct) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') triggerExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [correct, triggerExit])

  const slideDir = exiting ? OPPOSITE[direction] : direction
  const cls = `transition-screen slide-${exiting ? 'out' : 'in'}-${slideDir}`

  return (
    <div className={cls} onClick={triggerExit}>
      <p className={`transition-verdict ${correct ? 'correct' : 'wrong'}`}>
        {correct ? 'Bon !' : 'Raté...'}
      </p>
      {!correct && history !== '' && (
        <LatexText className="transition-history">{history}</LatexText>
      )}
      <p className="transition-hint">Touchez pour continuer</p>
    </div>
  )
}

export default TransitionScreen
