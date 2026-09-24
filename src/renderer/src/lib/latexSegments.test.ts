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

describe('parseLatexSegments code inline', () => {
  it('parse du code en ligne au milieu d’une phrase', () => {
    expect(parseLatexSegments('utilise `git commit` maintenant')).toEqual([
      { type: 'text', content: 'utilise ' },
      { type: 'code-inline', content: 'git commit' },
      { type: 'text', content: ' maintenant' }
    ])
  })

  it('un $ dans du code inline n’est pas du LaTeX', () => {
    expect(parseLatexSegments('Écris `"$x"` ici')).toEqual([
      { type: 'text', content: 'Écris ' },
      { type: 'code-inline', content: '"$x"' },
      { type: 'text', content: ' ici' }
    ])
  })

  it('les blocs ``` restent prioritaires (pas mangés par les backticks seuls)', () => {
    expect(parseLatexSegments('```js\nconst a = 1;\n```')).toEqual([
      { type: 'code', content: 'const a = 1;', language: 'js' }
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
