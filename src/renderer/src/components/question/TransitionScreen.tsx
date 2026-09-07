import { useEffect, useState, useCallback } from 'react'
import LatexText from '../LatexText'

const ANIMATION = ['left-slide', 'right-slide', 'top-slide', 'bottom-slide', 'fade'] as const
type Animation = (typeof ANIMATION)[number]

const OPPOSITE: Record<Animation, Animation> = {
  'left-slide': 'right-slide',
  'right-slide': 'left-slide',
  'top-slide': 'bottom-slide',
  'bottom-slide': 'top-slide',
  fade: 'fade'
}

function randomAnimation(): Animation {
  return ANIMATION[Math.floor(Math.random() * ANIMATION.length)]
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
// Durée minimale d'affichage avant qu'une saisie (clic/clavier) puisse déclencher
// le slide-out. Évite que l'événement qui a validé la réponse ne soit réattrapé
// ici comme une demande d'avance, ce qui ferait sortir l'écran instantanément.
const MIN_STAY_MS = 200

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
  const [animation] = useState(randomAnimation())
  const [exiting, setExiting] = useState(false)
  // vrai seulement après MIN_STAY_MS : tant que faux, les clics/touches sont
  // ignorés pour l'avance.
  const [ready, setReady] = useState(false)

  // L'écran reste au moins MIN_STAY_MS avant d'accepter une avance manuelle.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), MIN_STAY_MS)
    return () => clearTimeout(timer)
  }, [])

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
    if (ready && !exiting) setExiting(true)
  }, [ready, exiting])

  // Touche du clavier (sauf Échap) → avance à la question suivante.
  useEffect(() => {
    if (correct) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') triggerExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [correct, triggerExit])

  const animationType = exiting ? OPPOSITE[animation] : animation
  const dir = animationType.replace('-slide', '')
  const cls = `transition-screen ${dir === 'fade' ? 'fade' : 'slide'}-${exiting ? 'out' : 'in'}${dir === 'fade' ? '' : `-${dir}`}`

  return (
    <div className={cls} onClick={triggerExit}>
      <p className={`transition-verdict ${correct ? 'correct' : 'wrong'}`}>
        {correct ? 'Bon !' : 'Raté...'}
      </p>
      {!correct && history !== '' && (
        <LatexText className="transition-history">{history}</LatexText>
      )}
      {!correct && <p className="transition-hint">Touchez pour continuer</p>}
    </div>
  )
}

export default TransitionScreen
