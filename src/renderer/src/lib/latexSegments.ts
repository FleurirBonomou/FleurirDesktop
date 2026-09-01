export interface LatexSegment {
  type: 'text' | 'latex-inline' | 'latex-block'
  content: string
}

/**
 * Découpe une string en segments texte/latex. Délimiteurs supportés :
 * $$...$$ (block) puis $...$ (inline, un $ ne peut pas ouvrir un $$).
 */
export function parseLatexSegments(text: string): LatexSegment[] {
  const segments: LatexSegment[] = []
  const regex = /(\$\$[\s\S]+?\$\$|\$(?!\$)(?:[^$\\]|\\.)+?\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('$$')) {
      segments.push({ type: 'latex-block', content: raw.slice(2, -2).trim() })
    } else {
      segments.push({ type: 'latex-inline', content: raw.slice(1, -1).trim() })
    }
    lastIndex = match.index + raw.length
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return segments
}
