import { describe, expect, it } from 'vitest'
import { splitSentences } from '../../../shared/sentences'

describe('splitSentences with LaTeX', () => {
  it('ne coupe pas sur un point dans une formule inline', () => {
    expect(splitSentences("La valeur de $\\pi$ est 3.14. C'est important.")).toEqual([
      'La valeur de $\\pi$ est 3.14.',
      "C'est important."
    ])
  })

  it('ne coupe pas sur un point dans une formule block', () => {
    expect(splitSentences('Formule : $$\\alpha. \\beta$$. Suite.')).toEqual([
      'Formule : $$\\alpha. \\beta$$.',
      'Suite.'
    ])
  })

  it('restaure la formule exacte dans la phrase', () => {
    expect(splitSentences('Soit $f(x) = x^2$, calculer $f(3)$.')[0]).toContain('$f(x) = x^2$')
  })

  it('fonctionne sans LaTeX (pas de régression)', () => {
    expect(splitSentences('Une phrase. Deux phrases!')).toEqual(['Une phrase.', 'Deux phrases!'])
  })

  it('ne coupe pas sur un point dans un bloc de code', () => {
    expect(splitSentences('Code : ```js\nobj.prop = 1;\n```. Explication.')).toEqual([
      'Code : ```js\nobj.prop = 1;\n```.',
      'Explication.'
    ])
  })

  it('ne coupe pas sur un point dans une URL d’image', () => {
    const parts = splitSentences('![ok](https://ex.com/a.b.png) Suite.')
    expect(parts).toEqual(['![ok](https://ex.com/a.b.png) Suite.'])
  })
})
