import type { QuestionType } from './question-types'

export interface Course {
  id: number
  name: string
  questionCount: number
  lastQuestionDate: string
  inList: boolean
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

/** Réglages du tirage de questions (review_config côté serveur). */
export interface ReviewConfig {
  neverAskedAgeDays: number
  recencyUnitHours: number
  failureBonus: number
  weightGrade0: number
  weightGrade1: number
  weightGrade2: number
  weightGrade3: number
  wrongResetGrade: number
  maxGrade: number
  dailyQuestionGoal: number
  /** Si true, le tirage n'utilise que les questions des cours marqués inList. */
  useList: boolean
}
