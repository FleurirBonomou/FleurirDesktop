import type { Question as QuestionItem } from '../../../../shared/types'

/**
 * Ligne de badges contextuels de la question courante (mutuellement exclusifs,
 * par priorité) :
 * - « NouvELLE » : jamais posée (lastAskedAt === null) → 🌱
 * - « Difficile » : échec sans progression (grade === 0 && !lastCorrect) → 🌶️
 * - « Connue » : maîtrise maximale (grade === 3) → 🎉
 * Sinon (aucun cas) → rien n'est affiché.
 *
 * Priorité si plusieurs conditions sont vraies : nouvelle > difficile > connue.
 */
function QuestionToolbar({ question }: { question: QuestionItem }): React.JSX.Element | null {
  const isNew = question.lastAskedAt === null && question.grade === 0
  const isHard = question.grade === 0 && question.lastCorrect === false
  const isKnown = question.grade === 3

  if (!isNew && !isHard && !isKnown) return null

  // Choisit le badge prioritaire parmi les trois.
  const badge = isNew
    ? { emoji: '🌱', cls: 'badge-new' }
    : isHard
      ? { emoji: '🌶️', cls: 'badge-hard' }
      : { emoji: '🎉', cls: 'badge-known' }

  return (
    <div className="question-toolbar">
      <span key={badge.cls} className={`question-badge ${badge.cls}`}>
        {badge.emoji}
      </span>
    </div>
  )
}

export default QuestionToolbar
