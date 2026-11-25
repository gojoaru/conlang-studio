export interface Phoneme {
  id: string
  ipa: string // e.g. "t͡sʰ", "ə"
  romanization: string // e.g. "ts", "e"
  category: 'consonant' | 'vowel' | 'diacritic'
  features: string[] // e.g. ["voiceless", "alveolar", "affricate"]
}

export interface SoundRule {
  id: string
  name: string
  target: string // Segment or feature class to match
  replacement: string // Output segment ("" for deletion)
  environment: string // e.g. "_# " (word-final) or "V_V" (intervocalic)
  enabled: boolean
}

export interface Glyph {
  id: string
  character: string // Mapped Latin/IPA key or PUA codepoint (e.g. "\uE000")
  name: string // e.g. "glyph_ts"
  svgPath: string // SVG path 'd' data on a 1000x1000 em-square grid
  advanceWidth: number // Horizontal spacing (default: 600)
}

export interface Lexeme {
  id: string
  word: string // Romanized orthography
  ipa: string // Phonemic transcription
  partOfSpeech: string // e.g. "noun", "verb", "adj"
  gloss: string // Short translation
  notes: string
  parentIds: string[] // Links to ancestral/root Lexeme IDs for etymology trees
}

export interface TreeNodeData {
  id: string
  label: string
  sublabel?: string
  position: { x: number; y: number }
}

export interface ConlangProject {
  version: string
  meta: {
    name: string
    nativeName: string
    author: string
    updatedAt: string
  }
  phonology: {
    inventory: Phoneme[]
    syllableStructures: string[] // e.g. ["CV", "CVC", "V"]
    soundRules: SoundRule[]
  }
  script: {
    direction: 'ltr' | 'rtl' | 'ttb'
    unitsPerEm: number // Standard 1000 for opentype.js compatibility
    ascender: number // e.g. 800
    descender: number // e.g. -200
    glyphs: Glyph[]
  }
  lexicon: Lexeme[]
  syntaxTrees: Record<string, TreeNodeData[]>
}
