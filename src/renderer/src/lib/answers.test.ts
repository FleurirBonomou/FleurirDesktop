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

  it('accepte la réponse anglaise quand la BDD stocke le français', () => {
    expect(isAnswerCorrect('Faux', 'False')).toBe(true)
    expect(isAnswerCorrect('Vrai', 'True')).toBe(true)
    expect(isAnswerCorrect('  Faux ', 'FALSE')).toBe(true)
  })

  it('refuse toujours le mauvais verdict, quelle que soit la langue', () => {
    expect(isAnswerCorrect('Faux', 'True')).toBe(false)
    expect(isAnswerCorrect('Vrai', 'Faux')).toBe(false)
    expect(isAnswerCorrect('False', 'Vrai')).toBe(false)
  })
})
