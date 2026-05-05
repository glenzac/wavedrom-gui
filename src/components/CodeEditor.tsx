import Editor from '@monaco-editor/react'

interface Props {
  value: string
  error: string | null
  isDark: boolean
  onChange: (value: string) => void
}

export default function CodeEditor({ value, error, isDark, onChange }: Props) {
  const panel = isDark ? 'bg-slate-900' : 'bg-gray-50'
  const header = isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
  const label = isDark ? 'text-slate-400' : 'text-gray-500'

  return (
    <div className={`flex flex-col h-full ${panel}`}>
      <div className={`px-3 py-2 border-b ${header} flex-shrink-0`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${label}`}>WaveJSON</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="json"
          theme={isDark ? 'vs-dark' : 'vs'}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            formatOnType: false,
            formatOnPaste: false,
            padding: { top: 8 },
          }}
        />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-900/80 border-t border-red-700 text-red-200 text-xs flex-shrink-0 font-mono">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
