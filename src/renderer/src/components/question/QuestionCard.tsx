import LatexText from '../LatexText'

interface QuestionCardProps {
  /** Phrases de la question, déjà découpées par la page. */
  sentences: string[]
  /** Nombre de phrases actuellement révélées (1 au minimum). */
  visible: number
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
 * Carte de question : à l'image du mobile, elle n'affiche QUE le texte de la
 * question, révélé phrase par phrase. Les infos (thème, maîtrise, source,
 * dates…) ne sont plus sur la carte : elles vivent dans le menu Détails du
 * header. Chaque phrase passe par <LatexText> : les segments $..$ / $$..$$
 * sont rendus en KaTeX, le reste en texte natif.
 */
function QuestionCard({ sentences, visible }: QuestionCardProps): React.JSX.Element {
  return (
    <article className="question-card">
      <p className="question-text" spellCheck={false}>
        {sentences.map((sentence, index) => (
          <LatexText key={index} className={sentenceClass(index, visible)}>
            {`${sentence} `}
          </LatexText>
        ))}
      </p>
    </article>
  )
}

export default QuestionCard
