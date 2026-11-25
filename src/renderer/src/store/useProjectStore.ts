import { create } from 'zustand'
import type { ConlangProject, Glyph, Lexeme, Phoneme, SoundRule } from '@shared/types/conlang'

const createDefaultProject = (): ConlangProject => ({
  version: '1.0.0',
  meta: {
    name: 'Untitled Conlang',
    nativeName: '',
    author: '',
    updatedAt: new Date().toISOString()
  },
  phonology: {
    inventory: [
      {
        id: 'ph-p',
        ipa: 'p',
        romanization: 'p',
        category: 'consonant',
        features: ['voiceless', 'bilabial', 'plosive']
      },
      {
        id: 'ph-t',
        ipa: 't',
        romanization: 't',
        category: 'consonant',
        features: ['voiceless', 'alveolar', 'plosive']
      },
      {
        id: 'ph-k',
        ipa: 'k',
        romanization: 'k',
        category: 'consonant',
        features: ['voiceless', 'velar', 'plosive']
      },
      {
        id: 'ph-s',
        ipa: 's',
        romanization: 's',
        category: 'consonant',
        features: ['voiceless', 'alveolar', 'fricative']
      },
      {
        id: 'ph-m',
        ipa: 'm',
        romanization: 'm',
        category: 'consonant',
        features: ['voiced', 'bilabial', 'nasal']
      },
      {
        id: 'ph-n',
        ipa: 'n',
        romanization: 'n',
        category: 'consonant',
        features: ['voiced', 'alveolar', 'nasal']
      },
      {
        id: 'ph-a',
        ipa: 'a',
        romanization: 'a',
        category: 'vowel',
        features: ['open', 'front', 'unrounded']
      },
      {
        id: 'ph-i',
        ipa: 'i',
        romanization: 'i',
        category: 'vowel',
        features: ['close', 'front', 'unrounded']
      },
      {
        id: 'ph-u',
        ipa: 'u',
        romanization: 'u',
        category: 'vowel',
        features: ['close', 'back', 'rounded']
      }
    ],
    syllableStructures: ['CV', 'CVC'],
    soundRules: [
      {
        id: 'rule-1',
        name: 'Palatalization before /i/',
        target: 'k',
        replacement: 't͡ʃ',
        environment: '_i',
        enabled: true
      }
    ]
  },
  script: {
    direction: 'ltr',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [
      {
        id: 'glyph-a',
        character: 'a',
        name: 'glyph_a',
        svgPath: '',
        advanceWidth: 600
      }
    ]
  },
  lexicon: [],
  syntaxTrees: {}
})

interface ProjectState {
  project: ConlangProject
  currentFilePath?: string
  isDirty: boolean
  updateProjectName: (name: string) => void
  upsertGlyph: (glyph: Glyph) => void
  deleteGlyph: (id: string) => void
  addPhoneme: (phoneme: Phoneme) => void
  removePhoneme: (id: string) => void
  updateSyllableStructures: (structures: string[]) => void
  addSoundRule: (rule: SoundRule) => void
  toggleSoundRule: (id: string) => void
  deleteSoundRule: (id: string) => void
  addLexeme: (lexeme: Lexeme) => void
  saveProject: () => Promise<void>
  openProject: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  currentFilePath: undefined,
  isDirty: false,

  updateProjectName: (name) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        meta: { ...state.project.meta, name }
      }
    })),

  upsertGlyph: (glyph) =>
    set((state) => {
      const exists = state.project.script.glyphs.some((g) => g.id === glyph.id)
      const glyphs = exists
        ? state.project.script.glyphs.map((g) => (g.id === glyph.id ? glyph : g))
        : [...state.project.script.glyphs, glyph]

      return {
        isDirty: true,
        project: {
          ...state.project,
          script: { ...state.project.script, glyphs }
        }
      }
    }),

  deleteGlyph: (id) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        script: {
          ...state.project.script,
          glyphs: state.project.script.glyphs.filter((g) => g.id !== id)
        }
      }
    })),

  addPhoneme: (phoneme) =>
    set((state) => {
      const exists = state.project.phonology.inventory.some((p) => p.ipa === phoneme.ipa)
      if (exists) return state
      return {
        isDirty: true,
        project: {
          ...state.project,
          phonology: {
            ...state.project.phonology,
            inventory: [...state.project.phonology.inventory, phoneme]
          }
        }
      }
    }),

  removePhoneme: (id) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          inventory: state.project.phonology.inventory.filter((p) => p.id !== id)
        }
      }
    })),

  updateSyllableStructures: (structures) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          syllableStructures: structures
        }
      }
    })),

  addSoundRule: (rule) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          soundRules: [...state.project.phonology.soundRules, rule]
        }
      }
    })),

  toggleSoundRule: (id) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          soundRules: state.project.phonology.soundRules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          )
        }
      }
    })),

  deleteSoundRule: (id) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          soundRules: state.project.phonology.soundRules.filter((r) => r.id !== id)
        }
      }
    })),

  addLexeme: (lexeme) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        lexicon: [...state.project.lexicon, lexeme]
      }
    })),

  saveProject: async () => {
    const { project, currentFilePath } = get()
    const result = await window.conlangAPI.saveProject(project, currentFilePath)
    if (!result.canceled && result.filePath) {
      set({ currentFilePath: result.filePath, isDirty: false })
    }
  },

  openProject: async () => {
    const result = await window.conlangAPI.openProject()
    if (!result.canceled && result.project) {
      set({
        project: result.project,
        currentFilePath: result.filePath,
        isDirty: false
      })
    }
  }
}))
