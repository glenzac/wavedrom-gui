import { useEffect, useRef } from 'react'

export type ContextMenuItem =
  | { separator: true }
  | { separator?: false; label: string; onClick?: () => void; danger?: boolean; disabled?: boolean }

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  isDark: boolean
  onClose: () => void
}

export default function ContextMenu({ x, y, items, isDark, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Clamp to viewport
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) el.style.left = `${x - rect.width}px`
    if (rect.bottom > window.innerHeight) el.style.top = `${y - rect.height}px`
  }, [x, y])

  // Close on outside click or Escape
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('mousedown', down)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', key) }
  }, [onClose])

  const bg = isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
  const itemBase = isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-800 hover:bg-gray-100'
  const danger = isDark ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'
  const disabled = isDark ? 'text-slate-600' : 'text-gray-400'
  const sep = isDark ? 'border-slate-700' : 'border-gray-200'

  return (
    <div
      ref={ref}
      className={`fixed z-50 min-w-[170px] rounded shadow-xl border text-xs py-1 ${bg}`}
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => {
        if (item.separator) return <div key={i} className={`border-t my-1 ${sep}`} />
        return (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => { item.onClick?.(); onClose() }}
            className={`w-full text-left px-3 py-1.5 transition-colors ${item.disabled ? disabled : item.danger ? danger : itemBase}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
