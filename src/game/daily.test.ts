import { describe, expect, it } from 'vitest'
import { pickDailyAnswerIndex } from './daily'

describe('pickDailyAnswerIndex', () => {
  it('is deterministic for a given date and length', () => {
    expect(pickDailyAnswerIndex('2026-02-14', 100)).toBe(pickDailyAnswerIndex('2026-02-14', 100))
  })

  it('wraps by modulo', () => {
    const len = 3
    const a = pickDailyAnswerIndex('2021-06-19', len)
    const b = pickDailyAnswerIndex('2021-06-22', len) // +3 days
    expect(a).toBe(b)
  })
})

