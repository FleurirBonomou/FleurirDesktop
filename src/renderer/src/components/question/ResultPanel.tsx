import type { Question as QuestionItem } from '../../../../shared/types'
import { QUESTION_TYPE_LABELS } from '../../../../shared/question-types'
import { isAnswerCorrect, expectedAnswer } from '@renderer/lib/answers'

interface ResultPanelProps {
  question: QuestionItem
  /** Réponse donnée par l'utilisateur, ou null si pas encore répondu. */
  selectedAnswer: string | null
}

/**
 * Verdict après réponse : rien tant qu'on n'a pas répondu, puis confirmation
 * d'une bonne ou d'une mauvaise réponse. La validité est évaluée par
 * isAnswerCorrect sur la réponse attendue (question.answer).
 */
function ResultPanel({ question, selectedAnswer }: ResultPanelProps): React.JSX.Element | null {
  if (selectedAnswer === null) {
    return null
  }

  const correct = isAnswerCorrect(expectedAnswer(question.answer), selectedAnswer)
  // Vrai/Faux : libellé du bouton (Vrai/Faux) ; Text/Number : mot attendu ;
  // Choix multiples : la bonne option (la première de question.answer).
  const expectedLabel =
    question.type === 'True' || question.type === 'False'
      ? QUESTION_TYPE_LABELS[question.type]
      : expectedAnswer(question.answer)

  return (
    <div className={`result-panel ${correct ? 'correct' : 'wrong'}`}>
      <p>{correct ? 'Bonne réponse !' : 'Mauvaise réponse...'}</p>
      {!correct && <p className="result-expected">Réponse attendue : {expectedLabel}</p>}
    </div>
  )
}

export default ResultPanel
