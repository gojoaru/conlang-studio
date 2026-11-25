import { create } from 'zustand'
import type { ConlangProject, Glyph, Lexeme, Phoneme } from '@shared/types/conlang'

const createDefaultProject = (): ConlangProject => ({
  version: '1.0.0',
  meta: {
    name: 'Untitled Conlang',
    nativeName: '',
    author: '',
    updatedAt: new Date().toISOString()
  },
  phonology: {
    inventory: [],
    syllableStructures: ['CV', 'CVC'],
    soundRules: []
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
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        phonology: {
          ...state.project.phonology,
          inventory: [...state.project.phonology.inventory, phoneme]
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
