/**
 * Teste si une réponse donnée est la bonne pour une question.
 *
 * La réponse attendue est question.answer : 'True'/'False' (ou 'Vrai'/'Faux')
 * pour Vrai/Faux, le mot à taper pour les questions Text/Number. La comparaison
 * ignore la casse et les espaces autour du mot, et accepte Vrai/Faux indifféremment
 * en français ou en anglais. Pour « Choix multiples », seule la première option
 * de question.answer (séparée par « :=: ») est la bonne.
 */
export function isAnswerCorrect(expectedAnswer: string, answer: string, latex = false): boolean {
  return normalize(answer, latex) === normalize(expectedAnswer, latex)
}

/** Détecte des délimiteurs LaTeX ($...$) dans une ou plusieurs chaînes. */
export function containsLatex(...values: string[]): boolean {
  return values.some((value) => value.includes('$'))
}

/** Séparateur des réponses possibles d'une question « Choix multiples »,
 *  stockées dans question.answer : '1961:=:1962:=:1963'. */
export const MULTIPLE_CHOICE_SEPARATOR = ':=:'

/** Réponse attendue d'une question : pour « Choix multiples », la bonne
 *  réponse est la première option ; sinon question.answer telle quelle. */
export function expectedAnswer(answer: string): string {
  return answer.split(MULTIPLE_CHOICE_SEPARATOR)[0] ?? answer
}

/** Alias français → anglais pour Vrai/Faux : la base stocke 'Vrai'/'Faux'
 *  alors que l'UI émet 'True'/'False'. Appliqué après normalisation. */
const TRUE_FALSE_ALIASES: Record<string, string> = {
  vrai: 'true',
  faux: 'false'
}

/** Normalise une réponse : on ignore la casse et les espaces autour, et on
 *  ramène Vrai/Faux vers leur forme anglaise. Avec latex (contenu LaTeX), tous
 *  les espaces sont ignorés — sémantique mathématique de TeX où l'espace n'a
 *  pas de valeur : `$\frac{1}{2}$` = `$\frac{ 1 }{ 2 }$` = `$  \frac { 1 } { 2 } $`. */
function normalize(value: string, latex = false): string {
  const lowered = value.trim().toLowerCase()
  const normalized = TRUE_FALSE_ALIASES[lowered] ?? lowered
  return latex ? normalized.replace(/\s+/g, '') : normalized
}
