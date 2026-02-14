import type { Evaluation, LetterStatus } from './types'

export const MAX_GUESSES = 6
export const WORD_LEN = 5

export function normalizeGuess(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isFiveLetters(word: string): boolean {
  return /^[a-z]{5}$/.test(word)
}

export function evaluateGuess(answer: string, guess: string): Evaluation {
  const a = answer.toLowerCase()
  const g = guess.toLowerCase()
  if (a.length !== WORD_LEN || g.length !== WORD_LEN) {
    throw new Error('answer and guess must be 5 letters')
  }

  const statuses: LetterStatus[] = Array(WORD_LEN).fill('absent')

  // Pass 1: mark correct and count remaining letters in answer.
  const remaining: Record<string, number> = {}
  for (let i = 0; i < WORD_LEN; i++) {
    const ac = a[i]
    const gc = g[i]
    if (gc === ac) {
      statuses[i] = 'correct'
    } else {
      remaining[ac] = (remaining[ac] ?? 0) + 1
    }
  }

  // Pass 2: mark present using remaining counts.
  for (let i = 0; i < WORD_LEN; i++) {
    if (statuses[i] === 'correct') continue
    const gc = g[i]
    const count = remaining[gc] ?? 0
    if (count > 0) {
      statuses[i] = 'present'
      remaining[gc] = count - 1
    }
  }

  return { guess: g, statuses }
}

export function statusPriority(status: LetterStatus): number {
  switch (status) {
    case 'correct':
      return 3
    case 'present':
      return 2
    case 'absent':
      return 1
  }
}

export function mergeLetterStatus(
  prev: LetterStatus | undefined,
  next: LetterStatus,
): LetterStatus {
  if (!prev) return next
  return statusPriority(next) > statusPriority(prev) ? next : prev
}

export function buildKeyboardStatus(evals: Evaluation[]): Record<string, LetterStatus> {
  const out: Record<string, LetterStatus> = {}
  for (const e of evals) {
    for (let i = 0; i < e.guess.length; i++) {
      const ch = e.guess[i]
      out[ch] = mergeLetterStatus(out[ch], e.statuses[i])
    }
  }
  return out
}

