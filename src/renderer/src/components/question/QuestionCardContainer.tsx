import type { ReactNode } from 'react'

/**
 * Conteneur de la carte courante : structure (stage + wrap) qui enveloppe le
 * contenu de la question. L'anneau de verdict (flash vert/rouge) est rendu au
 * niveau de la page entière (bords de l'écran), pas ici.
 */
function QuestionCardContainer({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="question-card-stage">
      <div className="question-card-wrap">{children}</div>
    </div>
  )
}

export default QuestionCardContainer
