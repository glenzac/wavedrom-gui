# WaveDrom GUI

An interactive, browser-based GUI editor for [WaveDrom](https://wavedrom.com) timing diagrams. Build digital waveforms visually — click to toggle signal states, drag to reorder, right-click for more options — while watching the WaveJSON code and SVG preview update in real time.

---

## Screenshots

> _Run `npm run dev` and capture a screenshot of your diagrams here._

| Signal Editor | Live Preview |
|---|---|
| _(screenshot)_ | _(screenshot)_ |

---

## Features

### Visual waveform editor
- **Click any cell** to cycle through signal states: `0 → 1 → x → z → = → ·`
- **Actual waveform rendering** — each signal row draws real transitions (diagonal edges, bus trapezoids, clock square waves, X crosshatching)
- **Bus/vector signals** — fill colors, inline data labels, separate color-cycle swatches
- **Clock signals** — `p / P / n / N` type picker with filled arrow markers on `P`/`N` cells
- **Drag to reorder** signals vertically
- **Timescale bar** — cycle index ruler stays aligned with all waveform cells

### Bidirectional sync
- **GUI → code**: every visual edit immediately serializes to WaveJSON in the center panel (Monaco editor)
- **Code → GUI**: edit the JSON directly; the waveform updates after a 300 ms debounce
- Parse errors shown inline; the GUI stays frozen on invalid JSON

### Context menu (right-click)
- On a **cell**: set any value, fill-all shortcuts, insert/delete cycle (with shift)
- On a **signal name**: duplicate, move up/down, delete

### Export
- **Export SVG** — downloads the rendered diagram as a `.svg` file
- **Copy Code** — copies the WaveJSON to clipboard

### Theming
- **Dark / light mode** toggle in the header
- Monaco editor switches between `vs-dark` and `vs` themes

### Resizable panels
- Drag the dividers between the three panels to redistribute space

---

## Tech stack

| Package | Purpose |
|---|---|
| [Vite](https://vitejs.dev) + React 18 + TypeScript | Build toolchain |
| [wavedrom](https://www.npmjs.com/package/wavedrom) | SVG rendering engine |
| [@monaco-editor/react](https://www.npmjs.com/package/@monaco-editor/react) | Code editor panel |
| [@dnd-kit](https://dndkit.com) | Drag-and-drop signal reordering |
| [Tailwind CSS](https://tailwindcss.com) | Styling |

---

## Prerequisites

- **Node.js 18+** — install via [nodejs.org](https://nodejs.org) or with Homebrew:
  ```bash
  brew install node
  ```
- **npm** — bundled with Node.js

---

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/glenzac/wavedrom-gui.git
cd wavedrom-gui

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |

---

## WaveDrom signal reference

The editor supports the full WaveJSON signal alphabet:

| Character | Meaning |
|---|---|
| `0` | Logic low |
| `1` | Logic high |
| `x` | Undefined / don't-care |
| `z` | High impedance (tri-state) |
| `=` | Bus / vector (default color) |
| `2`–`9` | Bus with color variant |
| `.` | Continue previous state |
| `p` / `P` | Positive-edge clock (P = with arrow) |
| `n` / `N` | Negative-edge clock (N = with arrow) |
| `h` / `l` | Held high / held low |

### Config options (editable in the header bar)

| Option | Values | Effect |
|---|---|---|
| `hscale` | 1–10 | Horizontal scale multiplier |
| `skin` | `default`, `narrow`, `light` | Visual theme for the rendered SVG |

---

## Project structure

```
wavedrom-gui/
├── src/
│   ├── App.tsx                  # Root: state, sync logic, layout
│   ├── types.ts                 # WaveJSON, Signal, CellState types
│   ├── components/
│   │   ├── ResizablePanels.tsx  # Three-panel drag-to-resize layout
│   │   ├── Header.tsx           # Config controls, export, theme toggle
│   │   ├── SignalEditor.tsx     # Left panel: signal list + context menu
│   │   ├── SignalRow.tsx        # One signal row (waveform + bubbles + data)
│   │   ├── WaveformRenderer.tsx # SVG waveform drawing engine
│   │   ├── BubbleRow.tsx        # Character / color-swatch row below waveform
│   │   ├── ContextMenu.tsx      # Right-click floating menu
│   │   ├── CodeEditor.tsx       # Monaco JSON editor
│   │   └── Preview.tsx          # Live SVG preview panel
│   └── utils/
│       ├── waveHelpers.ts       # State cycling, resolve, data map helpers
│       ├── serialize.ts         # WaveJSON → JSON string
│       └── parse.ts             # JSON string → WaveJSON + validation
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Roadmap

Phase 1 (current) covers the core editing workflow. Planned for later phases:

- **Groups / lanes** — collapsible signal groups using WaveDrom's array syntax
- **Edge annotations** — add arrow connections between named nodes
- **period / phase** per signal
- **Logic circuit diagrams** — WaveDrom's `assign` element

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss larger changes.

---

## License

MIT
