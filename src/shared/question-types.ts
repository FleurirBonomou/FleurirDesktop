// Les types de question possibles — source de vérité unique pour le client ET le serveur.
// Ajouter un type = ajouter une valeur dans le tableau ; le type TS dérive automatiquement.
export const QUESTION_TYPES = ['Multiple choice', 'Text', 'Number', 'True', 'False'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

// Libellés français affichés sur les boutons (les valeurs restent en anglais).
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  True: 'Vrai',
  False: 'Faux',
  'Multiple choice': 'Choix multiples',
  Text: 'Texte',
  Number: 'Nombre'
}

// Types sans section réponse / historique (le panel caché reste fermé).
export const QUESTION_TYPES_WITHOUT_ANSWER: ReadonlySet<QuestionType> = new Set(['True', 'False'])
