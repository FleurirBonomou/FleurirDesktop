import type { Course, NextQuestion, QuestionInput } from '../../../shared/types'

export function getCourses(): Promise<Course[]> {
  return window.api.getCourses()
}

export function deleteCourse(id: number): Promise<{ id: number }> {
  return window.api.deleteCourse(id)
}

export function createCourse(name: string): Promise<{ id: number }> {
  return window.api.createCourse(name)
}

export function createQuestion(input: QuestionInput): Promise<{ id: number }> {
  return window.api.createQuestion(input)
}

export function getNextQuestion(courseId?: number): Promise<NextQuestion> {
  return window.api.getNextQuestion(courseId)
}

export function answerQuestion(
  questionId: number,
  correct: boolean
): Promise<{ id: number; grade: number; askCount: number }> {
  return window.api.answerQuestion(questionId, correct)
}
