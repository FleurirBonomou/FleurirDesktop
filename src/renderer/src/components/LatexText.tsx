import { useMemo } from 'react'
import katex from 'katex'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating.js'
import 'prismjs/components/prism-javascript.js'
import 'prismjs/components/prism-typescript.js'
import 'prismjs/components/prism-jsx.js'
import 'prismjs/components/prism-tsx.js'
import 'prismjs/components/prism-python.js'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-css.js'
import 'prismjs/components/prism-markdown.js'
import 'prismjs/components/prism-sql.js'
import { parseLatexSegments, type LatexSegment } from '../lib/latexSegments'

interface LatexTextProps {
  /** Texte pouvant contenir du LaTeX, du code ou une image. */
  children: string
  /** Classe du span englobant (portée telle quelle par la phrase ou l'option). */
  className?: string
}

/**
 * Rendu d'une string en mélangeant texte simple, formules KaTeX, code et image :
 * - pas de segment riche → la string reste un nœud texte direct dans le span
 *   englobant (le texte complet reste lisible par getNodeText / getByText) ;
 * - $...$ → KaTeX inline (`displayMode: false`) ;
 * - $$...$$ → KaTeX en display (`displayMode: true`), centré sur un bloc ;
 * - ```lang ... ``` → bloc de code surligné avec Prism ;
 * - ![alt](url) → image.
 * Le rendu riche passe par `katex.renderToString` / `Prism.highlight` : HTML
 * généré en JS pur, injecté par dangerouslySetInnerHTML (jamais de HTML
 * utilisateur brut).
 */
export default function LatexText({ children, className }: LatexTextProps): React.JSX.Element {
  const segments = useMemo(() => parseLatexSegments(children), [children])

  // Cas le plus courant : aucun segment riche → nœud texte direct, pas de span imbriqué.
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{segments[0].content}</span>
  }

  // help the tree-shaker / readability: renderer of the mixed segments
  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <RichSegmentNode key={i} segment={seg} />
      ))}
    </span>
  )
}

/** Un segment rendu : texte direct, KaTeX, code Prism ou image. */
function RichSegmentNode({ segment }: { segment: LatexSegment }): React.JSX.Element | string {
  switch (segment.type) {
    case 'text':
      return segment.content
    case 'latex-inline':
    case 'latex-block':
      return (
        <span
          className="latex-segment"
          dangerouslySetInnerHTML={{
            __html: renderLatex(segment.content, segment.type === 'latex-block')
          }}
        />
      )
    case 'code':
      return (
        <pre className="code-block">
          <code
            className={segment.language ? `language-${segment.language}` : undefined}
            dangerouslySetInnerHTML={{ __html: renderCode(segment.content, segment.language) }}
          />
        </pre>
      )
    case 'image':
      return (
        <img
          className="content-image"
          src={toRenderableImageSrc(segment.content)}
          alt={segment.alt ?? ''}
        />
      )
  }
}

/** Convertit une URL d'image en URL affichable : file:// est bloqué en dev
 *  (Chromium interdit file: depuis http://localhost) → on le réécrit vers le
 *  custom protocol fleuri-file:// exposé par le main process.
 *  Le chemin absolu est placé dans le query (?path=...) : le parsing URL ne
 *  peut pas le mêler aux segments host/path d'un scheme "standard". */
function toRenderableImageSrc(src: string): string {
  if (!src.startsWith('file://')) return src
  const absPath = src.slice('file://'.length)
  return `fleuri-file://local/?path=${encodeURIComponent(absPath)}`
}

/** Rend une expression LaTeX en HTML. `displayMode` centre un bloc $$...$$. */
function renderLatex(expression: string, displayMode: boolean): string {
  return katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    errorColor: '#ff6b6b'
  })
}

/** Rend du code surligné avec Prism ; fallback texte brut si langue inconnue. */
function renderCode(code: string, language?: string): string {
  const lang = language?.toLowerCase() ?? ''
  const grammar = lang ? Prism.languages[lang] : null
  if (!grammar) {
    return escapeHtml(code)
  }
  try {
    return Prism.highlight(code, grammar, lang)
  } catch {
    return escapeHtml(code)
  }
}

/** Échappe le HTML pour un affichage brut sans Prism. */
function escapeHtml(code: string): string {
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
