import { useState, useRef, useCallback, useEffect } from 'react'
import type { WaveJSON } from './types'
import type { CellState } from './types'
import { serialize } from './utils/serialize'
import { parse } from './utils/parse'
import { getDataMap, rebuildData } from './utils/waveHelpers'
import Header from './components/Header'
import SignalEditor from './components/SignalEditor'
import CodeEditor from './components/CodeEditor'
import Preview from './components/Preview'
import ResizablePanels from './components/ResizablePanels'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WavedromModule = { renderAny: any; waveSkin: any; onml: { stringify: (t: unknown) => string } }
let wavedromCache: WavedromModule | null = null

async function getWavedrom(): Promise<WavedromModule | null> {
  if (wavedromCache) return wavedromCache
  const mod = await import('wavedrom')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mod as any
  const resolved: WavedromModule = {
    renderAny: m.renderAny ?? m.default?.renderAny,
    waveSkin: m.waveSkin ?? m.default?.waveSkin,
    onml: m.onml ?? m.default?.onml,
  }
  if (!resolved.renderAny || !resolved.onml?.stringify) return null
  wavedromCache = resolved
  return resolved
}

function renderToSvg(wv: WavedromModule, waveJson: WaveJSON): string {
  const onmlTree = wv.renderAny(0, waveJson, wv.waveSkin, false)
  return wv.onml.stringify(onmlTree)
}

const DEFAULT_STATE: WaveJSON = {
  signal: [
    { name: 'clk', wave: 'p.......' },
    { name: 'data', wave: 'x.==.=x.', data: ['A', 'B', 'C'] },
    { name: 'ready', wave: '0...1...' },
  ],
  config: { hscale: 1 },
}

export default function App() {
  const [waveJson, setWaveJson] = useState<WaveJSON>(DEFAULT_STATE)
  const [codeString, setCodeString] = useState(() => serialize(DEFAULT_STATE))
  const [codeError, setCodeError] = useState<string | null>(null)
  const [cycleCount, setCycleCount] = useState(8)
  const [svgContent, setSvgContent] = useState('')
  const [isDark, setIsDark] = useState(true)

  const pendingGuiCode = useRef<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Apply dark class to <html> for Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Render SVG whenever waveJson changes
  useEffect(() => {
    let cancelled = false
    getWavedrom().then((wv) => {
      if (cancelled || !wv) return
      try { setSvgContent(renderToSvg(wv, waveJson)) } catch { /* keep prev */ }
    })
    return () => { cancelled = true }
  }, [waveJson])

  const handleGuiChange = useCallback((updated: WaveJSON) => {
    setWaveJson(updated)
    setCodeError(null)
    const serialized = serialize(updated)
    pendingGuiCode.current = serialized
    setCodeString(serialized)
  }, [])

  const handleCodeChange = useCallback((value: string) => {
    setCodeString(value)
    if (pendingGuiCode.current !== null && value === pendingGuiCode.current) {
      pendingGuiCode.current = null
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const { result, error } = parse(value)
      if (result) {
        setWaveJson(result)
        setCodeError(null)
        setCycleCount(Math.max(...result.signal.map((s) => s.wave.length), 1))
      } else {
        setCodeError(error ?? 'Invalid JSON')
      }
    }, 300)
  }, [])

  const handleCycleCountOnly = useCallback((n: number) => setCycleCount(n), [])

  function handleCycleCountChange(n: number) {
    setCycleCount(n)
    const newSignals = waveJson.signal.map((sig) => {
      const w = sig.wave
      if (w.length === n) return sig
      if (w.length < n) return { ...sig, wave: w + '.'.repeat(n - w.length) }
      const truncWave = w.slice(0, n)
      const dm = getDataMap(w, sig.data)
      const newData = rebuildData(truncWave.split('') as CellState[], dm)
      return { ...sig, wave: truncWave, data: newData.length ? newData : undefined }
    })
    handleGuiChange({ ...waveJson, signal: newSignals })
  }

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <Header
        waveJson={waveJson}
        svgContent={svgContent}
        codeString={codeString}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onChange={handleGuiChange}
      />
      <ResizablePanels
        isDark={isDark}
        left={
          <SignalEditor
            waveJson={waveJson}
            cycleCount={cycleCount}
            isDark={isDark}
            onCycleCountChange={handleCycleCountChange}
            onSetCycleCount={handleCycleCountOnly}
            onChange={handleGuiChange}
          />
        }
        center={
          <CodeEditor
            value={codeString}
            error={codeError}
            isDark={isDark}
            onChange={handleCodeChange}
          />
        }
        right={<Preview svgContent={svgContent} isDark={isDark} />}
      />
    </div>
  )
}
