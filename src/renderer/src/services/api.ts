import type { Course, NextQuestion, QuestionInput, ReviewConfig } from '../../../shared/types'

export function getCourses(): Promise<Course[]> {
  return window.api.getCourses()
}

export function getReviewConfig(): Promise<ReviewConfig> {
  return window.api.getReviewConfig()
}

export function updateReviewConfig(patch: Partial<ReviewConfig>): Promise<ReviewConfig> {
  return window.api.updateReviewConfig(patch)
}

export function addCourseToList(courseId: number): Promise<void> {
  return window.api.addCourseToList(courseId)
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

export function updateQuestionFlag(
  publicId: string,
  flagged: boolean
): Promise<{ publicId: string }> {
  return window.api.updateQuestionFlag(publicId, flagged)
}

export function deleteQuestion(publicId: string): Promise<void> {
  return window.api.deleteQuestion(publicId)
}
