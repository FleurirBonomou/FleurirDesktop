/**
 * Teste si une réponse donnée est la bonne pour une question.
 *
 * La réponse attendue est question.answer : 'True'/'False' pour Vrai/Faux,
 * le mot à taper pour les questions Text/Number. La comparaison ignore la
 * casse et les espaces autour du mot. Pour « Choix multiples », seule la
 * première option de question.answer (séparée par « :=: ») est la bonne.
 */
export function isAnswerCorrect(expectedAnswer: string, answer: string): boolean {
  return normalize(answer) === normalize(expectedAnswer)
}

/** Séparateur des réponses possibles d'une question « Choix multiples »,
 *  stockées dans question.answer : '1961:=:1962:=:1963'. */
export const MULTIPLE_CHOICE_SEPARATOR = ':=:'

/** Réponse attendue d'une question : pour « Choix multiples », la bonne
 *  réponse est la première option ; sinon question.answer telle quelle. */
export function expectedAnswer(answer: string): string {
  return answer.split(MULTIPLE_CHOICE_SEPARATOR)[0] ?? answer
}

/** Normalise une réponse : on ignore la casse et les espaces autour. */
function normalize(value: string): string {
  return value.trim().toLowerCase()
}
