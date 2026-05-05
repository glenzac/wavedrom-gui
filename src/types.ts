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

export type CellState = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'x' | 'z' | '=' | '.' | 'p' | 'P' | 'n' | 'N' | 'h' | 'l' | 'u' | 'd' | '|'
