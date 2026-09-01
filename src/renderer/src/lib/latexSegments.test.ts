import { describe, expect, it } from 'vitest'
import { parseLatexSegments } from './latexSegments'

describe('parseLatexSegments code', () => {
  it('parse un bloc de code avec langue', () => {
    expect(parseLatexSegments('```ts\nconst x = 1;\n```')).toEqual([
      { type: 'code', content: 'const x = 1;', language: 'ts' }
    ])
  })

  it('parse un bloc de code sans langue', () => {
    expect(parseLatexSegments('```\nconst x = 1;\n```')).toEqual([
      { type: 'code', content: 'const x = 1;', language: undefined }
    ])
  })

  it('mélange texte, code et latex sans confondre $ dans le code', () => {
    expect(parseLatexSegments('Avant ```js\nconst s = "$pasLaTeX";\n``` et $x^2$ Suite')).toEqual([
      { type: 'text', content: 'Avant ' },
      { type: 'code', content: 'const s = "$pasLaTeX";', language: 'js' },
      { type: 'text', content: ' et ' },
      { type: 'latex-inline', content: 'x^2' },
      { type: 'text', content: ' Suite' }
    ])
  })
})

describe('parseLatexSegments image', () => {
  it('parse une image avec alt et url', () => {
    expect(parseLatexSegments('Voir ![schéma](https://ex.com/a.png) là.')).toEqual([
      { type: 'text', content: 'Voir ' },
      { type: 'image', content: 'https://ex.com/a.png', alt: 'schéma' },
      { type: 'text', content: ' là.' }
    ])
  })

  it('parse une image sans alt', () => {
    expect(parseLatexSegments('![](https://ex.com/a.png)')).toEqual([
      { type: 'image', content: 'https://ex.com/a.png', alt: '' }
    ])
  })
})

describe('parseLatexSegments latex conservé', () => {
  it('garde le comportement inline et block d’origine', () => {
    expect(parseLatexSegments('Texte $\\pi$ et $$x$$.')).toEqual([
      { type: 'text', content: 'Texte ' },
      { type: 'latex-inline', content: '\\pi' },
      { type: 'text', content: ' et ' },
      { type: 'latex-block', content: 'x' },
      { type: 'text', content: '.' }
    ])
  })
})
