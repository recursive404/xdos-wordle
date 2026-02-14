import type { PersistedState, Stats } from './types'

const STORAGE_KEY = 'xdos-wordle/v1'

function defaultStats(): Stats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDist: [0, 0, 0, 0, 0, 0],
  }
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, games: {}, stats: defaultStats() }
    }
    const parsed = JSON.parse(raw) as PersistedState
    if (!parsed || parsed.version !== 1) {
      return { version: 1, games: {}, stats: defaultStats() }
    }
    return {
      version: 1,
      games: parsed.games ?? {},
      stats: parsed.stats ?? defaultStats(),
    }
  } catch {
    return { version: 1, games: {}, stats: defaultStats() }
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

