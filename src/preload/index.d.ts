import { ElectronAPI } from '@electron-toolkit/preload'
import type { Course, NextQuestion, QuestionInput } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getCourses: () => Promise<Course[]>
      createCourse: (name: string) => Promise<{ id: number }>
      deleteCourse: (id: number) => Promise<{ id: number }>
      createQuestion: (input: QuestionInput) => Promise<{ id: number }>
      getNextQuestion: (courseId?: number) => Promise<NextQuestion>
      answerQuestion: (
        questionId: number,
        correct: boolean
      ) => Promise<{ id: number; grade: number; askCount: number }>
    }
  }
}
