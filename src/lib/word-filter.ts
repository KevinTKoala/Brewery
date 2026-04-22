import { BANNED_WORDS } from '@/config/banned-words'

/**
 * Check if text contains any banned words
 * @param text - The text to check
 * @returns true if banned words are found, false otherwise
 */
export function containsBannedWords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return BANNED_WORDS.some(word => lowerText.includes(word))
}

/**
 * Get a list of banned words found in the text
 * @param text - The text to check
 * @returns Array of banned words found
 */
export function getBannedWords(text: string): string[] {
  const lowerText = text.toLowerCase()
  return BANNED_WORDS.filter(word => lowerText.includes(word))
}

/**
 * Filter out banned words from text (replace with asterisks)
 * @param text - The text to filter
 * @returns Filtered text with banned words replaced
 */
export function filterBannedWords(text: string): string {
  let filteredText = text
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filteredText = filteredText.replace(regex, '*'.repeat(word.length))
  })
  return filteredText
}
