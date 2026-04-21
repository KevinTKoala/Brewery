import { containsBannedWords, getBannedWords, filterBannedWords } from '../word-filter'

describe('word-filter', () => {
  describe('containsBannedWords', () => {
    it('should return true when text contains a banned word', () => {
      expect(containsBannedWords('This is stupid')).toBe(true)
      expect(containsBannedWords('I hate this')).toBe(true)
    })

    it('should return false when text contains no banned words', () => {
      expect(containsBannedWords('This is a nice message')).toBe(false)
      expect(containsBannedWords('I love coffee')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(containsBannedWords('This is STUPID')).toBe(true)
      expect(containsBannedWords('This is Stupid')).toBe(true)
    })
  })

  describe('getBannedWords', () => {
    it('should return array of banned words found in text', () => {
      expect(getBannedWords('This is stupid and idiot')).toEqual(expect.arrayContaining(['stupid', 'idiot']))
      expect(getBannedWords('I hate and kill')).toEqual(expect.arrayContaining(['hate', 'kill']))
    })

    it('should return empty array when no banned words found', () => {
      expect(getBannedWords('This is nice')).toEqual([])
    })

    it('should return unique banned words', () => {
      expect(getBannedWords('stupid stupid stupid')).toEqual(['stupid'])
    })
  })

  describe('filterBannedWords', () => {
    it('should replace banned words with asterisks', () => {
      expect(filterBannedWords('This is stupid')).toBe('This is ******')
      expect(filterBannedWords('I hate this')).toBe('I **** this')
    })

    it('should preserve text length when filtering', () => {
      const original = 'This is stupid'
      const filtered = filterBannedWords(original)
      expect(filtered.length).toBe(original.length)
    })

    it('should not modify text with no banned words', () => {
      expect(filterBannedWords('This is nice')).toBe('This is nice')
    })
  })
})
