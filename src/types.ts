export interface Signal {
  name: string
  wave: string
  data?: string[]
}

export interface WaveJSON {
  signal: Signal[]
  config?: {
    hscale?: number
    skin?: string
  }
}

export type CellState = '0' | '1' | 'x' | 'z' | '=' | '.' | 'p' | 'P' | 'n' | 'N' | 'h' | 'l' | 'u' | 'd' | '|'
