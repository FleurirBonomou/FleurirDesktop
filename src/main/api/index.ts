import { Course, NextQuestion, QuestionInput } from '../../shared/types'
import {
  fetchCourses,
  createCourse as requestCreateCourse,
  deleteCourse as requestDeleteCourse,
  createQuestion as requestCreateQuestion,
  fetchNextQuestion,
  updateQuestionFlag as requestUpdateQuestionFlag,
  deleteQuestion as requestDeleteQuestion,
  answerQuestion as requestAnswerQuestion
} from './client'

export function getCourses(): Promise<Course[]> {
  return fetchCourses()
}

export function createCourse(name: string): Promise<{ id: number }> {
  return requestCreateCourse(name)
}

export function deleteCourse(id: number): Promise<{ id: number }> {
  return requestDeleteCourse(id)
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
