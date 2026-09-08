import { ElectronAPI } from '@electron-toolkit/preload'
import type { Course, NextQuestion, QuestionInput, ReviewConfig } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getCourses: () => Promise<Course[]>
      createCourse: (name: string) => Promise<{ id: number }>
      deleteCourse: (id: number) => Promise<{ id: number }>
      createQuestion: (input: QuestionInput) => Promise<{ id: number }>
      getNextQuestion: (courseId?: number) => Promise<NextQuestion>
      getReviewConfig: () => Promise<ReviewConfig>
      updateReviewConfig: (patch: Partial<ReviewConfig>) => Promise<ReviewConfig>
      addCourseToList: (courseId?: number) => Promise<void>
      answerQuestion: (
        questionId: number,
        correct: boolean
      ) => Promise<{ id: number; grade: number; askCount: number }>
      updateQuestionFlag: (publicId: string, flagged: boolean) => Promise<{ publicId: string }>
      deleteQuestion: (publicId: string) => Promise<void>
    }
  }
}
