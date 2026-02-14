import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

import { pickDailyAnswerIndex } from './game/daily'
import { addDays, getEtDateString } from './game/date'
import {
  buildKeyboardStatus,
  evaluateGuess,
  isFiveLetters,
  MAX_GUESSES,
  normalizeGuess,
  WORD_LEN,
} from './game/engine'
import { loadState, saveState } from './game/storage'
import { buildShareText } from './game/share'
import { ALLOWED_GUESSES, ANSWERS } from './game/words'
import type { Evaluation, PersistedGame, PersistedState } from './game/types'

const KEY_ROWS: readonly string[] = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

function getDailyFromUrlOrNow(): { dateEt: string; answer: string; index: number } {
  const params = new URLSearchParams(window.location.search)
  const dateParam = params.get('date')?.trim() ?? ''
  const dateEt =
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getEtDateString(new Date())
  const index = pickDailyAnswerIndex(dateEt, ANSWERS.length)
  return { dateEt, index, answer: ANSWERS[index] }
}

function App() {
  const [daily] = useState(() => getDailyFromUrlOrNow())
  const [persisted, setPersisted] = useState<PersistedState>(() => loadState())

  const existingGame: PersistedGame | undefined = persisted.games[daily.dateEt]
  const [guesses, setGuesses] = useState<string[]>(() => existingGame?.guesses ?? [])
  const [current, setCurrent] = useState<string>('')
  const [toast, setToast] = useState<string>('')
  const [showModal, setShowModal] = useState<boolean>(false)
  const toastTimer = useRef<number | null>(null)

  const evaluations: Evaluation[] = useMemo(
    () => guesses.map(g => evaluateGuess(daily.answer, g)),
    [daily.answer, guesses],
  )

  const keyboardStatus = useMemo(() => buildKeyboardStatus(evaluations), [evaluations])

  const isWon = guesses.some(g => g === daily.answer)
  const isLost = !isWon && guesses.length >= MAX_GUESSES
  const isOver = isWon || isLost

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 1800)
  }

  function persist(nextGuesses: string[], finalize?: { won: boolean; attempts: number }) {
    const next: PersistedState = {
      ...persisted,
      games: {
        ...persisted.games,
        [daily.dateEt]: {
          guesses: nextGuesses,
          result: existingGame?.result ?? finalize,
        },
      },
    }

    // Apply stats exactly once per date (first time we finalize).
    if (finalize && !existingGame?.result) {
      const stats = { ...next.stats }
      stats.played += 1
      if (finalize.won) {
        stats.wins += 1
        stats.guessDist[finalize.attempts - 1] = (stats.guessDist[finalize.attempts - 1] ?? 0) + 1

        const last = stats.lastCompletedDate
        const expectedPrev = last ? addDays(last, 1) : undefined
        if (last && expectedPrev === daily.dateEt) {
          stats.currentStreak += 1
        } else {
          stats.currentStreak = 1
        }
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
      } else {
        stats.currentStreak = 0
      }
      stats.lastCompletedDate = daily.dateEt
      next.stats = stats
    }

    saveState(next)
    setPersisted(next)
  }

  function onAddLetter(letter: string) {
    if (isOver) return
    if (current.length >= WORD_LEN) return
    setCurrent(prev => prev + letter)
  }

  function onBackspace() {
    if (isOver) return
    setCurrent(prev => prev.slice(0, -1))
  }

  function onEnter() {
    if (isOver) {
      setShowModal(true)
      return
    }
    if (current.length !== WORD_LEN) {
      showToast('Not enough letters')
      return
    }
    const guess = normalizeGuess(current)
    if (!isFiveLetters(guess)) {
      showToast('Use A–Z only')
      return
    }
    if (!ALLOWED_GUESSES.has(guess)) {
      showToast('Not in word list')
      return
    }
    if (guesses.includes(guess)) {
      showToast('Already guessed')
      return
    }

    const nextGuesses = [...guesses, guess]
    setGuesses(nextGuesses)
    setCurrent('')

    const won = guess === daily.answer
    const lost = !won && nextGuesses.length >= MAX_GUESSES
    if (won || lost) {
      persist(nextGuesses, { won, attempts: nextGuesses.length })
      setShowModal(true)
    } else {
      persist(nextGuesses)
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'Enter') {
        e.preventDefault()
        onEnter()
        return
      }
      if (k === 'Backspace') {
        e.preventDefault()
        onBackspace()
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        onAddLetter(k.toLowerCase())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, guesses, isOver])

  useEffect(() => {
    if (!isOver) return
    // If we loaded a completed game from storage, show modal once (soft).
    if (existingGame?.result) setShowModal(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onShare() {
    const attempts: number | 'X' = isWon ? guesses.length : 'X'
    const text = buildShareText({ dateEt: daily.dateEt, attempts, evaluations })
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('Copied results'))
      .catch(() => showToast('Copy failed'))
  }

  const stats = persisted.stats

  const boardRows = useMemo(() => {
    const rows: Array<{
      letters: string[]
      statuses?: Evaluation['statuses']
      locked: boolean
    }> = []
    for (let r = 0; r < MAX_GUESSES; r++) {
      if (r < guesses.length) {
        const e = evaluations[r]
        rows.push({ letters: e.guess.split(''), statuses: e.statuses, locked: true })
      } else if (r === guesses.length && !isOver) {
        rows.push({ letters: current.padEnd(WORD_LEN).split(''), locked: false })
      } else {
        rows.push({ letters: ''.padEnd(WORD_LEN).split(''), locked: false })
      }
    }
    return rows
  }, [current, evaluations, guesses.length, isOver, guesses])

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <div className="title">xdOS Wordle</div>
          <div className="subtle">Daily puzzle: {daily.dateEt} (America/New_York)</div>
        </div>
        <button
          className="button"
          onClick={() => setShowModal(true)}
          aria-label="Open stats"
          type="button"
        >
          Stats
        </button>
      </div>

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}

      <div className="panel" aria-label="Board">
        <div className="board" role="grid" aria-rowcount={MAX_GUESSES} aria-colcount={WORD_LEN}>
          {boardRows.map((row, r) => (
            <div className="row" role="row" key={r}>
              {row.letters.map((ch, c) => {
                const status = row.statuses?.[c]
                const filled = ch.trim().length > 0
                return (
                  <div
                    key={c}
                    role="gridcell"
                    aria-label={`Row ${r + 1} column ${c + 1} ${filled ? ch.toUpperCase() : 'empty'}`}
                    className="tile"
                    data-state={filled ? 'filled' : 'empty'}
                    data-status={status ?? undefined}
                  >
                    {ch.trim() ? ch.toUpperCase() : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="srOnly" aria-live="polite">
          {isWon ? 'You won.' : isLost ? `You lost. The word was ${daily.answer}.` : ''}
        </div>
      </div>

      <div className="keyboard" aria-label="Keyboard">
        <div className="keyRow">
          {KEY_ROWS[0].split('').map(k => (
            <button
              key={k}
              className="key"
              type="button"
              onClick={() => onAddLetter(k)}
              data-status={keyboardStatus[k] ?? undefined}
              aria-label={`Letter ${k.toUpperCase()}`}
              disabled={isOver}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="keyRow">
          {KEY_ROWS[1].split('').map(k => (
            <button
              key={k}
              className="key"
              type="button"
              onClick={() => onAddLetter(k)}
              data-status={keyboardStatus[k] ?? undefined}
              aria-label={`Letter ${k.toUpperCase()}`}
              disabled={isOver}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="keyRow">
          <button className="key keyWide" type="button" onClick={onEnter} disabled={false}>
            Enter
          </button>
          {KEY_ROWS[2].split('').map(k => (
            <button
              key={k}
              className="key"
              type="button"
              onClick={() => onAddLetter(k)}
              data-status={keyboardStatus[k] ?? undefined}
              aria-label={`Letter ${k.toUpperCase()}`}
              disabled={isOver}
            >
              {k}
            </button>
          ))}
          <button className="key keyWide" type="button" onClick={onBackspace} disabled={isOver}>
            Back
          </button>
        </div>
      </div>

      {showModal ? (
        <div
          className="modalBackdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Stats"
          onClick={() => setShowModal(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div>
              <div className="title">{isWon ? 'You got it' : isLost ? 'Out of guesses' : 'Stats'}</div>
              <div className="subtle">
                {isOver ? `Answer: ${daily.answer.toUpperCase()}` : 'Keep playing.'}
              </div>
            </div>

            <div>
              <div>
                Played: <b>{stats.played}</b> · Wins: <b>{stats.wins}</b> · Win%:{' '}
                <b>{stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}</b>
              </div>
              <div>
                Streak: <b>{stats.currentStreak}</b> (max <b>{stats.maxStreak}</b>)
              </div>
            </div>

            <div className="modalActions">
              {isOver ? (
                <button className="button buttonPrimary" type="button" onClick={onShare}>
                  Copy share text
                </button>
              ) : null}
              <button className="button" type="button" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>

            {stats.lastCompletedDate ? (
              <div className="subtle">Last completed: {stats.lastCompletedDate}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
