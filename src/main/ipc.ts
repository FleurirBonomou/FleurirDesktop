import { ipcMain } from 'electron'
import {
  getCourses,
  createCourse,
  deleteCourse,
  createQuestion,
  getNextQuestion,
  answerQuestion,
  updateQuestionFlag,
  deleteQuestion
} from './api'
import type { QuestionInput } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('api:getCourses', () => getCourses())
  ipcMain.handle('api:createCourse', (_event, name: string) => createCourse(name))
  ipcMain.handle('api:deleteCourse', (_event, id: number) => deleteCourse(id))
  ipcMain.handle('api:createQuestion', (_event, input: QuestionInput) => createQuestion(input))
  ipcMain.handle('api:getNextQuestion', (_event, courseId?: number) => getNextQuestion(courseId))
  ipcMain.handle('api:answerQuestion', (_event, questionId: number, correct: boolean) =>
    answerQuestion(questionId, correct)
  )
  ipcMain.handle('api:updateQuestionFlag', (_event, publicId: string, flagged: boolean) =>
    updateQuestionFlag(publicId, flagged)
  )
  ipcMain.handle('api:deleteQuestion', (_event, publicId: string) => deleteQuestion(publicId))
}
