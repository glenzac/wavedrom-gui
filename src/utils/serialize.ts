import type { WaveJSON } from '../types'

export function serialize(waveJson: WaveJSON): string {
  return JSON.stringify(waveJson, null, 2)
}
