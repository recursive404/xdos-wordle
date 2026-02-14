import { describe, expect, it } from 'vitest'
import { evaluateGuess } from './engine'

describe('evaluateGuess', () => {
  it('marks correct letters', () => {
    const e = evaluateGuess('cigar', 'cigar')
    expect(e.statuses).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
  })

  it('handles repeated letters (answer has one, guess has two)', () => {
    // answer: M A R R Y
    // guess:  A R R A Y
    const e = evaluateGuess('marry', 'array')
    // a is present (in answer at pos1), r correct at pos3/4? Actually:
    // m a r r y
    // a r r a y
    // pos3 r correct, pos4 a absent (only one a, already used), pos5 y correct.
    expect(e.statuses).toEqual(['present', 'present', 'correct', 'absent', 'correct'])
  })
})

