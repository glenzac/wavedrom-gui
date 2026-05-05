import { useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import SignalRow, { LEFT_COL_W } from './SignalRow'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'
import { CELL_W } from './WaveformRenderer'
import {
  resolveStates, isVectorCell, getDataMap, rebuildData,
} from '../utils/waveHelpers'
import type { WaveJSON, Signal, CellState } from '../types'

interface Props {
  waveJson: WaveJSON
  cycleCount: number
  isDark: boolean
  onCycleCountChange: (n: number) => void
  onChange: (updated: WaveJSON) => void
}

interface CtxState {
  signalIdx: number
  cellIdx: number | null
  x: number
  y: number
}

// ── Timescale bar ──────────────────────────────────────────────
function TimescaleBar({ cycleCount, isDark }: { cycleCount: number; isDark: boolean }) {
  const colBg  = isDark ? 'bg-slate-900' : 'bg-gray-50'
  const border = isDark ? 'border-slate-700' : 'border-gray-200'
  const num    = isDark ? 'text-slate-500' : 'text-gray-400'
  const lbl    = isDark ? 'text-slate-600' : 'text-gray-400'

  return (
    <div className={`flex border-b ${border} min-w-min sticky top-0 z-10`}>
      {/* Spacer matching left column */}
      <div
        className={`flex-shrink-0 flex items-center px-3 border-r ${border} ${colBg}`}
        style={{ width: LEFT_COL_W, position: 'sticky', left: 0, zIndex: 11 }}
      >
        <span className={`text-[10px] font-mono ${lbl}`}>t →</span>
      </div>
      {/* Cycle number cells */}
      <div className="flex">
        {Array.from({ length: cycleCount }, (_, i) => (
          <div
            key={i}
            className={`flex-shrink-0 text-center text-[10px] font-mono py-0.5 ${colBg} ${num}`}
            style={{ width: CELL_W }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Insert / delete helpers ────────────────────────────────────
function insertCycleAt(signal: Signal, idx: number): Signal {
  const resolved = resolveStates(signal.wave)
  const chars    = signal.wave.split('')
  const dataMap  = getDataMap(signal.wave, signal.data)

  // Copy the resolved value at idx
  const insertChar: CellState = resolved[idx]
  chars.splice(idx, 0, insertChar)

  // For bus inserts: also insert the data label
  const newCells = chars as CellState[]
  const newDataMap: Record<number, string> = {}
  // Re-map data labels: positions after idx shift by 1
  for (const [pos, val] of Object.entries(dataMap)) {
    const p = Number(pos)
    if (p >= idx) newDataMap[p + 1] = val
    else          newDataMap[p]     = val
  }
  // Add label for new cell if it's a bus type
  if (isVectorCell(insertChar)) {
    newDataMap[idx] = dataMap[idx] ?? dataMap[idx - 1] ?? ''
  }

  const newData = rebuildData(newCells, newDataMap)
  return { ...signal, wave: chars.join(''), data: newData.length ? newData : undefined }
}

function deleteCycleAt(signal: Signal, idx: number): Signal {
  const chars   = signal.wave.split('')
  const dataMap = getDataMap(signal.wave, signal.data)

  chars.splice(idx, 1)
  const newCells = chars as CellState[]

  // Re-map data labels: positions after idx shift by -1
  const newDataMap: Record<number, string> = {}
  for (const [pos, val] of Object.entries(dataMap)) {
    const p = Number(pos)
    if (p === idx) continue             // deleted cell
    if (p > idx)   newDataMap[p - 1] = val
    else           newDataMap[p]     = val
  }

  const newData = rebuildData(newCells, newDataMap)
  return { ...signal, wave: chars.join(''), data: newData.length ? newData : undefined }
}

function setCellValue(signal: Signal, idx: number, value: CellState): Signal {
  const cells   = signal.wave.split('') as CellState[]
  const dataMap = getDataMap(signal.wave, signal.data)
  cells[idx]    = value
  const newData = rebuildData(cells, dataMap)
  return { ...signal, wave: cells.join(''), data: newData.length ? newData : undefined }
}

function fillAll(signal: Signal, value: CellState): Signal {
  const wave = signal.wave.split('').map(() => value).join('')
  return { ...signal, wave, data: undefined }
}

// ── Main component ─────────────────────────────────────────────
export default function SignalEditor({
  waveJson, cycleCount, isDark, onCycleCountChange, onChange,
}: Props) {
  const [ctx, setCtx] = useState<CtxState | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = waveJson.signal.map((_, i) => `signal-${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const a = ids.indexOf(active.id as string)
    const b = ids.indexOf(over.id as string)
    onChange({ ...waveJson, signal: arrayMove(waveJson.signal, a, b) })
  }

  function updateSignal(idx: number, updated: Signal) {
    const s = [...waveJson.signal]
    s[idx] = updated
    onChange({ ...waveJson, signal: s })
  }

  function deleteSignal(idx: number) {
    onChange({ ...waveJson, signal: waveJson.signal.filter((_, i) => i !== idx) })
  }

  function addSignal() {
    const wave = cycleCount > 1 ? '0' + '.'.repeat(cycleCount - 1) : '0'
    const s: Signal = { name: `sig${waveJson.signal.length}`, wave }
    onChange({ ...waveJson, signal: [...waveJson.signal, s] })
  }

  function addClock() {
    const wave = cycleCount > 1 ? 'p' + '.'.repeat(cycleCount - 1) : 'p'
    const s: Signal = { name: 'clk', wave }
    onChange({ ...waveJson, signal: [...waveJson.signal, s] })
  }

  // ── Context menu opener ────────────────────────────────────
  const openContextMenu = useCallback((
    signalId: string, cellIdx: number | null, x: number, y: number,
  ) => {
    const signalIdx = ids.indexOf(signalId)
    if (signalIdx === -1) return
    setCtx({ signalIdx, cellIdx, x, y })
  }, [ids])

  // ── Build context menu items ───────────────────────────────
  function buildMenuItems(): ContextMenuItem[] {
    if (!ctx) return []
    const sig = waveJson.signal[ctx.signalIdx]
    const { cellIdx } = ctx

    if (cellIdx === null) {
      // Right-clicked on signal name
      return [
        { label: `Signal: "${sig.name}"`, disabled: true },
        { separator: true },
        {
          label: 'Duplicate signal',
          onClick: () => {
            const copy = { ...sig, name: sig.name + '_copy' }
            const s = [...waveJson.signal]
            s.splice(ctx.signalIdx + 1, 0, copy)
            onChange({ ...waveJson, signal: s })
          },
        },
        {
          label: 'Move up',
          disabled: ctx.signalIdx === 0,
          onClick: () => onChange({ ...waveJson, signal: arrayMove(waveJson.signal, ctx.signalIdx, ctx.signalIdx - 1) }),
        },
        {
          label: 'Move down',
          disabled: ctx.signalIdx === waveJson.signal.length - 1,
          onClick: () => onChange({ ...waveJson, signal: arrayMove(waveJson.signal, ctx.signalIdx, ctx.signalIdx + 1) }),
        },
        { separator: true },
        { label: 'Delete signal', danger: true, onClick: () => deleteSignal(ctx.signalIdx) },
      ]
    }

    // Right-clicked on a cell
    const resolved = resolveStates(sig.wave)[cellIdx]
    const setTo = (v: CellState) => updateSignal(ctx.signalIdx, setCellValue(sig, cellIdx, v))

    const setValues: ContextMenuItem[] = [
      { label: 'Set value', disabled: true },
      { label: '  0 — low',        onClick: () => setTo('0') },
      { label: '  1 — high',       onClick: () => setTo('1') },
      { label: '  x — undefined',  onClick: () => setTo('x') },
      { label: '  z — high-Z',     onClick: () => setTo('z') },
      { label: '  = — bus/vector', onClick: () => setTo('=') },
      { label: '  · — continue',   onClick: () => setTo('.'), disabled: cellIdx === 0 },
    ]

    return [
      ...setValues,
      { separator: true },
      { label: `Fill all → ${resolved}`, onClick: () => updateSignal(ctx.signalIdx, fillAll(sig, resolved)) },
      { label: 'Fill all → 0',           onClick: () => updateSignal(ctx.signalIdx, fillAll(sig, '0')) },
      { label: 'Fill all → ·',           onClick: () => {
        const base = sig.wave[0] as CellState
        const wave = base + '.'.repeat(sig.wave.length - 1)
        updateSignal(ctx.signalIdx, { ...sig, wave })
      }},
      { separator: true },
      {
        label: 'Insert cycle before',
        onClick: () => {
          onCycleCountChange(cycleCount + 1)
          updateSignal(ctx.signalIdx, insertCycleAt(sig, cellIdx))
        },
      },
      {
        label: 'Insert cycle after',
        onClick: () => {
          onCycleCountChange(cycleCount + 1)
          updateSignal(ctx.signalIdx, insertCycleAt(sig, cellIdx + 1))
        },
      },
      {
        label: 'Delete this cycle',
        danger: true,
        disabled: sig.wave.length <= 1,
        onClick: () => {
          onCycleCountChange(Math.max(1, cycleCount - 1))
          updateSignal(ctx.signalIdx, deleteCycleAt(sig, cellIdx))
        },
      },
    ]
  }

  const panel  = isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-900'
  const header = isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
  const lbl    = isDark ? 'text-slate-400' : 'text-gray-500'
  const btn    = isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  const cnt    = isDark ? 'text-slate-200' : 'text-gray-800'
  const addBtn = isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
  const clkBtn = isDark ? 'bg-violet-700 hover:bg-violet-600' : 'bg-violet-500 hover:bg-violet-600'

  return (
    <div className={`flex flex-col h-full ${panel}`}>
      {/* Panel header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${header} flex-shrink-0`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${lbl} flex-shrink-0`}>Signals</span>
        <button onClick={addSignal} className={`px-2 py-0.5 rounded text-white text-xs font-medium transition-colors flex-shrink-0 ${addBtn}`}>+ Signal</button>
        <button onClick={addClock} className={`px-2 py-0.5 rounded text-white text-xs font-medium transition-colors flex-shrink-0 ${clkBtn}`}>+ Clock</button>
        <div className="flex-1" />
        <span className={`text-xs ${lbl} flex-shrink-0`}>Cycles:</span>
        <button onClick={() => onCycleCountChange(Math.max(1, cycleCount - 1))} className={`w-5 h-5 rounded text-xs flex items-center justify-center ${btn}`}>−</button>
        <span className={`text-sm w-5 text-center ${cnt}`}>{cycleCount}</span>
        <button onClick={() => onCycleCountChange(Math.min(64, cycleCount + 1))} className={`w-5 h-5 rounded text-xs flex items-center justify-center ${btn}`}>+</button>
      </div>

      {/* Scrollable signal list (single scroll container for timescale + rows) */}
      <div className="flex-1 overflow-auto">
        <TimescaleBar cycleCount={cycleCount} isDark={isDark} />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {waveJson.signal.map((sig, i) => (
              <SignalRow
                key={ids[i]}
                id={ids[i]}
                signal={sig}
                isDark={isDark}
                onChange={(u) => updateSignal(i, u)}
                onDelete={() => deleteSignal(i)}
                onContextMenu={openContextMenu}
              />
            ))}
          </SortableContext>
        </DndContext>

        {waveJson.signal.length === 0 && (
          <div className={`text-center text-sm py-10 ${lbl}`}>No signals. Add one above.</div>
        )}
      </div>

      {/* Context menu */}
      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          items={buildMenuItems()}
          isDark={isDark}
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  )
}
