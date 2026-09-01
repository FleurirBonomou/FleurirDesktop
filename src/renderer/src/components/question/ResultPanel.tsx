import type { Question as QuestionItem } from '../../../../shared/types'
import { QUESTION_TYPE_LABELS } from '../../../../shared/question-types'
import { isAnswerCorrect, expectedAnswer, containsLatex } from '@renderer/lib/answers'
import LatexText from '../LatexText'

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

  const expected = expectedAnswer(question.answer)
  const correct = isAnswerCorrect(expected, selectedAnswer, containsLatex(expected, selectedAnswer))
  // Vrai/Faux : libellé du bouton (Vrai/Faux) ; Text/Number : mot attendu ;
  // Choix multiples : la bonne option (la première de question.answer).
  const expectedLabel =
    question.type === 'True' || question.type === 'False'
      ? QUESTION_TYPE_LABELS[question.type]
      : expected

  return (
    <div className={`result-panel ${correct ? 'correct' : 'wrong'}`}>
      <p>{correct ? 'Bonne réponse !' : 'Mauvaise réponse...'}</p>
      {!correct && (
        <p className="result-expected" spellCheck={false}>
          {'Réponse attendue : '}
          {containsLatex(expectedLabel) ? <LatexText>{expectedLabel}</LatexText> : expectedLabel}
        </p>
      )}
    </div>
  )
}

export default ResultPanel
