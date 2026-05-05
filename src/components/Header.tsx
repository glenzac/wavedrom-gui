import { useState } from 'react'
import type { WaveJSON } from '../types'

const SKINS = ['default', 'narrow', 'light']

interface Props {
  waveJson: WaveJSON
  svgContent: string
  codeString: string
  isDark: boolean
  onToggleTheme: () => void
  onChange: (updated: WaveJSON) => void
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Header({ waveJson, svgContent, codeString, isDark, onToggleTheme, onChange }: Props) {
  const [copied, setCopied] = useState(false)

  const hscale = waveJson.config?.hscale ?? 1
  const skin = waveJson.config?.skin ?? 'default'

  function setHscale(value: number) {
    onChange({ ...waveJson, config: { ...waveJson.config, hscale: value } })
  }
  function setSkin(value: string) {
    onChange({ ...waveJson, config: { ...waveJson.config, skin: value } })
  }

  function exportSvg() {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wavedrom.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const bar = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-200'
    : 'bg-white border-gray-200 text-gray-800'
  const divider = isDark ? 'bg-slate-700' : 'bg-gray-300'
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500'
  const inputCls = isDark
    ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-400'
    : 'bg-gray-100 text-gray-900 border-gray-300 focus:border-blue-500'
  const secondaryBtn = isDark
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  const themeBtn = isDark
    ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300'
    : 'bg-gray-100 hover:bg-gray-200 text-indigo-600'

  return (
    <header className={`flex items-center gap-3 px-4 h-12 border-b flex-shrink-0 ${bar}`}>
      <span className="font-bold text-sm tracking-tight flex-shrink-0">
        WaveDrom <span className="text-blue-400">GUI</span>
      </span>

      <div className={`w-px h-6 flex-shrink-0 ${divider}`} />

      {/* hscale */}
      <label className={`flex items-center gap-1.5 text-xs flex-shrink-0 ${labelColor}`}>
        hscale
        <input
          type="number"
          min={1}
          max={10}
          value={hscale}
          onChange={(e) => setHscale(Math.max(1, Math.min(10, Number(e.target.value))))}
          className={`w-12 text-xs rounded px-1.5 py-0.5 border focus:outline-none text-center ${inputCls}`}
        />
      </label>

      {/* skin */}
      <label className={`flex items-center gap-1.5 text-xs flex-shrink-0 ${labelColor}`}>
        skin
        <select
          value={skin}
          onChange={(e) => setSkin(e.target.value)}
          className={`text-xs rounded px-1.5 py-0.5 border focus:outline-none ${inputCls}`}
        >
          {SKINS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`p-1.5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${themeBtn}`}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className={`w-px h-6 flex-shrink-0 ${divider}`} />

      <button
        onClick={copyCode}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${secondaryBtn}`}
      >
        {copied ? '✓ Copied!' : 'Copy Code'}
      </button>
      <button
        onClick={exportSvg}
        disabled={!svgContent}
        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors flex-shrink-0"
      >
        Export SVG
      </button>
    </header>
  )
}
