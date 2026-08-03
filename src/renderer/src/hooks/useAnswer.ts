import { useState } from 'react'

/**
 * Mémorise la réponse donnée à la question courante.
 *
 * Une réponse est une chaîne : 'True'/'False' pour Vrai/Faux, le texte tapé
 * pour les questions Text. L'état est rattaché à la clé de session de la
 * question : quand celle-ci change, la réponse saisie sur l'ancienne question
 * est ignorée d'emblée (aucun résidu ne se retrouve sur la question suivante).
 * La clé est fournie par la page (un compteur incrémenté à chaque question
 * reçue) : elle change donc même si le serveur renvoie une question de même id.
 *
 * @param sessionKey identifiant de la session (null si aucune question)
 * @returns selectedAnswer : réponse donnée à la question courante (null si pas encore répondu)
 * @returns answerQuestion : enregistre la réponse pour la question courante
 */
export function useAnswer(sessionKey: number | null): {
  selectedAnswer: string | null
  answerQuestion: (value: string) => void
} {
  const [answer, setAnswer] = useState<{ sessionKey: number | null; value: string | null }>({
    sessionKey: null,
    value: null
  })

  // La valeur lue dépend de la session courante : hors session, ou si l'état
  // appartient encore à une ancienne session, on considère qu'on n'a pas répondu.
  const selectedAnswer =
    sessionKey !== null && answer.sessionKey === sessionKey ? answer.value : null

  const answerQuestion = (value: string): void => {
    setAnswer({ sessionKey, value })
  }

  return { selectedAnswer, answerQuestion }
}
