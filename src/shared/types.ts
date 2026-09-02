import type { QuestionType } from './question-types'

export interface Course {
  id: number
  name: string
  questionCount: number
  lastQuestionDate: string
}

export interface Question {
  id: number
  publicId: string
  question: string
  source: string
  answer: string
  history: string
  type: QuestionType
  grade: number
  courseId: number
  createdAt: string
  updatedAt: string
  lastAskedAt: string | null
  askCount: number
  lastCorrect: boolean | null
  flagged: boolean
}

export interface QuestionInput {
  courseId: number
  question: string
  source: string
  type: QuestionType
  answer: string
  history: string
}

/** Statistiques journalières de révision (table `date` côté serveur). */
export interface QuestionStats {
  answeredCount: number
  correctCount: number
  /** Objectif de questions à réviser par jour (réglage review_config). */
  dailyQuestionGoal: number
}

/** Réponse de /question/next : la question à poser, et les stats du jour. */
export interface NextQuestion {
  question: Question | null
  stats: QuestionStats
}
