import { useCallback, useEffect, useRef, useState } from 'react'
import type { Course } from '../../../shared/types'
import { splitSentences } from '../../../shared/sentences'
import { getCourses, answerQuestion as submitAnswer } from '@renderer/services/api'
import { useQuestion } from '@renderer/hooks/useQuestion'
import { useSentenceReveal } from '@renderer/hooks/useSentenceReveal'
import { useAnswer } from '@renderer/hooks/useAnswer'
import { isAnswerCorrect, expectedAnswer, containsLatex } from '@renderer/lib/answers'
import SessionHeader from '@renderer/components/question/SessionHeader'
import QuestionToolbar from '@renderer/components/question/QuestionToolbar'
import QuestionCard from '@renderer/components/question/QuestionCard'
import QuestionCardContainer from '@renderer/components/question/QuestionCardContainer'
import AnswerPanel from '@renderer/components/question/AnswerPanel'
import TransitionScreen from '@renderer/components/question/TransitionScreen'
import DetailsMenu, { DetailRow } from '@renderer/components/question/DetailsMenu'
import DeleteConfirmModal from '@renderer/components/question/DeleteConfirmModal'

function Session(): React.JSX.Element {
  const { question, sessionKey, stats, loading, error, reload, loadNext, setFlag, deleteQuestion } =
    useQuestion()

  const [courses, setCourses] = useState<Course[]>([])
  const [transition, setTransition] = useState<{
    correct: boolean
    history: string
  } | null>(null)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [])

  const sentences = question ? splitSentences(question.question) : []

  const inputRef = useRef<HTMLInputElement>(null)
  const focusAnswerInput = useCallback((): void => {
    inputRef.current?.focus()
  }, [])
  const visible = useSentenceReveal(sessionKey, sentences.length, focusAnswerInput)
  const { selectedAnswer, answerQuestion } = useAnswer(sessionKey)

  const handleAnswer = async (value: string): Promise<void> => {
    answerQuestion(value)
    if (question !== null) {
      const expected = expectedAnswer(question.answer)
      const correct = isAnswerCorrect(expected, value, containsLatex(expected, value))
      setLastCorrect(correct)
      // On NE charge pas la suivante ici : on passe d'abord en transition (tap/timer).
      setTransition({ correct, history: question.history })
      try {
        await submitAnswer(question.id, correct)
      } catch {
        // La réponse reste enregistrée localement
      }
    }
  }

  const handleNext = (): void => {
    setTransition(null)
    loadNext()
  }

  // Suppression confirmée : on ferme le dialog puis on supprime la question
  // (soft delete côté serveur) et on enchaîne sur la suivante.
  const handleDelete = (): void => {
    setDeleteConfirmOpen(false)
    deleteQuestion()
  }

  // Verdict de la question précédente → couleur de l'anneau sur les bords de
  // l'écran quand la nouvelle question s'affiche.
  const flash: 'success' | 'error' | null =
    lastCorrect === null ? null : lastCorrect ? 'success' : 'error'

  // Pendant la transition, on n'affiche pas l'anneau (le verdict plein écran est
  // déjà visible) ; il re-apparaît au bord de l'écran à l'arrivée de la question.
  const showFlash = flash !== null && transition === null

  const courseName = question
    ? courses.find((course) => course.id === question.courseId)?.name
    : undefined

  return (
    <div className="radial-bg session-page" data-testid="session-root">
      <SessionHeader
        answeredCount={stats.answeredCount}
        dailyQuestionGoal={stats.dailyQuestionGoal}
        flagged={question?.flagged ?? false}
        onDetails={() => setDetailsOpen(true)}
        onFlag={setFlag}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      {/* Anneau aux bords de l'écran, coloré par le verdict de la réponse
          précédente ; rejoué à chaque nouvelle question (key = sessionKey). */}
      {showFlash && (
        <div key={sessionKey ?? 0} className={`flash-ring ${flash}`} aria-hidden="true" />
      )}

      {loading && <p className="question-message">Chargement…</p>}

      {!loading && error && (
        <div className="question-message error">
          <p>{error}</p>
          <button type="button" onClick={reload}>
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && question === null && (
        <p className="question-message">Aucune question disponible pour le moment.</p>
      )}

      {!loading && !error && question !== null && transition === null && (
        <div className="question-session">
          <QuestionToolbar question={question} />
          <QuestionCardContainer>
            <QuestionCard sentences={sentences} visible={visible} />
          </QuestionCardContainer>
          {/* Le panneau de réponse n'apparaît qu'une fois la question
              entièrement révélée (comme sur le mobile) : rien tant qu'il reste
              des phrases à dévoiler. */}
          {visible >= sentences.length && (
            <AnswerPanel
              question={question}
              sessionKey={sessionKey}
              disabled={selectedAnswer !== null}
              onAnswer={handleAnswer}
              inputRef={inputRef}
            />
          )}
        </div>
      )}

      {transition !== null && (
        <TransitionScreen
          correct={transition.correct}
          history={transition.history}
          autoAdvanceMs={transition.correct ? 500 : undefined}
          onNext={handleNext}
        />
      )}

      {question !== null && (
        <DetailsMenu
          opened={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onBackdrop={() => setDetailsOpen(false)}
        >
          <DetailRow label="Thème" value={courseName ?? '—'} />
          <DetailRow label="Maîtrise" value={String(question.grade)} />
          <DetailRow label="Source" value={question.source} />
          <DetailRow label="Créée le" value={formatDate(question.createdAt)} />
          <DetailRow label="Mise à jour" value={formatDate(question.updatedAt)} />
          <DetailRow label="Posée" value={`${question.askCount} fois`} />
          <DetailRow
            label="Dernière réponse"
            value={
              question.lastCorrect === null
                ? 'Jamais répondu'
                : question.lastCorrect
                  ? 'Correcte'
                  : 'Incorrecte'
            }
          />
        </DetailsMenu>
      )}

      <DeleteConfirmModal
        visible={deleteConfirmOpen}
        questionLabel={question?.question ?? ''}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/** Date au format français court (jj/mm/aaaa). */
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default Session
