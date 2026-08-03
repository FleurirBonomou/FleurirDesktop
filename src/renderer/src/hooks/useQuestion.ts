import { useCallback, useEffect, useState } from 'react'
import type { Question as QuestionItem, QuestionStats } from '../../../shared/types'
import { getNextQuestion } from '@renderer/services/api'

/**
 * Gère la question courante : chargement depuis le serveur et identité de
 * session.
 *
 * La « clé de session » (sessionKey) est un compteur incrémenté à chaque
 * question reçue. Elle sert de clé aux hooks de révélation et de réponse :
 * quand elle change, leur état repart de zéro SANS remonter la carte (une
 * seule question-card en permanence, seul son contenu change). Elle change
 * même si le serveur renvoie une question de même id.
 *
 * @returns question     question courante (null si aucune n'est chargée)
 * @returns sessionKey   clé de session (null hors question)
 * @returns stats        stats du jour (répondues / bonnes), à jour à chaque chargement
 * @returns loading      vrai tant que la première question n'est pas chargée
 * @returns error        message d'erreur réseau (vide si tout va bien)
 * @returns reload       recharge avec écran de chargement (bouton Réessayer)
 * @returns loadNext     charge la question suivante, sans écran de chargement
 */
export function useQuestion(): {
  question: QuestionItem | null
  sessionKey: number | null
  stats: QuestionStats
  loading: boolean
  error: string
  reload: () => void
  loadNext: () => void
} {
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [stats, setStats] = useState<QuestionStats>({
    answeredCount: 0,
    correctCount: 0,
    dailyQuestionGoal: 0
  })
  const [epoch, setEpoch] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Charge une question. Le loader et l'erreur ne sont touchés que de façon
  // asynchrone (dans .then/.catch) : l'effet de montage qui appelle cette
  // fonction ne déclenche donc aucun setState synchrone.
  const loadQuestion = useCallback((): void => {
    getNextQuestion()
      .then((next) => {
        setQuestion(next.question)
        setStats(next.stats)
        setEpoch((value) => value + 1)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Impossible de charger la question')
        setLoading(false)
      })
  }, [])

  // Première question au montage.
  useEffect(() => {
    loadQuestion()
  }, [loadQuestion])

  // Recharge avec écran de chargement (bouton Réessayer) : le loader est déjà
  // affiché, on le laisse en place et on efface le message d'erreur.
  const reload = useCallback((): void => {
    setLoading(true)
    setError('')
    loadQuestion()
  }, [loadQuestion])

  // Charge la question suivante, sans écran de chargement (aucun flash).
  const loadNext = useCallback((): void => {
    loadQuestion()
  }, [loadQuestion])

  return {
    question,
    sessionKey: question !== null ? epoch : null,
    stats,
    loading,
    error,
    reload,
    loadNext
  }
}
