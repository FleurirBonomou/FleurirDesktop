/**
 * En-tête de session : barre fixe au-dessus de la question, avec une barre de
 * progression verte (questions répondues sur l'objectif quotidien) et le score
 * du jour (bonnes réponses / questions répondues).
 */
function SessionHeader({
  correctCount,
  answeredCount,
  dailyQuestionGoal
}: {
  correctCount: number
  answeredCount: number
  dailyQuestionGoal: number
}): React.JSX.Element {
  const percent =
    dailyQuestionGoal > 0 ? Math.min(100, Math.round((answeredCount / dailyQuestionGoal) * 100)) : 0

  return (
    <div className="session-header">
      <div className="session-progress">
        <div
          className="session-progress-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={dailyQuestionGoal}
          aria-valuenow={Math.min(answeredCount, dailyQuestionGoal)}
          aria-label={`${answeredCount} question(s) sur ${dailyQuestionGoal} aujourd'hui`}
        />
      </div>
      <p className="session-score">
        {answeredCount} / {dailyQuestionGoal}
      </p>
      <p className="session-correct">
        {correctCount} / {answeredCount}
      </p>
    </div>
  )
}

export default SessionHeader
