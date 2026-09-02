import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Session from './Session'
import * as api from '@renderer/services/api'
import type { Question } from '../../../shared/types'

vi.mock('@renderer/services/api', () => ({
  getCourses: vi.fn().mockResolvedValue([]),
  answerQuestion: vi.fn().mockResolvedValue({})
}))

// useQuestion est mocké : la logique de chargement est testée à part ; ici on
// pilote l'état renvoyé (loaded, chargement, erreur, vide).
vi.mock('@renderer/hooks/useQuestion', () => ({
  useQuestion: vi.fn()
}))

import { useQuestion } from '@renderer/hooks/useQuestion'

// Une question VRAIE/FAUSSE : jamais posée (lastAskedAt null) → affiche le badge 🌱.
const QUESTION: Question = {
  id: 1,
  publicId: '11111111-1111-1111-1111-111111111111',
  question: 'Le ciel est-il bleu ?',
  source: 'Livret',
  answer: 'True',
  history: 'Vrai',
  type: 'True',
  grade: 1,
  courseId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-02T00:00:00.000Z',
  lastAskedAt: null,
  askCount: 0,
  lastCorrect: null,
  flagged: false
}

const BASE_STATS = { answeredCount: 3, correctCount: 2, dailyQuestionGoal: 10 }

function mockSession(overrides: Partial<ReturnType<typeof useQuestion>> = {}): void {
  vi.mocked(useQuestion).mockReturnValue({
    question: QUESTION,
    sessionKey: 1,
    stats: BASE_STATS,
    loading: false,
    error: '',
    reload: vi.fn(),
    loadNext: vi.fn(),
    setFlag: vi.fn(),
    deleteQuestion: vi.fn(),
    ...overrides
  })
}

