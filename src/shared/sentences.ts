const RICH_SEGMENT_REGEX =
  /(```[\s\S]+?```|\$\$[\s\S]+?\$\$|!\[[^\]]*\]\([^)\s]+(?:["'][^"']*["'])?\)|\$(?!\$)(?:[^$\\]|\\.)+?\$)/g

/**
 * Découpe un texte en phrases sur les fins de phrase (. ! ?) suivies d'un espace.
 * Les segments riches ($...$, $$...$$, blocs de code ```..., images ![..](..))
 * sont protégés : les points internes ne déclenchent pas de découpe. Les
 * segments extraits sont remplacés par des placeholders (NUL + index) puis
 * restaurés après découpage.
 */
export function splitSentences(text: string): string[] {
  // Placeholder : NUL (« \x00 », jamais saisi par l'utilisateur) + « LATEX_n ».
  // Construit sans littéral de regex control char (ESLint no-control-regex).
  const NUL = String.fromCharCode(0)
  const placeholder = (index: number): string => `${NUL}LATEX_${index}${NUL}`
  const placeholderPattern = new RegExp(`${NUL}LATEX_(\\d+)${NUL}`, 'g')

  // Étape 1 : Extraire les segments riches et les remplacer par des placeholders
  const placeholders: string[] = []
  const protected_ = text.replace(RICH_SEGMENT_REGEX, (match) => {
    const id = placeholder(placeholders.length)
    placeholders.push(match)
    return id
  })

  // Étape 2 : Découper sur les fins de phrase
  const parts = protected_
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // Étape 3 : Restaurer les placeholders
  return parts.map((part) =>
    part.replace(placeholderPattern, (_, idx: string) => placeholders[Number(idx)])
  )
}
