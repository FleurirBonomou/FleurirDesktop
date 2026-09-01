import { useMemo } from 'react'
import katex from 'katex'
import { parseLatexSegments, type LatexSegment } from '../lib/latexSegments'

interface LatexTextProps {
  /** Texte pouvant contenir du LaTeX délimité par $...$ ou $$...$$. */
  children: string
  /** Classe du span englobant (portée telle quelle par la phrase ou l'option). */
  className?: string
}

/**
 * Rendu d'une string en mélangeant texte simple et formules KaTeX :
 * - pas de LaTeX → la string reste un nœud texte direct dans le span englobant
 *   (le texte complet reste lisible par getNodeText / getByText) ;
 * - $...$ → KaTeX inline (`displayMode: false`) ;
 * - $$...$$ → KaTeX en display (`displayMode: true`), centré sur un bloc.
 * Le rendu se fait via `katex.renderToString` : HTML généré en JS pur, injecté
 * par dangerouslySetInnerHTML (jamais de HTML utilisateur brut).
 */
export default function LatexText({ children, className }: LatexTextProps): React.JSX.Element {
  const segments = useMemo(() => parseLatexSegments(children), [children])

  // Cas le plus courant : aucun LaTeX → nœud texte direct, pas de span imbriqué.
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{segments[0].content}</span>
  }

  // help the tree-shaker / readability: renderer of the mixed segments
  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <LatexSegmentNode key={i} segment={seg} />
      ))}
    </span>
  )
}

/** Un segment rendu : texte simple en nœud direct, LaTeX via KaTeX. */
function LatexSegmentNode({ segment }: { segment: LatexSegment }): React.JSX.Element | string {
  if (segment.type === 'text') {
    return segment.content
  }
  const displayMode = segment.type === 'latex-block'
  return (
    <span
      className="latex-segment"
      dangerouslySetInnerHTML={{
        __html: renderLatex(segment.content, displayMode)
      }}
    />
  )
}

/** Rend une expression LaTeX en HTML. `displayMode` centre un bloc $$...$$. */
function renderLatex(expression: string, displayMode: boolean): string {
  return katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    errorColor: '#ff6b6b'
  })
}
