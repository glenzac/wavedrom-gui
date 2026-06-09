import { useId, type ReactNode } from 'react'
import { isVectorCell, isClockState, resolveStates, VECTOR_HEX, getDataMap } from '../utils/waveHelpers'

export const CELL_W = 40
export const WAVE_H = 40

// WaveDrom uses 20×20 per cell. Scaled to 40px:
//   y=0  → TOP_Y=7, y=20 → BOT_Y=33, y=10 → MID_Y=20
//   x transition: TS=6 (3/20*40), TE=18 (9/20*40)
const TOP_Y = 7
const BOT_Y = 33
const MID_Y = 20
const TS    = 6    // transition start (source-level flat portion)
const TE    = 18   // transition end (diagonal ends here)

function stateToY(s: string): number {
  return (s === '1' || s === 'h') ? TOP_Y : (s === 'z') ? MID_Y : BOT_Y
}
function isLow(s: string)  { return s === '0' || s === 'l' }
function isHigh(s: string) { return s === '1' || s === 'h' }

interface Props {
  wave: string
  data?: string[]
  isDark: boolean
  onCellClick: (idx: number) => void
  onCellRightClick: (idx: number, clientX: number, clientY: number) => void
}

export default function WaveformRenderer({ wave, data, isDark, onCellClick, onCellRightClick }: Props) {
  const uid      = useId()
  const n        = wave.length
  const resolved = resolveStates(wave)
  const totalW   = n * CELL_W

  const stroke  = isDark ? '#94a3b8' : '#475569'
  const grid    = isDark ? '#1e293b' : '#e8edf2'
  const txtCol  = isDark ? '#f1f5f9' : '#1e293b'
  const xStroke = isDark ? '#f87171' : '#dc2626'

  const hatchId = isDark ? `xhatch-d${uid}` : `xhatch-l${uid}`

  const dataLabel = getDataMap(wave, data)

  const fills:   ReactNode[] = []
  const strokes: ReactNode[] = []
  const labels:  ReactNode[] = []

  for (let i = 0; i < n; i++) {
    const x0  = i * CELL_W
    const x1  = x0 + CELL_W
    const cur  = resolved[i]
    const prev = i > 0 ? resolved[i - 1] : null

    const isBus  = isVectorCell(cur)
    const isClk  = isClockState(cur)
    const prevBus = prev !== null && isVectorCell(prev)
    const prevClk = prev !== null && isClockState(prev)

    // ── Clock ─────────────────────────────────────────────────
    if (isClk) {
      const isPos  = cur === 'p' || cur === 'P'
      const hasArr = cur === 'P' || cur === 'N'
      const startY = isPos ? BOT_Y : TOP_Y
      const peakY  = isPos ? TOP_Y  : BOT_Y
      const xm     = x0 + CELL_W / 2

      strokes.push(
        <path key={`clk-${i}`}
          d={`M${x0},${startY} L${x0},${peakY} L${xm},${peakY} L${xm},${startY} L${x1},${startY}`}
          fill="none" stroke={stroke} strokeWidth={1.5}
          strokeLinejoin="miter" strokeLinecap="square" />
      )

      if (hasArr) {
        // Filled teardrop arrow at the active edge (x=x0), matching WaveDrom Pclk/Nclk shape
        // Pclk: M-3,12 0,3 3,12 C 1,11 -1,11 -3,12 z  (tip near top, base near mid)
        // Scaled: tip at (x0, TOP_Y+2), base-y at MID_Y-2, half-width=6
        const tipY  = isPos ? TOP_Y + 2  : BOT_Y - 2
        const baseY = isPos ? MID_Y - 2  : MID_Y + 2
        const w     = 5
        const cy    = isPos ? baseY + 2  : baseY - 2
        strokes.push(
          <path key={`arr-${i}`}
            d={`M${x0-w},${baseY} L${x0},${tipY} L${x0+w},${baseY} C${x0+2},${cy} ${x0-2},${cy} ${x0-w},${baseY} Z`}
            fill={stroke} stroke="none" />
        )
      }
      continue
    }

    // ── Bus ───────────────────────────────────────────────────
    if (isBus) {
      const hex      = VECTOR_HEX[cur] ?? VECTOR_HEX['=']
      const busStart = !prevBus
      // Determine which level the bus is opening from
      const fromLow  = busStart && prev !== null && isLow(prev)
      const fromHigh = busStart && prev !== null && isHigh(prev)
      // When neither: null/x/z/clock prev → full rect (handled by else branch)

      // Build fill path
      let fillPath: string
      if (fromLow) {
        // Bottom flat at BOT_Y, top rises from BOT_Y at x0 to TOP_Y at x0+TE
        fillPath = `M${x0},${BOT_Y} L${x0+TE},${TOP_Y} L${x1},${TOP_Y} L${x1},${BOT_Y} Z`
      } else if (fromHigh) {
        // Top flat at TOP_Y, bottom falls from TOP_Y at x0 to BOT_Y at x0+TE
        fillPath = `M${x0},${TOP_Y} L${x0+TE},${BOT_Y} L${x1},${BOT_Y} L${x1},${TOP_Y} Z`
      } else {
        fillPath = `M${x0},${TOP_Y} L${x1},${TOP_Y} L${x1},${BOT_Y} L${x0},${BOT_Y} Z`
      }
      fills.push(<path key={`bf-${i}`} d={fillPath} fill={hex} fillOpacity={0.3} stroke="none" />)

      // Top outline
      if (fromLow) {
        // Diagonal: (x0, BOT_Y) → (x0+TE, TOP_Y) → (x1, TOP_Y)
        strokes.push(
          <path key={`bt-${i}`}
            d={`M${x0},${BOT_Y} L${x0+TE},${TOP_Y} L${x1},${TOP_Y}`}
            fill="none" stroke={stroke} strokeWidth={1.5} />,
          // Bottom flat (continuous with 0 signal)
          <line key={`bb-${i}`} x1={x0} y1={BOT_Y} x2={x1} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      } else if (fromHigh) {
        // Diagonal: (x0, TOP_Y) → (x0+TE, BOT_Y) → (x1, BOT_Y)
        strokes.push(
          <path key={`bt-${i}`}
            d={`M${x0},${TOP_Y} L${x0+TE},${BOT_Y} L${x1},${BOT_Y}`}
            fill="none" stroke={stroke} strokeWidth={1.5} />,
          <line key={`bb-${i}`} x1={x0} y1={TOP_Y} x2={x1} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      } else {
        strokes.push(
          <line key={`bt-${i}`} x1={x0} y1={TOP_Y} x2={x1} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`bb-${i}`} x1={x0} y1={BOT_Y} x2={x1} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      }

      // Faint divider for consecutive explicit bus chars within a run
      if (!busStart && wave[i] !== '.') {
        strokes.push(
          <line key={`bsep-${i}`} x1={x0} y1={TOP_Y} x2={x0} y2={BOT_Y}
            stroke={stroke} strokeWidth={1} strokeOpacity={0.3} />
        )
      }

      // Data label inside waveform for explicit cells
      if (dataLabel[i] !== undefined && dataLabel[i] !== '') {
        labels.push(
          <text key={`lbl-${i}`} x={x0 + CELL_W / 2} y={MID_Y + 4}
            textAnchor="middle" fontSize={11} fill={txtCol}
            fontFamily="monospace" fontWeight="600">
            {dataLabel[i]}
          </text>
        )
      }
      continue
    }

    // ── X state ───────────────────────────────────────────────
    if (cur === 'x') {
      const prevY = prev && !prevBus && !prevClk && prev !== 'x'
        ? stateToY(prev)
        : null

      const xOpen = prevY !== null ? TE : 0  // hatch starts after opening diagonal

      // Background
      fills.push(
        <rect key={`xbg-${i}`} x={x0} y={TOP_Y} width={CELL_W} height={BOT_Y - TOP_Y}
          fill={isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)'} />
      )
      // Hatch pattern (clipped to the actual x region after opening)
      fills.push(
        <rect key={`xh-${i}`} x={x0 + xOpen} y={TOP_Y} width={CELL_W - xOpen} height={BOT_Y - TOP_Y}
          fill={`url(#${hatchId})`} />
      )

      if (prevY !== null) {
        // Opening transition: from prevY diverges to TOP_Y and BOT_Y
        strokes.push(
          <line key={`xot-${i}`} x1={x0} y1={prevY} x2={x0+TE} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`xob-${i}`} x1={x0} y1={prevY} x2={x0+TE} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
        // Top and bottom borders from TE onward
        strokes.push(
          <line key={`xt-${i}`} x1={x0+TE} y1={TOP_Y} x2={x1} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`xb-${i}`} x1={x0+TE} y1={BOT_Y} x2={x1} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      } else if (prevBus) {
        // Bus → X: bus had full height, no additional opening needed
        strokes.push(
          <line key={`xt-${i}`} x1={x0} y1={TOP_Y} x2={x1} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`xb-${i}`} x1={x0} y1={BOT_Y} x2={x1} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      } else {
        // No prev or prev=x: just borders
        strokes.push(
          <line key={`xt-${i}`} x1={x0} y1={TOP_Y} x2={x1} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`xb-${i}`} x1={x0} y1={BOT_Y} x2={x1} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
        )
      }
      continue
    }

    // ── Z state ───────────────────────────────────────────────
    if (cur === 'z') {
      strokes.push(
        <line key={`z-${i}`} x1={x0} y1={MID_Y} x2={x1} y2={MID_Y}
          stroke={stroke} strokeWidth={1.5} strokeDasharray="4,3" />
      )
      continue
    }

    // ── 0 / 1 / h / l ────────────────────────────────────────
    const y   = stateToY(cur)
    let txEnd = x0

    if (prev !== null && !prevClk) {
      if (prevBus) {
        // Bus was at full height; converge to y
        // Bottom stays flat if cur=0, top stays flat if cur=1
        if (isLow(cur)) {
          // Top closes: (x0, TOP_Y) → (x0+TE, BOT_Y)  /  Bottom flat
          strokes.push(
            <line key={`tbt-${i}`} x1={x0} y1={TOP_Y} x2={x0+TE} y2={BOT_Y} stroke={stroke} strokeWidth={1.5} />,
          )
          txEnd = x0  // bottom was already at BOT_Y = y, no transition needed for it
          // Draw segment starting from x0 (bottom was continuous from bus's BOT_Y)
          strokes.push(<line key={`seg-${i}`} x1={x0} y1={y} x2={x1} y2={y} stroke={stroke} strokeWidth={1.5} />)
          continue
        } else if (isHigh(cur)) {
          // Bottom closes: (x0, BOT_Y) → (x0+TE, TOP_Y)  /  Top flat
          strokes.push(
            <line key={`tbb-${i}`} x1={x0} y1={BOT_Y} x2={x0+TE} y2={TOP_Y} stroke={stroke} strokeWidth={1.5} />,
          )
          strokes.push(<line key={`seg-${i}`} x1={x0} y1={y} x2={x1} y2={y} stroke={stroke} strokeWidth={1.5} />)
          continue
        } else {
          // z or x after bus: two lines converging to MID_Y
          strokes.push(
            <line key={`tbt-${i}`} x1={x0} y1={TOP_Y} x2={x0+TE} y2={y} stroke={stroke} strokeWidth={1.5} />,
            <line key={`tbb-${i}`} x1={x0} y1={BOT_Y} x2={x0+TE} y2={y} stroke={stroke} strokeWidth={1.5} />,
          )
          txEnd = x0 + TE
        }
      } else if (prev === 'x') {
        // X had both borders at TOP_Y and BOT_Y; converge to y
        strokes.push(
          <line key={`txt-${i}`} x1={x0} y1={TOP_Y} x2={x0+TE} y2={y} stroke={stroke} strokeWidth={1.5} />,
          <line key={`txb-${i}`} x1={x0} y1={BOT_Y} x2={x0+TE} y2={y} stroke={stroke} strokeWidth={1.5} />,
        )
        txEnd = x0 + TE
      } else if (prev === 'z') {
        strokes.push(
          <line key={`tz-${i}`} x1={x0} y1={MID_Y} x2={x0+TS} y2={y} stroke={stroke} strokeWidth={1.5} />
        )
        txEnd = x0 + TS
      } else if (prev !== cur) {
        // 0↔1 diagonal
        const py = stateToY(prev)
        strokes.push(
          <line key={`td-${i}`} x1={x0} y1={py} x2={x0+TS} y2={y} stroke={stroke} strokeWidth={1.5} />
        )
        txEnd = x0 + TS
      }
    }

    // Segment line — extend to x1 even when next is bus; the bus cell's own bottom
    // line (at the same y) continues seamlessly from x1 of this cell.
    strokes.push(
      <line key={`seg-${i}`} x1={txEnd} y1={y} x2={x1} y2={y} stroke={stroke} strokeWidth={1.5} />
    )
  }

  // Grid (vertical dashed lines between cycles)
  const gridLines = Array.from({ length: n - 1 }, (_, i) => (
    <line key={`g-${i}`}
      x1={(i + 1) * CELL_W} y1={0} x2={(i + 1) * CELL_W} y2={WAVE_H}
      stroke={grid} strokeWidth={1} strokeDasharray="2,4" />
  ))

  // Click regions
  const hits = Array.from({ length: n }, (_, i) => (
    <rect key={`h-${i}`}
      x={i * CELL_W} y={0} width={CELL_W} height={WAVE_H}
      fill="transparent" className="cursor-pointer"
      onClick={() => onCellClick(i)}
      onContextMenu={e => { e.preventDefault(); onCellRightClick(i, e.clientX, e.clientY) }}
    />
  ))

  return (
    <svg width={totalW} height={WAVE_H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {/* Diagonal hatch pattern matching WaveDrom's X state — lines every 5 units */}
        <pattern id={`xhatch-d${uid}`} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
          <line x1="0" y1="7" x2="7" y2="0" stroke="#f87171" strokeWidth="0.9" strokeOpacity="0.55" />
        </pattern>
        <pattern id={`xhatch-l${uid}`} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
          <line x1="0" y1="7" x2="7" y2="0" stroke={xStroke} strokeWidth="0.9" strokeOpacity="0.45" />
        </pattern>
      </defs>
      {gridLines}
      {fills}
      {strokes}
      {labels}
      {hits}
    </svg>
  )
}
