import type { ReactElement } from 'react'
import { useProjectStore } from '@renderer/store/useProjectStore'
import { compileFontBuffer } from '@renderer/lib/fontCompiler'
import { GlyphEditor } from '@renderer/features/script-editor/GlyphEditor'

export default function App(): ReactElement {
  const { project, isDirty, updateProjectName, saveProject, openProject } = useProjectStore()

  const handleExportTtf = async (): Promise<void> => {
    const buffer = compileFontBuffer(project)
    await window.conlangAPI.exportFont(project.meta.name || 'conlang-script', buffer)
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {/* Top Toolbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          background: '#18181b',
          borderBottom: '1px solid #27272a'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={project.meta.name}
            onChange={(e) => updateProjectName(e.target.value)}
            style={{
              fontSize: 16,
              fontWeight: 600,
              background: 'transparent',
              color: '#fff',
              border: '1px solid transparent',
              padding: '4px 8px',
              borderRadius: 4
            }}
          />
          {isDirty && <span style={{ fontSize: 12, color: '#a1a1aa' }}>• Unsaved</span>}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openProject} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            Open .conlang
          </button>
          <button onClick={saveProject} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            Save Project
          </button>
          <button
            onClick={handleExportTtf}
            style={{
              padding: '6px 14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Export .TTF
          </button>
        </div>
      </header>

      {/* Active Workspace */}
      <main style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
        <GlyphEditor />
      </main>
    </div>
  )
}
