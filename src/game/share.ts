import type { Evaluation, LetterStatus } from './types'

function statusToEmoji(status: LetterStatus): string {
  switch (status) {
    case 'correct':
      return '🟩'
    case 'present':
      return '🟨'
    case 'absent':
      return '⬛'
  }
}

export function buildShareText(params: {
  dateEt: string
  attempts: number | 'X'
  evaluations: Evaluation[]
}): string {
  const header = `xdOS Wordle ${params.dateEt} ${params.attempts}/6`
  const grid = params.evaluations
    .map(e => e.statuses.map(statusToEmoji).join(''))
    .join('\n')
  return `${header}\n\n${grid}`
}

