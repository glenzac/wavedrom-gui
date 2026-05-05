interface Props {
  svgContent: string
  isDark: boolean
}

export default function Preview({ svgContent, isDark }: Props) {
  const header = isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
  const label = isDark ? 'text-slate-400' : 'text-gray-500'

  return (
    <div className="flex flex-col h-full bg-white">
      <div className={`px-3 py-2 border-b ${header} flex-shrink-0`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${label}`}>Preview</span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {svgContent ? (
          <div
            className="preview-svg"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-gray-400 text-sm">Rendering…</div>
        )}
      </div>
    </div>
  )
}
