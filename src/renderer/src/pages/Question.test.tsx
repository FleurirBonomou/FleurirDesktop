import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Question from './Question'
import * as api from '@renderer/services/api'
import type { Question as QuestionItem } from '../../../shared/types'

vi.mock('@renderer/services/api', () => ({
  getNextQuestion: vi.fn(),
  getCourses: vi.fn(),
  answerQuestion: vi.fn().mockResolvedValue({ id: 0, grade: 0, askCount: 0 })
}))

const NEXT_QUESTION: QuestionItem = {
  id: 42,
  question:
    'Le mur de Berlin a été construit en 1961. Il séparait Berlin-Est de Berlin-Ouest. Sa chute a eu lieu en 1989. De nombreuses familles ont été séparées pendant sa construction. Des personnes ont tenté de fuir à l’Ouest. Le mur est devenu le symbole de la guerre froide. Sa destruction a marqué la réunification allemande.',
  source: 'Livret',
  answer: 'True',
  history: 'Vrai',
  type: 'True',
  grade: 1,
  courseId: 1,
  createdAt: '2026-08-02T10:00:00Z',
  updatedAt: '2026-08-02T10:00:00Z',
  lastAskedAt: null,
  askCount: 0,
  lastCorrect: null
}

const COURSES = [{ id: 1, name: 'Histoire', questionCount: 0, lastQuestionDate: '' }]

const DEFAULT_STATS = { answeredCount: 0, correctCount: 0, dailyQuestionGoal: 0 }

/** Sert la première question puis laisse toutes les suivantes en attente :
 *  le verdict reste donc affiché sur la carte, sans que la question suivante
 *  ne vienne remplacer son contenu. */
function hangAfterFirst(first: QuestionItem | null): void {
  vi.mocked(api.getNextQuestion)
    .mockResolvedValueOnce({ question: first, stats: DEFAULT_STATS })
    .mockImplementation(() => new Promise(() => {}))
}

