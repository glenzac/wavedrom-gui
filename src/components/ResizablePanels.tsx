import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  isDark: boolean
}

export default function ResizablePanels({ left, center, right, isDark }: Props) {
  const [leftW, setLeftW] = useState(380)
  const [rightW, setRightW] = useState(360)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'left' | 'right' | null>(null)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const totalW = rect.width

    if (dragging.current === 'left') {
      const newLeft = Math.max(240, Math.min(e.clientX - rect.left, totalW * 0.65))
      setLeftW(newLeft)
    } else {
      const fromRight = rect.right - e.clientX
      const newRight = Math.max(200, Math.min(fromRight, totalW * 0.55))
      setRightW(newRight)
    }
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  const dividerCls = `w-[3px] flex-shrink-0 cursor-col-resize transition-colors
    ${isDark ? 'bg-slate-700 hover:bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'}`

  function startDrag(side: 'left' | 'right') {
    dragging.current = side
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div style={{ width: leftW, minWidth: 240 }} className="flex-shrink-0 overflow-hidden flex flex-col">
        {left}
      </div>

      <div className={dividerCls} onMouseDown={() => startDrag('left')} />

      <div className="flex-1 min-w-[180px] overflow-hidden flex flex-col">
        {center}
      </div>

      <div className={dividerCls} onMouseDown={() => startDrag('right')} />

      <div style={{ width: rightW, minWidth: 200 }} className="flex-shrink-0 overflow-hidden flex flex-col">
        {right}
      </div>
    </div>
  )
}
