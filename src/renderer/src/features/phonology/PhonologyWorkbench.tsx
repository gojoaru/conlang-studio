import { useState, type ReactElement } from 'react'
import { useProjectStore } from '@renderer/store/useProjectStore'
import { evolveWord, generateCandidateWords } from '@renderer/lib/soundChanger'
import type { Phoneme } from '@shared/types/conlang'

const QUICK_CONSONANTS = [
  'p',
  'b',
  't',
  'd',
  'k',
  'g',
  'q',
  'ʔ',
  'm',
  'n',
  'ɲ',
  'ŋ',
  'f',
  'v',
  'θ',
  'ð',
  's',
  'z',
  'ʃ',
  'ʒ',
  'x',
  'ɣ',
  'h',
  't͡s',
  't͡ʃ',
  'd͡ʒ',
  'l',
  'r',
  'ɾ',
  'j',
  'w'
]

const QUICK_VOWELS = ['i', 'y', 'ɨ', 'u', 'e', 'ø', 'ə', 'o', 'ɛ', 'ɔ', 'a', 'ɑ']

export function PhonologyWorkbench(): ReactElement {
  const {
    project,
    addPhoneme,
    removePhoneme,
    updateSyllableStructures,
    addSoundRule,
    toggleSoundRule,
    deleteSoundRule
  } = useProjectStore()

  const { inventory, syllableStructures, soundRules } = project.phonology

  const [customIpa, setCustomIpa] = useState('')
  const [customRom, setCustomRom] = useState('')
  const [customCat, setCustomCat] = useState<Phoneme['category']>('consonant')

  const [syllableInput, setSyllableInput] = useState(syllableStructures.join(', '))
  const [generatedWords, setGeneratedWords] = useState<{ ipa: string; romanized: string }[]>([])

  const [ruleName, setRuleName] = useState('')
  const [ruleTarget, setRuleTarget] = useState('')
  const [ruleReplacement, setRuleReplacement] = useState('')
  const [ruleEnv, setRuleEnv] = useState('')

  const [sandboxInput, setSandboxInput] = useState('kapi\ntuka\nsaki')

  const activeSet = new Set(inventory.map((p) => p.ipa))

  const toggleQuickPhoneme = (ipa: string, category: Phoneme['category']): void => {
    const existing = inventory.find((p) => p.ipa === ipa)
    if (existing) {
      removePhoneme(existing.id)
    } else {
      addPhoneme({
        id: `ph-${ipa}`,
        ipa,
        romanization: ipa,
        category,
        features: []
      })
    }
  }

  const handleAddCustomPhoneme = (e: React.FormEvent): void => {
    e.preventDefault()
    const ipa = customIpa.trim()
    if (!ipa) return
    addPhoneme({
      id: `ph-${ipa}`,
      ipa,
      romanization: customRom.trim() || ipa,
      category: customCat,
      features: []
    })
    setCustomIpa('')
    setCustomRom('')
  }

  const handleSyllableBlur = (): void => {
    const parsed = syllableInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    updateSyllableStructures(parsed)
  }

  const handleGenerateWords = (): void => {
    const words = generateCandidateWords(inventory, syllableStructures, 8)
    setGeneratedWords(words)
    if (words.length > 0) {
      setSandboxInput(words.map((w) => w.ipa).join('\n'))
    }
  }

  const handleAddRule = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!ruleTarget.trim()) return
    addSoundRule({
      id: `rule-${Date.now()}`,
      name: ruleName.trim() || `${ruleTarget} → ${ruleReplacement || '∅'}`,
      target: ruleTarget.trim(),
      replacement: ruleReplacement.trim(),
      environment: ruleEnv.trim(),
      enabled: true
    })
    setRuleName('')
    setRuleTarget('')
    setRuleReplacement('')
    setRuleEnv('')
  }

  const sandboxLines = sandboxInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: 16, height: '100%' }}
    >
      {/* Left: IPA Quick-Picker */}
      <div style={{ background: '#18181b', padding: 14, borderRadius: 8, overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>IPA Quick-Picker</h3>

        <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 6 }}>Consonants</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {QUICK_CONSONANTS.map((ipa) => {
            const active = activeSet.has(ipa)
            return (
              <button
                key={ipa}
                onClick={() => toggleQuickPhoneme(ipa, 'consonant')}
                style={{
                  padding: '4px 8px',
                  background: active ? '#2563eb' : '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                {ipa}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 6 }}>Vowels</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {QUICK_VOWELS.map((ipa) => {
            const active = activeSet.has(ipa)
            return (
              <button
                key={ipa}
                onClick={() => toggleQuickPhoneme(ipa, 'vowel')}
                style={{
                  padding: '4px 8px',
                  background: active ? '#16a34a' : '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                {ipa}
              </button>
            )
          })}
        </div>

        <form
          onSubmit={handleAddCustomPhoneme}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <div style={{ fontSize: 12, color: '#a1a1aa' }}>Custom Phoneme / Cluster</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={customIpa}
              onChange={(e) => setCustomIpa(e.target.value)}
              placeholder="IPA (e.g. kʰ)"
              style={{
                flex: 1,
                padding: '6px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4
              }}
            />
            <input
              value={customRom}
              onChange={(e) => setCustomRom(e.target.value)}
              placeholder="Roman (kh)"
              style={{
                flex: 1,
                padding: '6px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value as Phoneme['category'])}
              style={{
                flex: 1,
                padding: '6px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4
              }}
            >
              <option value="consonant">Consonant</option>
              <option value="vowel">Vowel</option>
              <option value="diacritic">Diacritic</option>
            </select>
            <button type="submit" style={{ padding: '6px 12px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Center: Active Inventory & Word Generator */}
      <div
        style={{
          background: '#18181b',
          padding: 14,
          borderRadius: 8,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>
            Active Phoneme Inventory ({inventory.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {inventory.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  background: '#27272a',
                  borderLeft: `3px solid ${p.category === 'vowel' ? '#16a34a' : '#2563eb'}`,
                  borderRadius: 4,
                  fontSize: 14
                }}
              >
                <strong>/{p.ipa}/</strong>
                <span style={{ color: '#a1a1aa', fontSize: 12 }}>⟨{p.romanization}⟩</span>
                <button
                  onClick={() => removePhoneme(p.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: 4
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #27272a', paddingTop: 14 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Phonotactics & Root Generator</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={syllableInput}
              onChange={(e) => setSyllableInput(e.target.value)}
              onBlur={handleSyllableBlur}
              placeholder="CV, CVC, V"
              style={{
                flex: 1,
                padding: '6px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4
              }}
            />
            <button
              onClick={handleGenerateWords}
              style={{
                padding: '6px 12px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Generate Roots
            </button>
          </div>

          {generatedWords.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {generatedWords.map((w, idx) => (
                <div
                  key={`${w.ipa}-${idx}`}
                  style={{
                    padding: '6px 10px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: 4,
                    fontSize: 13
                  }}
                >
                  <span style={{ color: '#60a5fa' }}>/{w.ipa}/</span>{' '}
                  <span style={{ color: '#a1a1aa' }}>({w.romanized})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Sound-Change Pipeline & Live Sandbox */}
      <div
        style={{
          background: '#18181b',
          padding: 14,
          borderRadius: 8,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14 }}>Sound-Change Pipeline</h3>

        <form
          onSubmit={handleAddRule}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: '#09090b',
            padding: 10,
            borderRadius: 6
          }}
        >
          <input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Rule label (optional)"
            style={{
              padding: '5px 8px',
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
              borderRadius: 4,
              fontSize: 12
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <input
              value={ruleTarget}
              onChange={(e) => setRuleTarget(e.target.value)}
              placeholder="Target (k)"
              style={{
                padding: '5px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4,
                fontSize: 12
              }}
            />
            <input
              value={ruleReplacement}
              onChange={(e) => setRuleReplacement(e.target.value)}
              placeholder="Output (t͡ʃ)"
              style={{
                padding: '5px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4,
                fontSize: 12
              }}
            />
            <input
              value={ruleEnv}
              onChange={(e) => setRuleEnv(e.target.value)}
              placeholder="Env (_i, V_V)"
              style={{
                padding: '5px 8px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: 4,
                fontSize: 12
              }}
            />
          </div>
          <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
            + Add Sound Rule
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {soundRules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: '#27272a',
                borderRadius: 4,
                opacity: rule.enabled ? 1 : 0.5,
                fontSize: 13
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleSoundRule(rule.id)}
                />
                <span>
                  <code>{rule.target}</code> → <code>{rule.replacement || '∅'}</code>
                  {rule.environment && (
                    <span style={{ color: '#a1a1aa' }}> / {rule.environment}</span>
                  )}
                </span>
              </label>
              <button
                onClick={() => deleteSoundRule(rule.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #27272a', paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>
            Proto-Words (one per line)
          </div>
          <textarea
            value={sandboxInput}
            onChange={(e) => setSandboxInput(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: 8,
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
              borderRadius: 4,
              boxSizing: 'border-box',
              marginBottom: 8
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sandboxLines.map((line, i) => {
              const trace = evolveWord(line, soundRules, inventory)
              return (
                <div
                  key={`${line}-${i}`}
                  style={{
                    padding: '6px 8px',
                    background: '#09090b',
                    borderRadius: 4,
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ color: '#a1a1aa' }}>*{trace.original}</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>→ /{trace.final}/</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
