import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import App from './App'
import * as api from '@renderer/services/api'

vi.mock('@renderer/services/api', () => ({
  getNextQuestion: vi.fn(),
  getCourses: vi.fn(),
  answerQuestion: vi.fn().mockResolvedValue({ id: 0, grade: 0, askCount: 0 })
}))

const Q = {
  id: 42,
  question: 'Le mur de Berlin a été construit en 1961.',
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

describe('repro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getNextQuestion).mockResolvedValue({
      question: Q,
      stats: { answeredCount: 0, correctCount: 0, dailyQuestionGoal: 0 }
    })
    vi.mocked(api.getCourses).mockResolvedValue([])
  })

  it('compte les cartes sans StrictMode', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    await screen.findByText(/Le mur de Berlin/)
    expect(document.querySelectorAll('.question-card').length).toBe(1)
  })

  it('compte les cartes avec StrictMode', async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </StrictMode>
    )
    await screen.findByText(/Le mur de Berlin/)
    expect(document.querySelectorAll('.question-card').length).toBe(1)
  })

  it('compte les cartes avec deux réponses différées (races)', async () => {
    const a = { ...Q, id: 1, question: 'Première réponse différée.' }
    const b = { ...Q, id: 2, question: 'Seconde réponse différée.' }
    let calls = 0
    vi.mocked(api.getNextQuestion).mockImplementation(() => {
      calls += 1
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              question: calls === 1 ? a : b,
              stats: { answeredCount: 0, correctCount: 0, dailyQuestionGoal: 0 }
            }),
          calls === 1 ? 20 : 5
        )
      )
    })
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </StrictMode>
    )
    await screen.findByText(/Seconde réponse différée/)
    expect(document.querySelectorAll('.question-card').length).toBe(1)
  })
})
