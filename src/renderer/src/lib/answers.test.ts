import { describe, expect, it } from 'vitest'
import { isAnswerCorrect } from './answers'

describe('isAnswerCorrect', () => {
  it('accepte la bonne réponse texte, insensible à la casse et aux espaces', () => {
    expect(isAnswerCorrect('Berlin', 'Berlin')).toBe(true)
    expect(isAnswerCorrect('Berlin', 'berlin')).toBe(true)
    expect(isAnswerCorrect('Berlin', '  BERLIN  ')).toBe(true)
  })

  it('refuse une mauvaise réponse texte', () => {
    expect(isAnswerCorrect('Berlin', 'Paris')).toBe(false)
    expect(isAnswerCorrect('Berlin', '')).toBe(false)
    expect(isAnswerCorrect('Berlin', 'berl')).toBe(false)
  })

  it('gère Vrai/Faux comme un texte attendu', () => {
    expect(isAnswerCorrect('True', 'True')).toBe(true)
    expect(isAnswerCorrect('False', 'false')).toBe(true)
    expect(isAnswerCorrect('True', 'False')).toBe(false)
  })
})
