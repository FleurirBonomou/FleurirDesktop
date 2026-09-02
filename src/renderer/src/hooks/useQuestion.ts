import { useCallback, useEffect, useRef, useState } from 'react'
import type { Question as QuestionItem, QuestionStats } from '../../../shared/types'
import {
  getNextQuestion,
  updateQuestionFlag,
  deleteQuestion as apiDeleteQuestion
} from '@renderer/services/api'

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
 * @returns setFlag      bascule le flag de la question courante (persisté)
 * @returns deleteQuestion  supprime la question courante puis charge la suivante
 */
export function useQuestion(): {
  question: QuestionItem | null
  sessionKey: number | null
  stats: QuestionStats
  loading: boolean
  error: string
  reload: () => void
  loadNext: () => Promise<void>
  setFlag: () => void
  deleteQuestion: () => void
} {
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  // Toujours la question courante, lisible dans les callbacks (évite les
  // closures périmées, ex. suppression).
  const questionRef = useRef<QuestionItem | null>(null)
  const [stats, setStats] = useState<QuestionStats>({
    answeredCount: 0,
    correctCount: 0,
    dailyQuestionGoal: 0
  })
  const [epoch, setEpoch] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Synchronise le ref avec la question courante à chaque rendu.
  useEffect(() => {
    questionRef.current = question
  }, [question])

  // Charge une question. Le loader et l'erreur ne sont touchés que de façon
  // asynchrone (dans .then/.catch) : l'effet de montage qui appelle cette
  // fonction ne déclenche donc aucun setState synchrone. Résout une fois la
  // nouvelle question reçue (ou en cas d'échec), pour permettre d'enchainer.
  const loadQuestion = useCallback((): Promise<void> => {
    return getNextQuestion()
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
    void loadQuestion()
  }, [loadQuestion])

  // Charge la question suivante, sans écran de chargement (aucun flash).
  // Résout une fois la nouvelle question reçue.
  const loadNext = useCallback((): Promise<void> => {
    return loadQuestion()
  }, [loadQuestion])

  // Bascule le flag de la question courante : mise à jour mémoire immédiate
  // (optimiste) puis écriture serveur ; si l'écriture échoue, on restaure
  // l'état précédent.
  const setFlag = useCallback((): void => {
    setQuestion((current) => {
      if (current === null) return current
      const flagged = !current.flagged
      updateQuestionFlag(current.publicId, flagged).catch(() => {
        setQuestion((cur) => (cur?.id === current.id ? { ...cur, flagged: current.flagged } : cur))
      })
      return { ...current, flagged }
    })
  }, [])

  // Supprime la question courante (soft delete côté serveur) PUIS charge la
  // suivante. On attend la suppression avant de tirer comme sur le mobile :
  // l'algo exclut déjà les questions supprimées (deleted_at IS NULL).
  const deleteQuestion = useCallback((): void => {
    const publicId = questionRef.current?.publicId
    if (publicId === undefined) return
    void apiDeleteQuestion(publicId)
      .then(() => {
        setQuestion((current) => (current?.publicId === publicId ? null : current))
        loadQuestion()
      })
      .catch(() => {
        // Échec de suppression : on garde la question courante.
      })
  }, [loadQuestion])

  return {
    question,
    sessionKey: question !== null ? epoch : null,
    stats,
    loading,
    error,
    reload,
    loadNext,
    setFlag,
    deleteQuestion
  }
}
