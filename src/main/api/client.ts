import type { Course, NextQuestion, QuestionInput } from '../../shared/types'

const DEFAULT_SERVER_PORT = 8082

/** Port du serveur Fleurir : surchargeable via FLEURIR_SERVER_PORT (même
 *  mécanisme que server.ts), défaut 8082 pour la prod. */
function resolveServerPort(): number {
  const raw = process.env['FLEURIR_SERVER_PORT']
  const port = raw === undefined ? NaN : Number(raw)
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_SERVER_PORT
}

const BASE_URL = `http://localhost:${resolveServerPort()}`

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`)
  }

  const body = await res.json()

  if (!body.ok) {
    throw new Error(`Server error: ${body.message}`)
  }

  return body.data
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload })
  })

  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`)
  }
  const body = await res.json()

  if (!body.ok) {
    throw new Error(`Server error: ${body.message}`)
  }

  return body.data
}

async function del<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload })
  })

  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`)
  }
  const body = await res.json()

  if (!body.ok) {
    throw new Error(`Server error: ${body.message}`)
  }

  return body.data
}

export function fetchCourses(): Promise<Course[]> {
  return get<Course[]>('/course/get')
}

export function createCourse(name: string): Promise<{ id: number }> {
  return post<{ id: number }>('/course/create', { name })
}

export function deleteCourse(id: number): Promise<{ id: number }> {
  return del<{ id: number }>('/course/delete', { id })
}

export function createQuestion(input: QuestionInput): Promise<{ id: number }> {
  return post<{ id: number }>('/question/create', input)
}

/** Prochaine question (tirage côté serveur) + stats du jour ; question null
 *  quand il n'y en a aucune. */
export function fetchNextQuestion(courseId?: number): Promise<NextQuestion> {
  const query = courseId === undefined ? '' : `?courseId=${courseId}`
  return get<NextQuestion>(`/question/next${query}`)
}

/** Bascule le flag (marquer/démarquer) d'une question, identifiée par son
 *  publicId (uuid). Le serveur ne met à jour que le champ flagged. */
export function updateQuestionFlag(
  publicId: string,
  flagged: boolean
): Promise<{ publicId: string }> {
  return post<{ publicId: string }>('/question/update', { publicId, flagged })
}

/** Supprime (soft delete) une question, identifiée par son publicId (uuid).
 *  Le serveur est idempotent (déjà supprimée → ok). */
export function deleteQuestion(publicId: string): Promise<void> {
  return post<{ deleted: true }>('/question/delete', { publicId }).then(() => undefined)
}

/** Enregistre le résultat d'une réponse : le serveur recalcule la grade,
 *  l'historique de pose et le dernier verdict de la question. */
export function answerQuestion(
  questionId: number,
  correct: boolean
): Promise<{ id: number; grade: number; askCount: number }> {
  return post<{ id: number; grade: number; askCount: number }>('/question/answer', {
    questionId,
    correct,
    eventId: crypto.randomUUID(),
    answeredAt: new Date(),
    device: 'desktop'
  })
}
