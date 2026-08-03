import { useEffect, useState } from 'react'

/** Élément interactif : ne pas lui voler la touche Espace (bouton, champ…). */
function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLButtonElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/**
 * Révèle une question phrase par phrase, au rythme de la touche Espace.
 *
 * L'état est rattaché à la clé de session de la question affichée : quand
 * celle-ci change, la révélation repart immédiatement à la première phrase,
 * sans jamais montrer un bout de la question précédente (pas de flash ni de
 * remise à zéro différée). La clé est fournie par la page (un compteur
 * incrémenté à chaque question reçue) : elle change donc même si le serveur
 * renvoie une question de même id.
 *
 * Dès que la dernière phrase s'affiche, le hook appelle `onRevealComplete`
 * (typiquement pour rendre le focus à la zone de réponse), et ne touche plus à
 * la révélation.
 *
 * @param sessionKey         identifiant de la session (null si aucune question)
 * @param sentenceCount      nombre de phrases de la question ; borne haute de la révélation
 * @param onRevealComplete   appelé dès que la dernière phrase est affichée
 * @returns nombre de phrases actuellement visibles
 */
export function useSentenceReveal(
  sessionKey: number | null,
  sentenceCount: number,
  onRevealComplete?: () => void
): number {
  const [reveal, setReveal] = useState<{ sessionKey: number | null; visible: number }>({
    sessionKey: null,
    visible: 1
  })

  // La valeur lue dépend de la session courante : hors session, ou si l'état
  // appartient encore à une ancienne session, on reste à la première phrase.
  const visible = sessionKey !== null && reveal.sessionKey === sessionKey ? reveal.visible : 1

  // Espace → phrase suivante, une par une, jusqu'à la fin de la question.
  useEffect(() => {
    if (sessionKey === null) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== 'Space') return
      if (isInteractive(event.target)) return
      event.preventDefault()
      // Plus de phrases à révéler : on passe la main (focus sur la réponse).
      if (visible >= sentenceCount) {
        onRevealComplete?.()
        return
      }
      setReveal((prev) => ({
        sessionKey,
        visible: Math.min((prev.sessionKey === sessionKey ? prev.visible : 1) + 1, sentenceCount)
      }))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sessionKey, sentenceCount, visible, onRevealComplete])

  // La dernière phrase vient d'être affichée : on passe la main dès maintenant,
  // sans attendre une nouvelle touche Espace.
  useEffect(() => {
    if (sessionKey !== null && visible >= sentenceCount) {
      onRevealComplete?.()
    }
  }, [sessionKey, sentenceCount, visible, onRevealComplete])

  return visible
}