describe('Question', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getNextQuestion).mockResolvedValue({
      question: NEXT_QUESTION,
      stats: DEFAULT_STATS
    })
    vi.mocked(api.getCourses).mockResolvedValue(COURSES)
  })

  it('affiche les panneaux et les infos de la question reçue', async () => {
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect((await screen.findAllByText('0 / 0')).length).toBe(2)

    // Panneau de réponse : deux boutons Vrai / Faux sur la même ligne.
    const vrai = screen.getByRole('button', { name: 'Vrai' })
    const faux = screen.getByRole('button', { name: 'Faux' })
    expect(vrai.parentElement?.className).toContain('answer-panel')
    expect(vrai.parentElement).toBe(faux.parentElement)

    // Rien tant qu'on n'a pas répondu.
    expect(screen.queryByText(/Bonne réponse/)).toBeNull()
    expect(screen.queryByText(/Mauvaise réponse/)).toBeNull()

    // Infos de la carte : thème (cours), id + maîtrise, source, dates.
    expect(screen.getByText('Histoire')).toBeTruthy()
    expect(screen.getByText('#42')).toBeTruthy()
    expect(screen.getByText(NEXT_QUESTION.source)).toBeTruthy()
    expect(screen.getByText('Jamais')).toBeTruthy()
    expect(api.getNextQuestion).toHaveBeenCalledTimes(1)
    expect(api.getCourses).toHaveBeenCalledTimes(1)

    // La question elle-même est affichée dans la carte.
    expect(screen.getByText(/Le mur de Berlin a été construit/)).toBeTruthy()
  })

  it('affiche la question phrase par phrase avec Espace, et surligne la dernière', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    // Au début : seule la première phrase est visible ; les suivantes sont
    // cachées mais présentes dans le DOM (la taille de la carte est fixe).
    expect(await screen.findByText(/Le mur de Berlin a été construit en 1961/)).toBeTruthy()
    expect(screen.getByText(/Il séparait Berlin-Est de Berlin-Ouest/).className).toContain('hidden')

    // Espace → la deuxième phrase apparaît, surlignée, la première ne l'est plus.
    await user.keyboard(' ')
    const second = screen.getByText(/Il séparait Berlin-Est de Berlin-Ouest/)
    expect(second.className).toContain('highlight')
    expect(screen.getByText(/Le mur de Berlin a été construit en 1961/).className).not.toContain(
      'highlight'
    )

    // Espace → la troisième phrase apparaît.
    await user.keyboard(' ')
    expect(screen.getByText(/Sa chute a eu lieu en 1989/)).toBeTruthy()
  })

  it('désactive les boutons tant que la question nest pas entièrement affichée', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    const vrai = (await screen.findByRole('button', { name: 'Vrai' })) as HTMLButtonElement
    expect(vrai.disabled).toBe(true)

    // La question a 7 phrases : 6 Espace pour tout révéler, puis boutons actifs.
    for (let i = 0; i < 6; i++) {
      await user.keyboard(' ')
    }
    expect((screen.getByRole('button', { name: 'Vrai' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'Faux' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('affiche une bonne réponse quand on clique Vrai sur une question True', async () => {
    const user = userEvent.setup()
    hangAfterFirst(NEXT_QUESTION)
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Vrai' })
    for (let i = 0; i < 6; i++) {
      await user.keyboard(' ')
    }
    await user.click(screen.getByRole('button', { name: 'Vrai' }))

    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
    // Une fois répondue, on ne peut plus re-répondre.
    expect((screen.getByRole('button', { name: 'Vrai' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('affiche une mauvaise réponse quand on clique Faux sur une question True', async () => {
    const user = userEvent.setup()
    hangAfterFirst(NEXT_QUESTION)
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Faux' })
    for (let i = 0; i < 6; i++) {
      await user.keyboard(' ')
    }
    await user.click(screen.getByRole('button', { name: 'Faux' }))

    expect(screen.getByText(/Mauvaise réponse/)).toBeTruthy()
    expect(screen.getByText('Réponse attendue : Vrai')).toBeTruthy()
  })

  it('répond en texte : bouton Répondre inactif tant que le champ est vide, puis bonne réponse', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 44,
      type: 'Text',
      answer: 'Berlin',
      history: '',
      question: 'Quelle ville était la capitale de la RDA ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Répondre' })
    // Le champ est une entrée de texte d'une ligne, le bouton est inactif à vide.
    const input = screen.getByRole('textbox')
    expect((input as HTMLInputElement).size).toBe(40)
    expect((screen.getByRole('button', { name: 'Répondre' }) as HTMLButtonElement).disabled).toBe(
      true
    )

    // La comparaison ignore la casse.
    await user.type(input, 'berlin')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))

    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
    // Une fois répondue, on ne peut plus re-répondre.
    expect((screen.getByRole('button', { name: 'Répondre' }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })

  it('affiche la réponse attendue quand la réponse texte est fausse', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 45,
      type: 'Text',
      answer: 'Berlin',
      history: '',
      question: 'Quelle ville était la capitale de la RDA ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    const input = await screen.findByRole('textbox')
    await user.type(input, 'Paris')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))

    expect(screen.getByText(/Mauvaise réponse/)).toBeTruthy()
    expect(screen.getByText('Réponse attendue : Berlin')).toBeTruthy()
  })

  it('met le focus sur le champ de réponse dès que la dernière phrase est affichée', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getNextQuestion).mockResolvedValue({
      question: {
        ...NEXT_QUESTION,
        id: 46,
        type: 'Text',
        answer: 'Berlin',
        history: '',
        question: 'Première phrase. Deuxième phrase.'
      },
      stats: DEFAULT_STATS
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    const input = (await screen.findByRole('textbox')) as HTMLInputElement

    // Espace révèle la dernière phrase : le focus passe aussitôt sur le champ.
    await user.keyboard(' ')
    expect(screen.getByText(/Deuxième phrase/)).toBeTruthy()
    expect(document.activeElement).toBe(input)

    // On peut alors taper directement dans le champ.
    await user.keyboard('Berlin')
    expect(input.value).toBe('Berlin')
  })

  it('répond en Number : seuls chiffres, espaces, signes et séparateurs sont acceptés, puis bonne réponse', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 47,
      type: 'Number',
      answer: '3,14',
      history: '',
      question: 'Quelle est la valeur de pi arrondie au centième ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Répondre' })
    const input = screen.getByRole('textbox') as HTMLInputElement

    // Lettres et autres caractères interdits : ils sont ignorés à la saisie.
    await user.type(input, 'abc')
    expect(input.value).toBe('')

    // Espace, signes et séparateurs sont acceptés.
    await user.type(input, '+ 3.14')
    expect(input.value).toBe('+ 3.14')

    await user.clear(input)
    await user.type(input, '3,14')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))
    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
  })

  it('affiche la réponse attendue quand la réponse Number est fausse', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 48,
      type: 'Number',
      answer: '3,14',
      history: '',
      question: 'Quelle est la valeur de pi arrondie au centième ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    const input = await screen.findByRole('textbox')
    await user.type(input, '2.71')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))

    expect(screen.getByText(/Mauvaise réponse/)).toBeTruthy()
    expect(screen.getByText('Réponse attendue : 3,14')).toBeTruthy()
  })

  it("affiche les options d'une question Choix multiples, empilées dans le même panneau", async () => {
    vi.mocked(api.getNextQuestion).mockResolvedValue({
      question: {
        ...NEXT_QUESTION,
        id: 49,
        type: 'Multiple choice',
        answer: '1961:=:1962:=:1963',
        history: '1961',
        question: 'En quelle année le mur de Berlin a-t-il été construit ?'
      },
      stats: DEFAULT_STATS
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    // Un bouton par option, tous dans le même panneau empilé verticalement.
    const buttons = await screen.findAllByRole('button', { name: /196\d/ })
    expect(buttons).toHaveLength(3)
    expect(buttons[0].parentElement?.className).toContain('multiple-choice')
    expect(screen.getByRole('button', { name: '1961' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '1962' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '1963' })).toBeTruthy()
  })

  it('affiche une bonne réponse quand on clique la bonne option', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 50,
      type: 'Multiple choice',
      answer: '1961:=:1962:=:1963',
      history: '1961',
      question: 'En quelle année le mur de Berlin a-t-il été construit ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: '1961' }))

    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
    // Une fois répondue, on ne peut plus re-répondre.
    expect((screen.getByRole('button', { name: '1962' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('affiche la réponse attendue quand on clique une mauvaise option', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 51,
      type: 'Multiple choice',
      answer: '1961:=:1962:=:1963',
      history: '1961',
      question: 'En quelle année le mur de Berlin a-t-il été construit ?'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: '1962' }))

    expect(screen.getByText(/Mauvaise réponse/)).toBeTruthy()
    expect(screen.getByText('Réponse attendue : 1961')).toBeTruthy()
  })

  it('affiche une bonne réponse quand on clique Faux sur une question False', async () => {
    const user = userEvent.setup()
    hangAfterFirst({
      ...NEXT_QUESTION,
      id: 43,
      answer: 'False',
      history: 'Faux',
      type: 'False'
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Faux' })
    for (let i = 0; i < 6; i++) {
      await user.keyboard(' ')
    }
    await user.click(screen.getByRole('button', { name: 'Faux' }))

    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
  })

  it('charge automatiquement la question suivante après avoir répondu', async () => {
    const user = userEvent.setup()
    const first = { ...NEXT_QUESTION, id: 42, question: 'Première question.' }
    const second = { ...NEXT_QUESTION, id: 43, question: 'Seconde question.' }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      return Promise.resolve({
        question: calls === 1 ? first : second,
        stats: DEFAULT_STATS
      })
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Première question/)).toBeTruthy()
    expect(document.querySelectorAll('.question-card')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Vrai' }))

    // La réponse est envoyée au serveur, puis la question suivante s'affiche.
    // L'ancienne carte disparaît : une seule carte à l'écran à tout moment.
    expect(await screen.findByText(/Seconde question/)).toBeTruthy()
    expect(screen.queryByText(/Première question/)).toBeNull()
    expect(document.querySelectorAll('.question-card')).toHaveLength(1)
    expect(api.getNextQuestion).toHaveBeenCalledTimes(2)
    expect(api.answerQuestion).toHaveBeenCalledWith(42, true)
  })

  it("garde le verdict de la question précédente quand la suivante s'affiche", async () => {
    const user = userEvent.setup()
    const first = { ...NEXT_QUESTION, id: 42, question: 'Première question.' }
    const second = { ...NEXT_QUESTION, id: 43, question: 'Seconde question.' }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      return Promise.resolve({
        question: calls === 1 ? first : second,
        stats: DEFAULT_STATS
      })
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Première question/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Vrai' }))

    // On peut lire le verdict de la question précédente pendant qu'on lit la
    // nouvelle question : le panneau de résultat n'est pas remplacé.
    expect(await screen.findByText(/Seconde question/)).toBeTruthy()
    expect(screen.getByText('Bonne réponse !')).toBeTruthy()
  })

  it('remplace le verdict par celui de la nouvelle réponse', async () => {
    const user = userEvent.setup()
    const first = { ...NEXT_QUESTION, id: 42, question: 'Première question.' }
    const second = { ...NEXT_QUESTION, id: 43, question: 'Seconde question.' }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      if (calls >= 3) return new Promise(() => {})
      return Promise.resolve({
        question: calls === 1 ? first : second,
        stats: DEFAULT_STATS
      })
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Première question/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Vrai' }))
    expect(await screen.findByText(/Seconde question/)).toBeTruthy()
    expect(screen.getByText('Bonne réponse !')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Faux' }))

    expect(await screen.findByText(/Mauvaise réponse/)).toBeTruthy()
    expect(screen.queryByText('Bonne réponse !')).toBeNull()
  })

  it("efface le champ de réponse quand une nouvelle question texte s'affiche", async () => {
    const user = userEvent.setup()
    const first: QuestionItem = {
      ...NEXT_QUESTION,
      id: 44,
      type: 'Text',
      answer: 'Berlin',
      history: '',
      question: 'Première question.'
    }
    const second: QuestionItem = {
      ...NEXT_QUESTION,
      id: 45,
      type: 'Text',
      answer: 'Londres',
      history: '',
      question: 'Seconde question.'
    }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      if (calls >= 3) return new Promise(() => {})
      return Promise.resolve({
        question: calls === 1 ? first : second,
        stats: DEFAULT_STATS
      })
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    const input = await screen.findByRole('textbox')
    await user.type(input, 'Berlin')
    await user.click(screen.getByRole('button', { name: 'Répondre' }))

    expect(await screen.findByText(/Seconde question/)).toBeTruthy()
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('')
  })

  it('propose les options de la nouvelle question après une question à choix multiples', async () => {
    const user = userEvent.setup()
    const first: QuestionItem = {
      ...NEXT_QUESTION,
      id: 49,
      type: 'Multiple choice',
      answer: '1961:=:1962:=:1963',
      history: '1961',
      question: 'Première question.'
    }
    const second: QuestionItem = {
      ...NEXT_QUESTION,
      id: 50,
      type: 'Multiple choice',
      answer: 'Berlin:=:Londres:=:Paris',
      history: 'Berlin',
      question: 'Seconde question.'
    }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      if (calls >= 3) return new Promise(() => {})
      return Promise.resolve({
        question: calls === 1 ? first : second,
        stats: DEFAULT_STATS
      })
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: '1961' }))

    expect(await screen.findByText(/Seconde question/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Berlin' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Paris' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '1962' })).toBeNull()
  })

  it('affiche les stats du jour (bonnes / répondues) dans le header', async () => {
    vi.mocked(api.getNextQuestion).mockResolvedValue({
      question: NEXT_QUESTION,
      stats: { answeredCount: 5, correctCount: 3, dailyQuestionGoal: 10 }
    })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect(await screen.findByText('3 / 5')).toBeTruthy()
  })

  it('affiche un message quand aucune question nest disponible', async () => {
    vi.mocked(api.getNextQuestion).mockResolvedValue({ question: null, stats: DEFAULT_STATS })
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    expect(await screen.findByText('Aucune question disponible pour le moment.')).toBeTruthy()
  })

  it('réessaie le chargement quand la requête échoue', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getNextQuestion).mockRejectedValueOnce(new Error('boom'))
    render(
      <MemoryRouter>
        <Question />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect(api.getNextQuestion).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Histoire')).toBeTruthy()
  })
})
