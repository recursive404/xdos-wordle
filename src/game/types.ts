export type LetterStatus = 'absent' | 'present' | 'correct'

export interface Evaluation {
  guess: string
  statuses: LetterStatus[]
}

export interface PersistedGame {
  guesses: string[]
  // Set after the game ends; used to prevent double-counting stats on reload.
  result?: {
    won: boolean
    attempts: number
  }
}

export interface Stats {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  guessDist: number[] // length 6: wins in 1..6 attempts
  lastCompletedDate?: string // YYYY-MM-DD (America/New_York)
}

export interface PersistedState {
  version: 1
  games: Record<string, PersistedGame>
  stats: Stats
}

