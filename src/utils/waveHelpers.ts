import type { CellState } from '../types'

const REGULAR_CYCLE: CellState[] = ['0', '1', 'x', 'z', '=', '.']
export const CLOCK_CYCLE: CellState[] = ['p', 'P', 'n', 'N', 'h', 'l']

export function isClockState(s: string): boolean {
  return s === 'p' || s === 'P' || s === 'n' || s === 'N'
}

export function resolveStates(wave: string): CellState[] {
  const result: CellState[] = []
  let prev: CellState = '0'
  for (const ch of wave) {
    const resolved: CellState = ch === '.' ? prev : ch as CellState
    prev = resolved
    result.push(resolved)
  }
  return result
}

// Wave chars 2-9 are colored variants of the bus/vector state
export const VECTOR_CHARS: CellState[] = ['=', '2', '3', '4', '5', '6', '7', '8', '9']

// Actual fill colors used by wavedrom's default skin for each vector char.
// vvv-2 (=,2) → s7=#fff  vvv-3 → s8=#ffffb4  vvv-4 → s9=#ffe0b9 …
export const VECTOR_HEX: Record<string, string> = {
  '=': '#ffffff',
  '2': '#ffffff',
  '3': '#ffffb4',
  '4': '#ffe0b9',
  '5': '#b9e0ff',
  '6': '#ccfdfe',
  '7': '#cdfdc5',
  '8': '#f0c1fb',
  '9': '#f5c2c0',
}

export function isVectorCell(state: CellState): boolean {
  return state === '=' || (state >= '2' && state <= '9')
}

export function isClockSignal(wave: string): boolean {
  const first = wave.replace(/\./g, '')[0]
  return ['p', 'P', 'n', 'N', 'h', 'l'].includes(first)
}

export function cycleCellState(current: CellState, isClock: boolean): CellState {
  if (isClock) {
    const idx = CLOCK_CYCLE.indexOf(current)
    return CLOCK_CYCLE[(idx === -1 ? 0 : idx + 1) % CLOCK_CYCLE.length]
  }
  // If on a colored vector char (2-9), treat as '=' for cycle purposes
  const effective: CellState = isVectorCell(current) ? '=' : current
  const idx = REGULAR_CYCLE.indexOf(effective)
  return REGULAR_CYCLE[(idx === -1 ? 0 : idx + 1) % REGULAR_CYCLE.length]
}

export function cycleVectorColor(current: CellState): CellState {
  const idx = VECTOR_CHARS.indexOf(current)
  return VECTOR_CHARS[(idx === -1 ? 0 : idx + 1) % VECTOR_CHARS.length]
}

export function waveStringToArray(wave: string): CellState[] {
  return wave.split('') as CellState[]
}

export function arrayToWaveString(cells: CellState[]): string {
  return cells.join('')
}

/** Maps wave-string index of a vector cell → data label */
export function getDataMap(wave: string, data: string[] = []): Record<number, string> {
  const map: Record<number, string> = {}
  let dataIdx = 0
  for (let i = 0; i < wave.length; i++) {
    if (isVectorCell(wave[i] as CellState)) {
      map[i] = data[dataIdx] ?? ''
      dataIdx++
    }
  }
  return map
}

/** Reconstructs data array from updated cells + existing data map */
export function rebuildData(cells: CellState[], dataMap: Record<number, string>): string[] {
  return cells
    .map((c, i) => (isVectorCell(c) ? (dataMap[i] ?? '') : null))
    .filter((v): v is string => v !== null)
}

export interface CellStyle {
  bg: string         // Tailwind bg class (dark mode)
  bgLight: string    // Tailwind bg class (light mode)
  text: string
  label: string
}

export const CELL_STYLES: Record<string, CellStyle> = {
  '0': { bg: 'bg-slate-600',  bgLight: 'bg-slate-400',  text: 'text-white', label: '0' },
  '1': { bg: 'bg-emerald-600',bgLight: 'bg-emerald-500', text: 'text-white', label: '1' },
  'x': { bg: 'bg-red-500',   bgLight: 'bg-red-400',    text: 'text-white', label: 'X' },
  'z': { bg: 'bg-blue-500',  bgLight: 'bg-blue-400',   text: 'text-white', label: 'Z' },
  '=': { bg: 'bg-amber-600', bgLight: 'bg-amber-500',  text: 'text-white', label: '=' },
  '3': { bg: 'bg-orange-500',bgLight: 'bg-orange-400', text: 'text-white', label: '=' },
  '4': { bg: 'bg-blue-400',  bgLight: 'bg-blue-300',   text: 'text-white', label: '=' },
  '5': { bg: 'bg-cyan-500',  bgLight: 'bg-cyan-400',   text: 'text-white', label: '=' },
  '6': { bg: 'bg-green-500', bgLight: 'bg-green-400',  text: 'text-white', label: '=' },
  '7': { bg: 'bg-purple-500',bgLight: 'bg-purple-400', text: 'text-white', label: '=' },
  '8': { bg: 'bg-pink-400',  bgLight: 'bg-pink-300',   text: 'text-white', label: '=' },
  '9': { bg: 'bg-gray-200',  bgLight: 'bg-gray-100',   text: 'text-gray-800', label: '=' },
  '2': { bg: 'bg-amber-600', bgLight: 'bg-amber-500',  text: 'text-white', label: '=' },
  '.': { bg: 'bg-slate-500', bgLight: 'bg-slate-300',  text: 'text-white', label: '···' },
  'p': { bg: 'bg-violet-600',bgLight: 'bg-violet-500', text: 'text-white', label: 'p' },
  'P': { bg: 'bg-violet-600',bgLight: 'bg-violet-500', text: 'text-white', label: 'P' },
  'n': { bg: 'bg-violet-600',bgLight: 'bg-violet-500', text: 'text-white', label: 'n' },
  'N': { bg: 'bg-violet-600',bgLight: 'bg-violet-500', text: 'text-white', label: 'N' },
  'h': { bg: 'bg-teal-500',  bgLight: 'bg-teal-400',   text: 'text-white', label: 'H' },
  'l': { bg: 'bg-teal-700',  bgLight: 'bg-teal-600',   text: 'text-white', label: 'L' },
  'u': { bg: 'bg-orange-400',bgLight: 'bg-orange-300', text: 'text-white', label: '↑' },
  'd': { bg: 'bg-orange-600',bgLight: 'bg-orange-500', text: 'text-white', label: '↓' },
  '|': { bg: 'bg-gray-400',  bgLight: 'bg-gray-300',   text: 'text-gray-700', label: '|' },
}
