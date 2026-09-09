import { describe, expect, it } from 'vitest'
import { isAnswerCorrect } from './answers'

describe('isAnswerCorrect', () => {
  it('accepte la bonne réponse texte, insensible à la casse et aux espaces', () => {
    expect(isAnswerCorrect('Berlin', 'Berlin', 'Text')).toBe(true)
    expect(isAnswerCorrect('Berlin', 'berlin', 'Text')).toBe(true)
    expect(isAnswerCorrect('Berlin', '  BERLIN  ', 'Text')).toBe(true)
  })

  it('refuse une mauvaise réponse texte', () => {
    expect(isAnswerCorrect('Berlin', 'Paris', 'Text')).toBe(false)
    expect(isAnswerCorrect('Berlin', '', 'Text')).toBe(false)
    expect(isAnswerCorrect('Berlin', 'berl', 'Text')).toBe(false)
  })

  it('accepte n\'importe quelle alternative pour les questions Text avec :=:', () => {
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'Paris', 'Text')).toBe(true)
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'Lyon', 'Text')).toBe(true)
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'Marseille', 'Text')).toBe(true)
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'lyon', 'Text')).toBe(true)
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', '  MARSEILLE  ', 'Text')).toBe(true)
  })

  it('refuse une réponse absente des alternatives pour les questions Text', () => {
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'Toulouse', 'Text')).toBe(false)
    expect(isAnswerCorrect('Paris:=:Lyon:=:Marseille', 'Par', 'Text')).toBe(false)
  })

  it('accepte n\'importe quelle alternative pour les questions Number avec :=:', () => {
    expect(isAnswerCorrect('3.14:=:3,14', '3.14', 'Number')).toBe(true)
    expect(isAnswerCorrect('3.14:=:3,14', '3,14', 'Number')).toBe(true)
    expect(isAnswerCorrect('3.14:=:3,14', ' 3.14 ', 'Number')).toBe(true)
  })

  it('refuse une réponse absente des alternatives pour les questions Number', () => {
    expect(isAnswerCorrect('3.14:=:3,14', '3,15', 'Number')).toBe(false)
    expect(isAnswerCorrect('3.14:=:3,14', '3', 'Number')).toBe(false)
  })

  it('gère Vrai/Faux avec le type de question', () => {
    expect(isAnswerCorrect('', 'True', 'True')).toBe(true)
    expect(isAnswerCorrect('', 'False', 'False')).toBe(true)
    expect(isAnswerCorrect('', 'false', 'True')).toBe(false)
    expect(isAnswerCorrect('', 'True', 'False')).toBe(false)
  })

  it('accepte la réponse anglaise quand la BDD stocke le français', () => {
    expect(isAnswerCorrect('Faux', 'False', 'Multiple choice')).toBe(true)
    expect(isAnswerCorrect('Vrai', 'True', 'Multiple choice')).toBe(true)
    expect(isAnswerCorrect('  Faux ', 'FALSE', 'Multiple choice')).toBe(true)
  })

  it('refuse toujours le mauvais verdict, quelle que soit la langue', () => {
    expect(isAnswerCorrect('Faux', 'True', 'Multiple choice')).toBe(false)
    expect(isAnswerCorrect('Vrai', 'Faux', 'Multiple choice')).toBe(false)
    expect(isAnswerCorrect('False', 'Vrai', 'Multiple choice')).toBe(false)
  })
})

describe('isAnswerCorrect avec LaTeX', () => {
  it("ignore les espaces d'une formule quand le contenu contient du LaTeX", () => {
    expect(isAnswerCorrect('$\\frac{1}{2}$', '$\\frac{1}{2}$', 'Text')).toBe(true)
    expect(isAnswerCorrect('$\\frac{ 1 }{ 2 }$', '$\\frac{ 1 }{ 2 }$', 'Text')).toBe(true)
    expect(isAnswerCorrect('$\\frac{ 1 }{ 2 }$', '$\\frac{1}{2}$', 'Text')).toBe(true)
    expect(isAnswerCorrect('$\\frac{ 1 }{ 3 }$', '$\\frac{1}{2}$', 'Text')).toBe(false)
  })

  it('ignore les espaces si la réponse utilisateur contient du LaTeX', () => {
    expect(isAnswerCorrect('$2x$', '$2 x$', 'Text')).toBe(true)
    expect(isAnswerCorrect('$2x$', '$3x$', 'Text')).toBe(false)
  })
})
