/** Découpe un texte en phrases sur les fins de phrase (. ! ?) suivies d'un espace. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}