describe('Session', () => {
  beforeEach(() => {
    vi.mocked(api.getCourses).mockResolvedValue([])
    vi.mocked(api.answerQuestion).mockResolvedValue({ id: 1, grade: 0, askCount: 0 })
    mockSession()
  })

  it('affiche le fond radial de la page session', () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByTestId('session-root').className).toContain('radial-bg')
  })

  it("n'affiche AUCUN compteur numérique (barre de progression seule)", () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    // Les compteurs « 3 / 10 » et « 2 / 3 » ne doivent plus exister.
    expect(screen.queryByText('3 / 10')).toBeNull()
    expect(screen.queryByText('2 / 3')).toBeNull()
    // La barre de progression est bien là (role progressbar).
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })

  it('rend 4 boutons : Détails, Flag et Supprimer actifs, Modifier désactivé', () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    const details = screen.getByTitle('Détails')
    expect((details as HTMLButtonElement).disabled).toBe(false)
    const flag = screen.getByTitle('Marquer') as HTMLButtonElement
    expect(flag.disabled).toBe(false)
    const del = screen.getByTitle('Supprimer') as HTMLButtonElement
    expect(del.disabled).toBe(false)

    expect((screen.getByTitle('Modifier') as HTMLButtonElement).disabled).toBe(true)
  })

  it('bascule le flag quand on clique sur Marquer/Démarquer (bouton orange quand plein)', () => {
    const setFlag = vi.fn()
    mockSession({ setFlag })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )

    const flag = screen.getByTitle('Marquer')
    expect(flag.className).not.toContain('session-action-flagged')
    fireEvent.click(flag)
    expect(setFlag).toHaveBeenCalledTimes(1)
  })

  it('affiche le bouton orange intitulé « Démarquer » quand la question est marquée', () => {
    mockSession({ question: { ...QUESTION, flagged: true } })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    const flag = screen.getByTitle('Démarquer')
    expect((flag as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')
    expect(flag.className).toContain('session-action-flagged')
  })

  it('affiche le dialog de confirmation quand on clique sur Supprimer, Annuler ne supprime pas', () => {
    mockSession()
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    // Dialog fermé au départ.
    expect(screen.queryByText('Supprimer la question ?')).toBeNull()

    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(screen.getByText('Supprimer la question ?')).toBeTruthy()
    expect(screen.getByText('Elle sera retirée de la révision après synchronisation.')).toBeTruthy()

    // Annuler : ferme le dialog, ne supprime pas.
    fireEvent.click(screen.getByText('Annuler'))
    expect(screen.queryByText('Supprimer la question ?')).toBeNull()
    expect(vi.mocked(useQuestion).mock.results.at(-1)?.value.deleteQuestion).not.toHaveBeenCalled()
  })

  it('confirme la suppression via le bouton Supprimer du dialog', () => {
    const deleteQuestion = vi.fn()
    mockSession({ deleteQuestion })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTitle('Supprimer'))
    fireEvent.click(screen.getByText('Supprimer'))
    expect(deleteQuestion).toHaveBeenCalledTimes(1)
    // Le dialog se referme.
    expect(screen.queryByText('Supprimer la question ?')).toBeNull()
  })

  it('la touche Échap ferme le dialog de suppression sans supprimer', () => {
    mockSession()
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTitle('Supprimer'))
    expect(screen.getByText('Supprimer la question ?')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Supprimer la question ?')).toBeNull()
    expect(vi.mocked(useQuestion).mock.results.at(-1)?.value.deleteQuestion).not.toHaveBeenCalled()
  })

  it('la touche Échap ferme le menu Détails', () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTitle('Détails'))
    expect(screen.getByText('Détails de la question')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Détails de la question')).toBeNull()
  })

  it("affiche le texte de la question mais PAS de bloc d'infos sur la carte", () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    // Le texte de la question est rendu.
    expect(screen.getByText(/Le ciel est-il bleu/)).toBeTruthy()
    // Le bloc d'infos (Thème / Créée le) ne doit plus être sur la carte.
    expect(screen.queryByText('Thème')).toBeNull()
    expect(screen.queryByText(/Créée le/)).toBeNull()
  })

  it('affiche le badge 🌱 pour une question jamais posée', () => {
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText('🌱')).toBeTruthy()
  })

  it('ouvre le menu Détails avec les infos quand on clique sur le bouton Info', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.queryByText('Détails de la question')).toBeNull()
    await user.click(screen.getByTitle('Détails'))

    expect(screen.getByText('Détails de la question')).toBeTruthy()
    expect(screen.getByText('Thème')).toBeTruthy()
    expect(screen.getByText('Maîtrise')).toBeTruthy()
    expect(screen.getByText('Source')).toBeTruthy()
    expect(screen.getByText('Livret')).toBeTruthy()
    expect(screen.getByText('Posée')).toBeTruthy()
    expect(screen.getByText('0 fois')).toBeTruthy()
    expect(screen.getByText('Dernière réponse')).toBeTruthy()
    expect(screen.getByText('Jamais répondu')).toBeTruthy()
  })

  it('ferme le menu Détails via le bouton Fermer', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    await user.click(screen.getByTitle('Détails'))
    // Le bouton « Fermer » (bas du menu) — pas le ✕ (aria-label=« Fermer » aussi).
    const done = screen
      .getAllByRole('button')
      .find((btn) => (btn as HTMLButtonElement).className === 'details-done')
    expect(done).toBeTruthy()
    await user.click(done as HTMLElement)
    expect(screen.queryByText('Détails de la question')).toBeNull()
  })

  it('affiche un message de chargement pendant le chargement', () => {
    mockSession({ loading: true, question: null, sessionKey: null })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText('Chargement…')).toBeTruthy()
  })

  it('affiche une erreur avec un bouton Réessayer', () => {
    mockSession({ error: 'Réseau indisponible', question: null, sessionKey: null })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText('Réseau indisponible')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy()
  })

  it("affiche un message quand aucune question n'est disponible", () => {
    mockSession({ question: null, sessionKey: null })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText('Aucune question disponible pour le moment.')).toBeTruthy()
  })

  it('affiche le badge 🌶 pour une question difficile (grade 0, dernier échec)', () => {
    mockSession({
      question: {
        ...QUESTION,
        grade: 0,
        lastCorrect: false,
        lastAskedAt: '2026-01-05T00:00:00.000Z'
      }
    })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText((content) => content.includes('🌶'))).toBeTruthy()
    expect(screen.queryByText('🌱')).toBeNull()
  })

  it('affiche le badge 🎉 pour une question connue (grade maximal 3)', () => {
    mockSession({
      question: {
        ...QUESTION,
        grade: 3,
        lastCorrect: true,
        lastAskedAt: '2026-01-05T00:00:00.000Z'
      }
    })
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )
    expect(screen.getByText('🎉')).toBeTruthy()
    expect(screen.queryByText('🌱')).toBeNull()
    expect(screen.queryByText((content) => content.includes('🌶'))).toBeNull()
  })

  it('affiche le panneau de réponse seulement quand toute la question est révélée', () => {
    // Question de plusieurs phrases : la révélation démarre à 1 phrase visible.
    const multi = {
      ...QUESTION,
      question: 'Le ciel est-il bleu ? La réponse est non.'
    }
    mockSession({ question: multi })

    // useSentenceReveal (réel) avec sessionKey=1 : visible démarre à 1.
    // -> 2 phrases au total, seulement 1 de montrée : pas encore de réponse.
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    )

    // Bouton « Vrai » (panneau de réponse) absent tant que tout n'est pas montré.
    expect(screen.queryByRole('button', { name: 'Vrai' })).toBeNull()

    // On révèle la phrase restante (touche Espace).
    fireEvent.keyDown(document.body, { code: 'Space' })

    // Maintenant la question est entièrement révélée : le panneau apparaît.
    expect(screen.getByRole('button', { name: 'Vrai' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Faux' })).toBeTruthy()
  })

  it('affiche le TransitionScreen « Bon ! » après une bonne réponse puis avance tout seul', () => {
    vi.useFakeTimers()
    try {
      mockSession()
      render(
        <MemoryRouter>
          <Session />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Vrai' }))
      // La carte est remplacée par l'écran de transition.
      expect(screen.getByText('Bon !')).toBeTruthy()
      expect(screen.getByText('Touchez pour continuer')).toBeTruthy()
      const loadNext = vi.mocked(useQuestion).mock.results.at(-1)?.value.loadNext
      // 500 ms → setExiting(true) (slide-out démarre).
      act(() => {
        vi.advanceTimersByTime(500)
      })
      // 260 ms → slide-out terminé → avancement à la question suivante.
      act(() => {
        vi.advanceTimersByTime(260)
      })
      expect(loadNext).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('affiche le TransitionScreen « Raté... » avec le contexte après une erreur, avance au clic', () => {
    vi.useFakeTimers()
    try {
      mockSession({ question: { ...QUESTION, history: 'Je ne savais pas.' } })
      render(
        <MemoryRouter>
          <Session />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Faux' }))
      expect(screen.getByText('Raté...')).toBeTruthy()
      expect(screen.getByText('Je ne savais pas.')).toBeTruthy()
      const loadNext = vi.mocked(useQuestion).mock.results.at(-1)?.value.loadNext
      // Clic sur l'écran → slide-out → avancement après 260 ms.
      fireEvent.click(screen.getByText('Raté...'))
      act(() => {
        vi.advanceTimersByTime(260)
      })
      expect(loadNext).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('après une erreur, une touche du clavier (sauf Échap) avance à la question suivante', () => {
    vi.useFakeTimers()
    try {
      mockSession({ question: { ...QUESTION, history: 'Je ne savais pas.' } })
      render(
        <MemoryRouter>
          <Session />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Faux' }))
      expect(screen.getByText('Raté...')).toBeTruthy()
      const loadNext = vi.mocked(useQuestion).mock.results.at(-1)?.value.loadNext

      // Échap : ne déclenche PAS l'avancement.
      fireEvent.keyDown(window, { key: 'Escape' })
      act(() => {
        vi.advanceTimersByTime(260)
      })
      expect(loadNext).not.toHaveBeenCalled()
      expect(screen.getByText('Raté...')).toBeTruthy()

      // Une autre touche (Espace) : slide-out puis avancement.
      fireEvent.keyDown(window, { key: ' ' })
      act(() => {
        vi.advanceTimersByTime(260)
      })
      expect(loadNext).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("affiche l'anneau vert/rouge aux bords de l'écran selon le verdict précédent", () => {
    vi.useFakeTimers()
    try {
      mockSession()
      render(
        <MemoryRouter>
          <Session />
        </MemoryRouter>
      )
      // Avant toute réponse : pas d'anneau.
      expect(document.querySelector('.flash-ring')).toBeNull()

      // Bonne réponse puis avancement (timer) → anneau vert.
      fireEvent.click(screen.getByRole('button', { name: 'Vrai' }))
      expect(screen.getByText('Bon !')).toBeTruthy()
      // Pendant la transition : pas d'anneau (verdict plein écran déjà visible).
      expect(document.querySelector('.flash-ring')).toBeNull()
      // 500 ms → slide-out ; 260 ms → question suivante → anneau vert.
      act(() => {
        vi.advanceTimersByTime(500)
      })
      act(() => {
        vi.advanceTimersByTime(260)
      })
      const ring = document.querySelector('.flash-ring')
      expect(ring).toBeTruthy()
      expect(ring!.className).toContain('success')
    } finally {
      vi.useRealTimers()
    }
  })

  it("affiche l'anneau rouge aux bords de l'écran après une erreur", () => {
    vi.useFakeTimers()
    try {
      mockSession()
      render(
        <MemoryRouter>
          <Session />
        </MemoryRouter>
      )
      // Mauvaise réponse (Faux) puis avancement au clic → anneau rouge.
      fireEvent.click(screen.getByRole('button', { name: 'Faux' }))
      expect(screen.getByText('Raté...')).toBeTruthy()
      fireEvent.click(screen.getByText('Raté...'))
      act(() => {
        vi.advanceTimersByTime(260)
      })
      const ring = document.querySelector('.flash-ring')
      expect(ring).toBeTruthy()
      expect(ring!.className).toContain('error')
      expect(ring!.className).not.toContain('success')
    } finally {
      vi.useRealTimers()
    }
  })
})
