import opentype from 'opentype.js'
import type { ConlangProject } from '@shared/types/conlang'

function svgPathToOpenTypePath(svgPath: string, ascender: number): opentype.Path {
  const path = new opentype.Path()
  if (!svgPath.trim()) return path

  const tokens = svgPath.match(/[MLZmlz]|-?\d+(\.\d+)?/g)
  if (!tokens) return path

  let i = 0
  let cmd = ''

  while (i < tokens.length) {
    const token = tokens[i]
    if (/^[MLZmlz]$/.test(token)) {
      cmd = token.toUpperCase()
      i++
      if (cmd === 'Z') {
        path.close()
      }
      continue
    }

    if (cmd === 'M' || cmd === 'L') {
      const x = parseFloat(tokens[i])
      const y = parseFloat(tokens[i + 1])
      i += 2
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        const fontY = ascender - y
        if (cmd === 'M') {
          path.moveTo(x, fontY)
          cmd = 'L'
        } else {
          path.lineTo(x, fontY)
        }
      }
    } else {
      i++
    }
  }

  return path
}

export function compileProjectFont(project: ConlangProject): opentype.Font {
  const { unitsPerEm, ascender, descender, glyphs } = project.script

  const notdefPath = new opentype.Path()
  notdefPath.moveTo(100, 0)
  notdefPath.lineTo(100, 700)
  notdefPath.lineTo(500, 700)
  notdefPath.lineTo(500, 0)
  notdefPath.close()

  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 600,
    path: notdefPath
  })

  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 320,
    path: new opentype.Path()
  })

  const compiledGlyphs: opentype.Glyph[] = [notdefGlyph, spaceGlyph]

  for (const glyph of glyphs) {
    if (!glyph.character) continue
    const codePoint = glyph.character.codePointAt(0)
    if (codePoint === undefined || codePoint === 32) continue

    compiledGlyphs.push(
      new opentype.Glyph({
        name: glyph.name || `uni${codePoint.toString(16).toUpperCase()}`,
        unicode: codePoint,
        advanceWidth: glyph.advanceWidth || 600,
        path: svgPathToOpenTypePath(glyph.svgPath, ascender)
      })
    )
  }

  return new opentype.Font({
    familyName: project.meta.name || 'ConlangScript',
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    glyphs: compiledGlyphs
  })
}

export function compileFontBuffer(project: ConlangProject): ArrayBuffer {
  const font = compileProjectFont(project)
  return font.toArrayBuffer()
}
