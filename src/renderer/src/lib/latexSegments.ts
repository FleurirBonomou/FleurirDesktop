export type LatexSegment =
  | { type: 'text'; content: string }
  | { type: 'latex-inline'; content: string }
  | { type: 'latex-block'; content: string }
  | { type: 'code'; content: string; language?: string }
  | { type: 'image'; content: string; alt?: string }

const RICH_REGEX =
  /(```[\s\S]+?```|\$\$[\s\S]+?\$\$|!\[[^\]]*\]\([^)\s]+(?:["'][^"']*["'])?\)|\$(?!\$)(?:[^$\\]|\\.)+?\$)/g

/**
 * Découpe une string en segments. Délimiteurs supportés :
 * - ```lang\ncode\n``` → code (bloc de code)
 * - $$...$$ → latex-block
 * - ![alt](url) → image
 * - $...$ → latex-inline
 * - le reste → text
 * L'ordre de reconnaissance dans la boucle est important : code et blocs sont
 * matcher AVANT le $ pour qu'un $ dans du code ne soit pas lu comme du LaTeX.
 */
export function parseLatexSegments(text: string): LatexSegment[] {
  const segments: LatexSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = RICH_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    lastIndex = match.index + raw.length
    segments.push(classify(raw))
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return segments
}

/** Classe un segment brut selon son préfixe. */
function classify(raw: string): LatexSegment {
  if (raw.startsWith('```')) {
    return classifyCode(raw)
  }
  if (raw.startsWith('$$')) {
    return { type: 'latex-block', content: raw.slice(2, -2).trim() }
  }
  if (raw.startsWith('![')) {
    const alt = raw.match(/^!\[([^\]]*)\]/)?.[1] ?? ''
    const url = raw.match(/\]\(([^)\s]+)/)?.[1] ?? ''
    return { type: 'image', content: url, alt }
  }
  return { type: 'latex-inline', content: raw.slice(1, -1).trim() }
}
/** Extrait la langue optionnelle (```ts) puis le code (corps entre backticks).
 *  Gère les deux formes : multi-ligne (```lang\ncode\n```) et mono-ligne
 *  (```lang code```, la langue = premier mot du corps). */
function classifyCode(raw: string): LatexSegment {
  const body = raw.slice(3, -3)
  const firstNewline = body.indexOf('\n')
  if (firstNewline === -1) {
    const trimmed = body.trim()
    const space = trimmed.indexOf(' ')
    const firstWord = space === -1 ? '' : trimmed.slice(0, space).trim()
    const language = /^[a-zA-Z][\w+-]*$/.test(firstWord) ? firstWord : ''
    const code = language ? trimmed.slice(space + 1).trim() : trimmed
    return { type: 'code', content: code, language: language || undefined }
  }
  const language = body.slice(0, firstNewline).trim().replace(/^\s*/, '')
  const code = body.slice(firstNewline + 1).trimEnd()
  return { type: 'code', content: code, language: language || undefined }
}
