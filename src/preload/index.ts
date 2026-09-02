import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { QuestionInput } from '../shared/types'

const api = {
  getCourses: () => ipcRenderer.invoke('api:getCourses'),
  createCourse: (name: string) => ipcRenderer.invoke('api:createCourse', name),
  deleteCourse: (id: number) => ipcRenderer.invoke('api:deleteCourse', id),
  createQuestion: (input: QuestionInput) => ipcRenderer.invoke('api:createQuestion', input),
  getNextQuestion: (courseId?: number) => ipcRenderer.invoke('api:getNextQuestion', courseId),
  answerQuestion: (questionId: number, correct: boolean) =>
    ipcRenderer.invoke('api:answerQuestion', questionId, correct),
  updateQuestionFlag: (publicId: string, flagged: boolean) =>
    ipcRenderer.invoke('api:updateQuestionFlag', publicId, flagged),
  deleteQuestion: (publicId: string) => ipcRenderer.invoke('api:deleteQuestion', publicId)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
