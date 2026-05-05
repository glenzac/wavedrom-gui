import { CELL_W } from './WaveformRenderer'
import { isVectorCell, cycleVectorColor, VECTOR_HEX } from '../utils/waveHelpers'
import type { CellState } from '../types'

const BUBBLE_H = 20

// Character to display for non-bus cells
const BUBBLE_LABEL: Record<string, string> = {
  '0': '0', '1': '1', 'x': 'X', 'z': 'Z', '.': '·',
  'p': 'p', 'P': 'P', 'n': 'n', 'N': 'N',
  'h': 'H', 'l': 'L', 'u': '↑', 'd': '↓',
}

interface Props {
  wave: string
  isDark: boolean
  onColorCycle: (idx: number) => void   // for bus cells: cycle the color
  onCellRightClick: (idx: number, clientX: number, clientY: number) => void
}

export default function BubbleRow({ wave, isDark, onColorCycle, onCellRightClick }: Props) {
  const n = wave.length

  return (
    <div className="flex" style={{ height: BUBBLE_H }}>
      {Array.from({ length: n }, (_, i) => {
        const ch = wave[i] as CellState
        // Resolve '.' for bus check: look back for most recent bus char
        const resolvedIsBus = (() => {
          let j = i
          while (j >= 0) {
            if (wave[j] !== '.') return isVectorCell(wave[j] as CellState)
            j--
          }
          return false
        })()

        const x = i * CELL_W

        if (resolvedIsBus) {
          // Find the resolved bus char for this position (walk back through dots)
          let resolvedChar: CellState = ch
          if (ch === '.') {
            let j = i - 1
            while (j >= 0 && wave[j] === '.') j--
            if (j >= 0) resolvedChar = wave[j] as CellState
          }
          const color = VECTOR_HEX[resolvedChar] ?? VECTOR_HEX['=']
          return (
            <div
              key={i}
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: CELL_W }}
            >
              <button
                onClick={() => onColorCycle(i)}
                onContextMenu={(e) => { e.preventDefault(); onCellRightClick(i, e.clientX, e.clientY) }}
                title="Click to cycle bus color"
                className="w-4 h-4 rounded-full border-2 hover:scale-125 transition-transform"
                style={{
                  backgroundColor: color,
                  borderColor: isDark ? '#475569' : '#94a3b8',
                }}
              />
            </div>
          )
        }

        // Non-bus: character pill
        const label = BUBBLE_LABEL[ch] ?? ch
        const isExplicit = ch !== '.'
        const pillBg = isExplicit
          ? (isDark ? 'bg-slate-600' : 'bg-gray-200')
          : (isDark ? 'bg-slate-700/50' : 'bg-gray-100')
        const pillTxt = isExplicit
          ? (isDark ? 'text-slate-100' : 'text-gray-800')
          : (isDark ? 'text-slate-500' : 'text-gray-400')

        return (
          <div
            key={i}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: CELL_W }}
            onContextMenu={(e) => { e.preventDefault(); onCellRightClick(i, e.clientX, e.clientY) }}
          >
            <span
              className={`px-1 rounded text-[10px] font-mono font-semibold select-none ${pillBg} ${pillTxt}`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
