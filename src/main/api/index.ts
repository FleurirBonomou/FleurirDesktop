import { Course, NextQuestion, QuestionInput, ReviewConfig } from '../../shared/types'
import {
  fetchCourses,
  createCourse as requestCreateCourse,
  deleteCourse as requestDeleteCourse,
  createQuestion as requestCreateQuestion,
  fetchNextQuestion,
  updateQuestionFlag as requestUpdateQuestionFlag,
  addCourseToList as requestAddCourseToList,
  deleteQuestion as requestDeleteQuestion,
  answerQuestion as requestAnswerQuestion,
  fetchReviewConfig,
  updateReviewConfig as requestUpdateReviewConfig
} from './client'

export function getCourses(): Promise<Course[]> {
  return fetchCourses()
}

export function createCourse(name: string): Promise<{ id: number }> {
  return requestCreateCourse(name)
}

export function addCourseToList(courseId: number): Promise<void> {
  return requestAddCourseToList(courseId)
}

export function deleteCourse(id: number): Promise<{ id: number }> {
  return requestDeleteCourse(id)
}

export function getReviewConfig(): Promise<ReviewConfig> {
  return fetchReviewConfig()
}

export function updateReviewConfig(patch: Partial<ReviewConfig>): Promise<ReviewConfig> {
  return requestUpdateReviewConfig(patch)
}

export function createQuestion(input: QuestionInput): Promise<{ id: number }> {
  return requestCreateQuestion(input)
}

export function getNextQuestion(courseId?: number): Promise<NextQuestion> {
  return fetchNextQuestion(courseId)
}

export function answerQuestion(
  questionId: number,
  correct: boolean
): Promise<{ id: number; grade: number; askCount: number }> {
  return requestAnswerQuestion(questionId, correct)
}

export function updateQuestionFlag(
  publicId: string,
  flagged: boolean
): Promise<{ publicId: string }> {
  return requestUpdateQuestionFlag(publicId, flagged)
}

export function deleteQuestion(publicId: string): Promise<void> {
  return requestDeleteQuestion(publicId)
}
