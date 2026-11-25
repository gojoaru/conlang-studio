import type { Phoneme, SoundRule } from '@shared/types/conlang'

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })

export function splitGraphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPatternToken(expr: string, consonants: string[], vowels: string[]): string {
  if (!expr.trim()) return ''

  const cGroup = consonants.length > 0 ? `(?:${consonants.map(escapeRegex).join('|')})` : '(?!)'
  const vGroup = vowels.length > 0 ? `(?:${vowels.map(escapeRegex).join('|')})` : '(?!)'

  let result = ''
  for (const ch of splitGraphemes(expr)) {
    if (ch === 'C') {
      result += cGroup
    } else if (ch === 'V') {
      result += vGroup
    } else if (ch === '#') {
      result += '(?:^|$)'
    } else {
      result += escapeRegex(ch)
    }
  }
  return result
}

export function applySingleRule(word: string, rule: SoundRule, inventory: Phoneme[]): string {
  if (!rule.enabled || !rule.target.trim()) return word

  const consonants = inventory
    .filter((p) => p.category === 'consonant')
    .map((p) => p.ipa)
    .sort((a, b) => b.length - a.length)

  const vowels = inventory
    .filter((p) => p.category === 'vowel')
    .map((p) => p.ipa)
    .sort((a, b) => b.length - a.length)

  const targetPattern = buildPatternToken(rule.target, consonants, vowels)
  const env = rule.environment.trim()

  if (!env || !env.includes('_')) {
    const regex = new RegExp(targetPattern, 'gu')
    return word.replace(regex, rule.replacement)
  }

  const [leftRaw, rightRaw] = env.split('_')
  const leftPattern = buildPatternToken(leftRaw, consonants, vowels)
  const rightPattern = buildPatternToken(rightRaw, consonants, vowels)

  const fullRegex = new RegExp(`(${leftPattern})(${targetPattern})(?=${rightPattern})`, 'gu')

  return word.replace(fullRegex, (_match, leftCaptured: string) => {
    return `${leftCaptured}${rule.replacement}`
  })
}

export interface EvolutionTrace {
  original: string
  steps: { ruleName: string; output: string }[]
  final: string
}

export function evolveWord(word: string, rules: SoundRule[], inventory: Phoneme[]): EvolutionTrace {
  let current = word.trim()
  const steps: { ruleName: string; output: string }[] = []

  for (const rule of rules) {
    if (!rule.enabled) continue
    const next = applySingleRule(current, rule, inventory)
    steps.push({ ruleName: rule.name || `${rule.target} → ${rule.replacement}`, output: next })
    current = next
  }

  return {
    original: word.trim(),
    steps,
    final: current
  }
}

export function generateCandidateWords(
  inventory: Phoneme[],
  structures: string[],
  count = 8
): { ipa: string; romanized: string }[] {
  const consonants = inventory.filter((p) => p.category === 'consonant')
  const vowels = inventory.filter((p) => p.category === 'vowel')
  const validTemplates = structures.map((s) => s.trim().toUpperCase()).filter(Boolean)

  if (vowels.length === 0 || validTemplates.length === 0) return []

  const results: { ipa: string; romanized: string }[] = []

  for (let i = 0; i < count; i++) {
    const syllableCount = Math.random() < 0.35 ? 1 : 2
    let ipa = ''
    let romanized = ''

    for (let s = 0; s < syllableCount; s++) {
      const template = validTemplates[Math.floor(Math.random() * validTemplates.length)]
      for (const slot of template) {
        if (slot === 'C' && consonants.length > 0) {
          const picked = consonants[Math.floor(Math.random() * consonants.length)]
          ipa += picked.ipa
          romanized += picked.romanization || picked.ipa
        } else if (slot === 'V') {
          const picked = vowels[Math.floor(Math.random() * vowels.length)]
          ipa += picked.ipa
          romanized += picked.romanization || picked.ipa
        }
      }
    }

    results.push({ ipa, romanized })
  }

  return results
}
