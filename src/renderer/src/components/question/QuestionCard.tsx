import type { Question as QuestionItem } from '../../../../shared/types'

interface QuestionCardProps {
  question: QuestionItem
  /** Nom du cours résolu depuis courseId ; repli sur "Cours <id>" si inconnu. */
  courseName?: string
  /** Phrases de la question, déjà découpées par la page. */
  sentences: string[]
  /** Nombre de phrases actuellement révélées (1 au minimum). */
  visible: number
}

/** Date au format français court (jj/mm/aaaa). */
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Classe CSS d'une phrase selon sa position par rapport à la révélation :
 *  - la phrase en cours d'affichage est surlignée (highlight) ;
 *  - les phrases pas encore révélées sont invisibles (hidden) mais gardent leur
 *    place : la carte garde ainsi sa taille, quelle que soit la progression.
 */
function sentenceClass(index: number, visible: number): string {
  if (index === visible - 1) return 'sentence highlight'
  if (index >= visible) return 'sentence hidden'
  return 'sentence'
}

/**
 * Carte de question : en-tête avec les petites infos (thème, id, maîtrise,
 * source, dates) puis le texte de la question, révélé phrase par phrase.
 */
function QuestionCard({
  question,
  courseName,
  sentences,
  visible
}: QuestionCardProps): React.JSX.Element {
  return (
    <article className="question-card">
      <div className="question-info">
        {/* Colonne gauche : thème, id + maîtrise, source */}
        <div className="question-info-column">
          <p className="info-row">
            <span className="info-pair">
              <span className="info-label">Thème</span>
              <span className="info-value">{courseName ?? `Cours ${question.courseId}`}</span>
            </span>
          </p>
          <p className="info-row">
            <span className="info-pair">
              <span className="info-label">Id</span>
              <span className="info-value">#{question.id}</span>
            </span>
            <span className="info-pair">
              <span className="info-label">Maîtrise</span>
              <span className="info-value">{question.grade}</span>
            </span>
          </p>
          <p className="info-row">
            <span className="info-pair">
              <span className="info-label">Source</span>
              <span className="info-value">{question.source}</span>
            </span>
          </p>
        </div>

        {/* Colonne droite : dates de création et de dernière pose */}
        <div className="question-info-column">
          <p className="info-row">
            <span className="info-pair">
              <span className="info-label">Créée le</span>
              <span className="info-value">{formatDate(question.createdAt)}</span>
            </span>
          </p>
          <p className="info-row">
            <span className="info-pair">
              <span className="info-label">Dernière posée</span>
              <span className="info-value">
                {question.lastAskedAt ? formatDate(question.lastAskedAt) : 'Jamais'}
              </span>
            </span>
          </p>
        </div>
      </div>

      {/* Texte de la question, phrase par phrase (révélation pilotée par la page) */}
      <p className="question-text">
        {sentences.map((sentence, index) => (
          <span key={index} className={sentenceClass(index, visible)}>
            {sentence}{' '}
          </span>
        ))}
      </p>
    </article>
  )
}

export default QuestionCard
