import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NewQuestion from './NewQuestion'
import * as api from '@renderer/services/api'

vi.mock('@renderer/services/api', () => ({
  getCourses: vi.fn().mockResolvedValue([]),
  createQuestion: vi.fn().mockResolvedValue({ id: 1 })
}))

const COURSES = [{ id: 1, name: 'Math', questionCount: 0, lastQuestionDate: '' }]

describe('NewQuestion', () => {
  beforeEach(() => {
    // jsdom n'implémente pas scrollIntoView, or le focus sur le premier champ
    // invalide l'appelle après une soumission échouée.
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    vi.mocked(api.getCourses).mockResolvedValue(COURSES)
    vi.mocked(api.createQuestion).mockResolvedValue({ id: 1 })
  })

  it('affiche les erreurs quand on clique sur Vrai avec un formulaire vide', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NewQuestion />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'Vrai' }))

    // Chaque champ fautif affiche son message sous le champ (field-error).
    expect(screen.getAllByText('Choisissez un cours')).toHaveLength(1)
    expect(screen.getAllByText('La question est requise')).toHaveLength(1)
    expect(screen.getAllByText('La source est requise')).toHaveLength(1)

    // La route n'est pas appelée tant que le formulaire est invalide.
    expect(api.createQuestion).not.toHaveBeenCalled()
  })

  it("enregistre directement avec answer='True' et history='Vrai' quand le formulaire est valide", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/new-question?course=1']}>
        <NewQuestion />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/Question :/), 'Le ciel est bleu')
    await user.type(screen.getByLabelText(/Source :/), 'Livret')
    await user.click(screen.getByRole('button', { name: 'Vrai' }))

    expect(api.createQuestion).toHaveBeenCalledWith({
      courseId: 1,
      question: 'Le ciel est bleu',
      source: 'Livret',
      type: 'True',
      answer: 'True',
      history: 'Vrai'
    })
    expect(await screen.findByText('Question enregistrée')).toBeTruthy()
  })

  it('filtre et sélectionne un cours dans le combobox', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NewQuestion />
      </MemoryRouter>
    )

    const combobox = screen.getByRole('combobox', { name: /Cours :/ })
    await user.type(combobox, 'Math')

    // La liste filtrée ne montre que le cours correspondant au texte tapé.
    expect(screen.getByRole('option', { name: 'Math' })).toBeTruthy()
    await user.click(screen.getByRole('option', { name: 'Math' }))

    // L'input reflète le nom du cours choisi et la liste s'est refermée.
    expect((combobox as HTMLInputElement).value).toBe('Math')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('présélectionne le cours passé par ?course=<id>', async () => {
    render(
      <MemoryRouter initialEntries={['/new-question?course=1']}>
        <NewQuestion />
      </MemoryRouter>
    )

    // Une fois les cours chargés, l'input affiche le nom du cours de l'URL.
    expect(await screen.findByDisplayValue('Math')).toBeTruthy()
  })
})
