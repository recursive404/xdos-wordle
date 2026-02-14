import { describe, it, expect } from 'vitest'
import { ANSWERS, ALLOWED_GUESSES } from './words'

describe('Wordle word lists', () => {
  describe('ANSWERS', () => {
    it('should contain 75 curated answer words', () => {
      expect(ANSWERS).toHaveLength(75)
    })

    it('should contain only 5-letter lowercase words', () => {
      ANSWERS.forEach((word) => {
        expect(word).toMatch(/^[a-z]{5}$/)
      })
    })

    it('should include expected sample words', () => {
      expect(ANSWERS).toContain('cigar')
      expect(ANSWERS).toContain('delta')
      expect(ANSWERS).toContain('first')
    })
  })

  describe('ALLOWED_GUESSES', () => {
    it('should contain significantly more words than answers', () => {
      expect(ALLOWED_GUESSES.size).toBeGreaterThan(10000)
    })

    it('should include all answer words', () => {
      ANSWERS.forEach((answer) => {
        expect(ALLOWED_GUESSES.has(answer)).toBe(true)
      })
    })

    // Regression test: these common words were incorrectly rejected before the fix
    it('should accept common 5-letter words (regression test for #1)', () => {
      expect(ALLOWED_GUESSES.has('house')).toBe(true)
      expect(ALLOWED_GUESSES.has('train')).toBe(true)
      expect(ALLOWED_GUESSES.has('phone')).toBe(true)
    })

    it('should accept additional common words', () => {
      const commonWords = ['apple', 'bread', 'water', 'music', 'happy', 'world']
      commonWords.forEach((word) => {
        expect(ALLOWED_GUESSES.has(word)).toBe(true)
      })
    })

    it('should reject gibberish', () => {
      expect(ALLOWED_GUESSES.has('zzzzz')).toBe(false)
      expect(ALLOWED_GUESSES.has('xxxxx')).toBe(false)
      expect(ALLOWED_GUESSES.has('qqqqqq')).toBe(false)
    })

    it('should reject non-5-letter words', () => {
      expect(ALLOWED_GUESSES.has('cat')).toBe(false)
      expect(ALLOWED_GUESSES.has('houses')).toBe(false)
      expect(ALLOWED_GUESSES.has('a')).toBe(false)
    })
  })
})
