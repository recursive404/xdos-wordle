import { daysBetween, getEtDateString } from './date'

const START_DATE_ET = '2021-06-19' // arbitrary anchor; only affects rotation

export function pickDailyAnswerIndex(dateEt: string, answersLength: number): number {
  if (answersLength <= 0) throw new Error('answersLength must be > 0')
  const delta = daysBetween(START_DATE_ET, dateEt)
  // Ensure positive modulo.
  return ((delta % answersLength) + answersLength) % answersLength
}

export function getTodayAnswer(answers: readonly string[], now: Date = new Date()): {
  dateEt: string
  index: number
  answer: string
} {
  const dateEt = getEtDateString(now)
  const index = pickDailyAnswerIndex(dateEt, answers.length)
  return { dateEt, index, answer: answers[index] }
}

