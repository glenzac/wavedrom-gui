import type { WaveJSON } from '../types'

export function parse(str: string): { result?: WaveJSON; error?: string } {
  try {
    const parsed = JSON.parse(str)
    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Root must be an object' }
    }
    if (!Array.isArray(parsed.signal)) {
      return { error: 'Missing required "signal" array' }
    }
    return { result: parsed as WaveJSON }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid JSON' }
  }
}
