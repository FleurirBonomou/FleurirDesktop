import { useMemo, useState } from 'react'
import type { Question as QuestionItem } from '../../../../shared/types'
import { QUESTION_TYPE_LABELS } from '../../../../shared/question-types'
import { MULTIPLE_CHOICE_SEPARATOR } from '@renderer/lib/answers'
import LatexText from '../LatexText'

interface AnswerPanelProps {
  question: QuestionItem
  /** Identité de la session : quand elle change, l'état interne de la zone de
   *  réponse repart de zéro (texte tapé, options), sans remonter le panneau. */
  sessionKey: number | null
  /** Tant que la question n'est pas entièrement affichée (ou déjà répondue),
   *  la zone de réponse reste désactivée. */
  disabled?: boolean
  /** Émet la réponse choisie : 'True'/'False' pour Vrai/Faux, le texte tapé
   *  pour les questions Text. */
  onAnswer: (value: string) => void
  /** Reçoit la ref du champ de réponse texte : la page y ramène le focus quand
   *  la révélation des phrases est terminée (Espace). Ignoré hors questions Text. */
  inputRef?: React.RefObject<HTMLInputElement | null>
}

/** Zone de réponse selon le type de la question :
 *  - Vrai/Faux : deux boutons dans un ordre fixe (Vrai puis Faux) ;
 *  - Text / Number : entrée de texte d'une ligne + bouton "Répondre" en dessous ;
 *  - Choix multiples : un bouton par option proposée, empilés en ordre aléatoire ;
 *  - autres types : rien pour le moment (à venir). */
function AnswerPanel({
  question,
  sessionKey,
  disabled = false,
  onAnswer,
  inputRef
}: AnswerPanelProps): React.JSX.Element | null {
  const isTrueFalse = question.type === 'True' || question.type === 'False'

  if (isTrueFalse) {
    return (
      <div className="answer-panel">
        <button type="button" disabled={disabled} onClick={() => onAnswer('True')}>
          {QUESTION_TYPE_LABELS['True']}
        </button>
        <button type="button" disabled={disabled} onClick={() => onAnswer('False')}>
          {QUESTION_TYPE_LABELS['False']}
        </button>
      </div>
    )
  }

  if (question.type === 'Multiple choice') {
    return <MultipleChoicePanel question={question} disabled={disabled} onAnswer={onAnswer} />
  }

  if (question.type === 'Text') {
    return (
      <TextAnswerPanel
        sessionKey={sessionKey}
        disabled={disabled}
        onAnswer={onAnswer}
        inputRef={inputRef}
      />
    )
  }

  if (question.type === 'Number') {
    return (
      <TextAnswerPanel
        sessionKey={sessionKey}
        disabled={disabled}
        onAnswer={onAnswer}
        inputRef={inputRef}
        sanitize={sanitizeNumber}
      />
    )
  }

  return null
}

/** Ne garde que les caractères admis pour une réponse numérique :
 *  chiffres, espace, signes -, + et séparateurs , et . */
function sanitizeNumber(value: string): string {
  return value.replace(/[^0-9 ,.+-]/g, '')
}

/** Mélange un tableau (Fisher-Yates), sans toucher à l'original. */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Choix multiples : un bouton par option (la bonne est la première de
 *  question.answer, séparée par « :=: »), empilés verticalement dans un ordre
 *  aléatoire. L'ordre est dérivé de la question (useMemo sur `question`) : il
 *  est figé pour la question courante et re-mélangé quand une nouvelle question
 *  remplace la carte, sans dépendre d'un remontage du panneau. */
function MultipleChoicePanel({
  question,
  disabled,
  onAnswer
}: {
  question: QuestionItem
  disabled: boolean
  onAnswer: (value: string) => void
}): React.JSX.Element {
  const options = useMemo(
    () => shuffle(question.answer.split(MULTIPLE_CHOICE_SEPARATOR).filter(Boolean)),
    [question]
  )

  return (
    <div className="answer-panel multiple-choice">
      {options.map((option) => (
        <button key={option} type="button" disabled={disabled} onClick={() => onAnswer(option)}>
          <LatexText>{option}</LatexText>
        </button>
      ))}
    </div>
  )
}

/** Réponse libre : champ texte d'une ligne, large de 40 caractères, avec un
 *  bouton "Répondre" juste en dessous. Le bouton est actif dès que la question
 *  est entièrement affichée et que le champ n'est pas vide (Entrée dans le champ
 *  répond aussi). Une fonction `sanitize` peut restreindre les caractères admis
 *  (chiffres et séparateurs pour les réponses Number). Quand la session change
 *  (nouvelle question), le texte tapé est effacé pendant le rendu : le panneau
 *  n'étant pas remonté, ce reset évite qu'une réponse passée ne se retrouve
 *  pré-saisie sur la question suivante. */
function TextAnswerPanel({
  sessionKey,
  disabled,
  onAnswer,
  inputRef,
  sanitize = (value: string) => value
}: {
  sessionKey: number | null
  disabled: boolean
  onAnswer: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  sanitize?: (value: string) => string
}): React.JSX.Element {
  const [text, setText] = useState('')
  const [textSession, setTextSession] = useState(sessionKey)
  if (textSession !== sessionKey) {
    setTextSession(sessionKey)
    setText('')
  }

  const submit = (): void => {
    const trimmed = text.trim()
    if (trimmed !== '' && !disabled) {
      onAnswer(trimmed)
    }
  }

  return (
    <div className="answer-panel text-answer">
      <input
        ref={inputRef}
        className="text-answer-input"
        type="text"
        size={40}
        disabled={disabled}
        value={text}
        onChange={(event) => setText(sanitize(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            submit()
          }
        }}
      />
      <button type="button" disabled={disabled || text.trim() === ''} onClick={submit}>
        Répondre
      </button>
    </div>
  )
}

export default AnswerPanel
