import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useProjectStore } from '@renderer/store/useProjectStore'
import { compileFontBuffer } from '@renderer/lib/fontCompiler'
import type { Glyph } from '@shared/types/conlang'

interface Point {
  x: number
  y: number
}

function strokeToClosedSvgPath(rawPoints: Point[], strokeWidth: number): string {
  const points: Point[] = []
  for (const pt of rawPoints) {
    const prev = points[points.length - 1]
    if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) >= 4) {
      points.push(pt)
    }
  }
  if (points.length === 0) return ''

  const r = strokeWidth / 2
  if (points.length === 1) {
    const { x, y } = points[0]
    return `M ${x - r} ${y - r} L ${x + r} ${y - r} L ${x + r} ${y + r} L ${x - r} ${y + r} Z`
  }

  const left: Point[] = []
  const right: Point[] = []

  for (let i = 0; i < points.length; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[Math.min(points.length - 1, i + 1)]
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len

    left.push({ x: Math.round(points[i].x + nx * r), y: Math.round(points[i].y + ny * r) })
    right.push({ x: Math.round(points[i].x - nx * r), y: Math.round(points[i].y - ny * r) })
  }

  const outline = [...left, ...right.reverse()]
  return outline.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z'
}

export function GlyphEditor(): ReactElement {
  const { project, upsertGlyph, deleteGlyph } = useProjectStore()
  const glyphs = project.script.glyphs

  const [selectedId, setSelectedId] = useState<string>(glyphs[0]?.id ?? '')
  const [newChar, setNewChar] = useState('')
  const [strokeWidth, setStrokeWidth] = useState(44)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [activeStroke, setActiveStroke] = useState<Point[]>([])
  const [previewText, setPreviewText] = useState('a')
  const [liveFontFamily, setLiveFontFamily] = useState('sans-serif')

  const svgRef = useRef<SVGSVGElement | null>(null)
  const activeGlyph: Glyph | undefined = glyphs.find((g) => g.id === selectedId) ?? glyphs[0]

  useEffect(() => {
    let cancelled = false
    try {
      const buffer = compileFontBuffer(project)
      const family = `ConlangLive_${Date.now()}`
      const face = new FontFace(family, buffer)
      face.load().then((loaded) => {
        if (!cancelled) {
          document.fonts.add(loaded)
          setLiveFontFamily(family)
        }
      })
    } catch {
      // Ignore transient empty font state while editing
    }
    return () => {
      cancelled = true
    }
  }, [project])

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current
    if (!svg) return null
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const rawX = (e.clientX - ctm.e) / ctm.a
    const rawY = (e.clientY - ctm.f) / ctm.d
    const step = snapToGrid ? 25 : 1
    return {
      x: Math.max(0, Math.min(1000, Math.round(rawX / step) * step)),
      y: Math.max(0, Math.min(1000, Math.round(rawY / step) * step))
    }
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!activeGlyph) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = getSvgCoords(e)
    if (pt) setActiveStroke([pt])
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (activeStroke.length === 0) return
    const pt = getSvgCoords(e)
    if (pt) setActiveStroke((prev) => [...prev, pt])
  }

  const handlePointerUp = (): void => {
    if (!activeGlyph || activeStroke.length === 0) return
    const newSegment = strokeToClosedSvgPath(activeStroke, strokeWidth)
    if (newSegment) {
      const combined = activeGlyph.svgPath ? `${activeGlyph.svgPath} ${newSegment}` : newSegment
      upsertGlyph({ ...activeGlyph, svgPath: combined })
    }
    setActiveStroke([])
  }

  const handleAddGlyph = (e: React.FormEvent): void => {
    e.preventDefault()
    const char = [...newChar.trim()][0]
    if (!char) return
    const id = `glyph-${char.codePointAt(0)}-${Date.now()}`
    upsertGlyph({
      id,
      character: char,
      name: `glyph_${char}`,
      svgPath: '',
      advanceWidth: 600
    })
    setSelectedId(id)
    setNewChar('')
    setPreviewText((prev) => (prev.includes(char) ? prev : prev + char))
  }

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: 16, height: '100%' }}
    >
      {/* Left: Glyph Inventory */}
      <div style={{ background: '#18181b', padding: 12, borderRadius: 8, overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Glyphs ({glyphs.length})</h3>
        <form onSubmit={handleAddGlyph} style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            value={newChar}
            onChange={(e) => setNewChar(e.target.value)}
            placeholder="Char (e.g. k, ə)"
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
              borderRadius: 4
            }}
          />
          <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
            +
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {glyphs.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              style={{
                padding: 8,
                background: g.id === activeGlyph?.id ? '#2563eb' : '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <svg viewBox="0 0 1000 1000" width={36} height={36}>
                <path d={g.svgPath} fill="#f4f4f5" />
              </svg>
              <span style={{ fontSize: 12, marginTop: 4 }}>{g.character}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: 1000x1000 Vector Drawing Canvas */}
      <div
        style={{
          background: '#18181b',
          padding: 16,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 12,
            width: '100%',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <strong>Editing:</strong>{' '}
            <span style={{ fontSize: 18, color: '#60a5fa' }}>
              {activeGlyph?.character ?? 'None'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <label>
              Width:
              <input
                type="range"
                min={16}
                max={90}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                style={{ width: 80, marginLeft: 6 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              Snap
            </label>
            <button
              onClick={() => activeGlyph && upsertGlyph({ ...activeGlyph, svgPath: '' })}
              style={{ padding: '4px 10px', cursor: 'pointer' }}
            >
              Clear
            </button>
            {activeGlyph && glyphs.length > 1 && (
              <button
                onClick={() => deleteGlyph(activeGlyph.id)}
                style={{ padding: '4px 10px', cursor: 'pointer', color: '#f87171' }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: '100%',
            maxWidth: 460,
            aspectRatio: '1 / 1',
            background: '#09090b',
            border: '1px solid #3f3f46',
            borderRadius: 6,
            touchAction: 'none',
            cursor: 'crosshair'
          }}
        >
          {/* Typographic Guide Lines */}
          <line
            x1={0}
            y1={150}
            x2={1000}
            y2={150}
            stroke="#27272a"
            strokeDasharray="12 12"
            strokeWidth={3}
          />
          <line
            x1={0}
            y1={450}
            x2={1000}
            y2={450}
            stroke="#27272a"
            strokeDasharray="12 12"
            strokeWidth={3}
          />
          <line x1={0} y1={800} x2={1000} y2={800} stroke="#3b82f6" strokeWidth={4} />
          {activeGlyph && (
            <line
              x1={activeGlyph.advanceWidth}
              y1={0}
              x2={activeGlyph.advanceWidth}
              y2={1000}
              stroke="#eab308"
              strokeDasharray="10 10"
              strokeWidth={3}
            />
          )}

          {/* Saved Glyph Contours */}
          {activeGlyph && <path d={activeGlyph.svgPath} fill="#f4f4f5" />}

          {/* Live Stroke Preview */}
          {activeStroke.length > 0 && (
            <path
              d={strokeToClosedSvgPath(activeStroke, strokeWidth)}
              fill="#60a5fa"
              opacity={0.85}
            />
          )}
        </svg>
      </div>

      {/* Right: Advance Width & Live Conscript Type Tester */}
      <div
        style={{
          background: '#18181b',
          padding: 14,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {activeGlyph && (
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              Advance Width: {activeGlyph.advanceWidth}
            </label>
            <input
              type="range"
              min={250}
              max={1000}
              step={25}
              value={activeGlyph.advanceWidth}
              onChange={(e) =>
                upsertGlyph({ ...activeGlyph, advanceWidth: Number(e.target.value) })
              }
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Live Conscript Tester</h3>
          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            rows={3}
            placeholder="Type mapped characters here..."
            style={{
              width: '100%',
              padding: 8,
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
              borderRadius: 4,
              marginBottom: 10,
              boxSizing: 'border-box'
            }}
          />
          <div
            style={{
              flex: 1,
              padding: 16,
              background: '#09090b',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              fontFamily: `"${liveFontFamily}", sans-serif`,
              fontSize: 42,
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}
          >
            {previewText}
          </div>
        </div>
      </div>
    </div>
  )
}
