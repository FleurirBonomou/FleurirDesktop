import type { QuestionType } from '../../../../shared/question-types'

/**
 * Teste si une réponse donnée est la bonne pour une question.
 *
 * Pour Vrai/Faux, la bonne réponse est portée par le TYPE de la question
 * ('True'/'False'), pas par question.answer. Pour les autres types, la réponse
 * attendue est question.answer : le mot à taper pour Text/Number (toute option
 * séparée par « :=: » est acceptée), la première option pour « Choix multiples ».
 * La comparaison ignore la casse et les espaces autour du mot, et accepte
 * Vrai/Faux indifféremment en français ou en anglais.
 */
export function isAnswerCorrect(
  questionAnswer: string,
  answer: string,
  type: QuestionType
): boolean {
  const alternatives = questionAnswer.split(MULTIPLE_CHOICE_SEPARATOR)
  const hasLatex = questionAnswer.includes('$') || answer.includes('$')

  if (type === 'True' || type === 'False') {
    return normalize(answer, hasLatex) === normalize(type, hasLatex)
  }

  if (type === 'Multiple choice') {
    return normalize(answer, hasLatex) === normalize(alternatives[0] ?? questionAnswer, hasLatex)
  }

  return alternatives.some((alt) => normalize(answer, hasLatex) === normalize(alt, hasLatex))
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
