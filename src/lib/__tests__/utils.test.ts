import { cn } from '../utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('should handle Tailwind class conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz')
  })
})
