import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import WaveformRenderer, { CELL_W } from './WaveformRenderer'
import BubbleRow from './BubbleRow'
import {
  waveStringToArray, arrayToWaveString,
  getDataMap, rebuildData,
  isClockSignal, isVectorCell, isClockState, resolveStates,
  cycleCellState, cycleVectorColor, CLOCK_CYCLE,
} from '../utils/waveHelpers'
import type { Signal, CellState } from '../types'

export const LEFT_COL_W = 150   // px — must match TimescaleBar spacer

interface Props {
  id: string
  signal: Signal
  isDark: boolean
  onChange: (updated: Signal) => void
  onDelete: () => void
  onContextMenu: (signalId: string, cellIdx: number | null, clientX: number, clientY: number) => void
}

export default function SignalRow({ id, signal, isDark, onChange, onDelete, onContextMenu }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const cells  = waveStringToArray(signal.wave)
  const isClock = isClockSignal(signal.wave)
  const dataMap = getDataMap(signal.wave, signal.data)

  // ── Cell click: cycle through valid states ─────────────────
  function handleCellClick(idx: number) {
    const newCells = [...cells]
    newCells[idx] = cycleCellState(cells[idx], isClock)
    const newWave = arrayToWaveString(newCells)
    const newData = rebuildData(newCells, dataMap)
    onChange({ ...signal, wave: newWave, data: newData.length ? newData : undefined })
  }

  // ── Bus color swatch click ─────────────────────────────────
  function handleColorCycle(idx: number) {
    const resolved = resolveStates(signal.wave)
    const resolvedChar = resolved[idx]
    if (!isVectorCell(resolvedChar)) return
    const newCells = [...cells]
    // For '.' cells: convert to explicit with next color
    const currentChar = cells[idx] === '.' ? resolvedChar : cells[idx]
    newCells[idx] = cycleVectorColor(currentChar)
    const newWave = arrayToWaveString(newCells)
    const newData = rebuildData(newCells, dataMap)
    onChange({ ...signal, wave: newWave, data: newData.length ? newData : undefined })
  }

  // ── Data label edit ───────────────────────────────────────
  function handleDataChange(cellIdx: number, value: string) {
    const newDataMap = { ...dataMap, [cellIdx]: value }
    const newData = rebuildData(cells, newDataMap)
    onChange({ ...signal, data: newData.length ? newData : undefined })
  }

  // ── Clock type picker ──────────────────────────────────────
  function handleClockType(type: CellState) {
    const newWave = signal.wave.split('').map((ch) =>
      isClockState(ch) ? type : ch
    ).join('')
    onChange({ ...signal, wave: newWave })
  }

  const colBg   = isDark ? 'bg-slate-800' : 'bg-white'
  const border  = isDark ? 'border-slate-700' : 'border-gray-200'
  const nameCls = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400'
    : 'bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500'
  const dragCls = isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
  const delCls  = isDark ? 'text-slate-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'

  // Determine current clock type for the picker
  const currentClockType = isClock
    ? (cells.find(isClockState) ?? 'p')
    : null

  return (
    <div ref={setNodeRef} style={style} className={`flex border-b ${border} min-w-min`}>

      {/* ── Left column (sticky, fixed width) ──────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col justify-center gap-1 px-2 py-1.5 ${colBg} border-r ${border}`}
        style={{ width: LEFT_COL_W, position: 'sticky', left: 0, zIndex: 1 }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(id, null, e.clientX, e.clientY) }}
      >
        <div className="flex items-center gap-1.5">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className={`flex-shrink-0 cursor-grab active:cursor-grabbing ${dragCls}`}
          >
            ⠿
          </button>

          {/* Name */}
          <input
            value={signal.name}
            onChange={(e) => onChange({ ...signal, name: e.target.value })}
            className={`flex-1 min-w-0 text-sm rounded px-2 py-0.5 border focus:outline-none ${nameCls}`}
            placeholder="name"
          />

          {/* Delete */}
          <button onClick={onDelete} className={`flex-shrink-0 text-lg leading-none ${delCls}`} title="Delete">
            ×
          </button>
        </div>

        {/* Clock type picker */}
        {isClock && (
          <div className="flex gap-0.5 pl-5">
            {CLOCK_CYCLE.map((t) => (
              <button
                key={t}
                onClick={() => handleClockType(t)}
                title={`Set clock type to ${t}`}
                className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${
                  currentClockType === t
                    ? 'bg-violet-600 text-white'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right column: waveform + bubbles + data labels ─── */}
      <div className="flex flex-col flex-shrink-0">
        <WaveformRenderer
          wave={signal.wave}
          data={signal.data}
          isDark={isDark}
          onCellClick={handleCellClick}
          onCellRightClick={(idx, cx, cy) => onContextMenu(id, idx, cx, cy)}
        />
        <BubbleRow
          wave={signal.wave}
          isDark={isDark}
          onColorCycle={handleColorCycle}
          onCellRightClick={(idx, cx, cy) => onContextMenu(id, idx, cx, cy)}
        />
        {/* Data label edit row — only when signal has vector cells */}
        {cells.some(c => isVectorCell(c as CellState) && c !== '.') && (
          <div className={`flex border-t ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}
               style={{ height: 20 }}>
            {cells.map((c, idx) => {
              const isExplicitBus = isVectorCell(c as CellState) && c !== '.'
              return (
                <div key={idx} className="flex-shrink-0" style={{ width: CELL_W }}>
                  {isExplicitBus && (
                    <input
                      value={dataMap[idx] ?? ''}
                      onChange={e => handleDataChange(idx, e.target.value)}
                      style={{ width: CELL_W - 2 }}
                      className={`h-5 text-[10px] text-center font-mono border-0 border-b focus:outline-none px-0.5
                        ${isDark
                          ? 'bg-transparent text-amber-300 border-amber-800 focus:border-amber-500'
                          : 'bg-transparent text-amber-700 border-amber-300 focus:border-amber-500'}`}
                      placeholder="·"
                      title={`Data label at cycle ${idx}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
