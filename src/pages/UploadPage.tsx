import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileUp, Atom, Zap, AlertTriangle, Hexagon, Scale } from 'lucide-react'
import { useStore, parseMoleculeFile } from '@/store'
import type { MoleculeParseResult } from '@/types'

const ACCEPTED = '.mol,.sdf,.xyz,.pdb'

export default function UploadPage() {
  const navigate = useNavigate()
  const addTask = useStore(s => s.addTask)
  const [result, setResult] = useState<MoleculeParseResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['mol', 'sdf', 'xyz', 'pdb'].includes(ext || '')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setFileContent(text)
      setResult(parseMoleculeFile(text, file.name))
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleSubmit = useCallback(() => {
    if (!fileContent || !fileName) return
    const task = addTask(fileContent, fileName)
    navigate(`/compute/${task.id}`)
  }, [fileContent, fileName, addTask, navigate])

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-8 md:px-12 lg:px-20">
      <h1
        className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        分子上传
      </h1>
      <p className="text-gray-400 mb-8 text-sm">上传分子结构文件，自动解析原子组成与精度模式</p>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-500
          flex flex-col items-center justify-center gap-4 py-16 mb-8 overflow-hidden
          ${dragging
            ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_40px_rgba(0,240,255,0.15)]'
            : hover
              ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/5 shadow-[0_0_30px_rgba(139,92,246,0.1)]'
              : 'border-gray-600/50 bg-white/[0.02]'
          }
        `}
      >
        <div className={`transition-transform duration-500 ${hover || dragging ? 'scale-110' : 'scale-100'}`}>
          {dragging ? (
            <FileUp className="w-12 h-12 text-[#00F0FF] animate-bounce" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-medium">
            {dragging ? '释放文件以上传' : '拖拽文件至此处或点击上传'}
          </p>
          <p className="text-gray-500 text-sm mt-1">支持 .mol / .sdf / .xyz / .pdb 格式</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFileChange}
          className="hidden"
        />
        <div
          className={`
            absolute inset-0 pointer-events-none
            ${hover || dragging ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-500
          `}
          style={{
            background: dragging
              ? 'radial-gradient(circle at center, rgba(0,240,255,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(139,92,246,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      {result && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Hexagon className="w-5 h-5 text-[#00F0FF]" />
              <span className="text-white text-xl font-mono tracking-wider">{result.formula}</span>
              <span className="text-gray-500 text-sm">— {fileName}</span>
            </div>
            <div
              className={`
                inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold
                ${result.precisionMode === 'high'
                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                  : 'bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                }
              `}
            >
              <Zap className="w-3.5 h-3.5" />
              {result.precisionMode === 'high' ? '高精度模式' : '标准精度模式'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Atom className="w-4 h-4 text-[#00F0FF]" />
                <h2 className="text-white font-semibold text-sm tracking-wide">原子组成</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {result.atoms.map(atom => (
                  <div
                    key={atom.symbol}
                    className={`
                      relative rounded-xl p-3 backdrop-blur-md transition-all duration-300
                      ${atom.isHeavyMetal
                        ? 'bg-red-500/15 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                        : 'bg-white/[0.04] border border-white/[0.06] hover:border-[#00F0FF]/30 hover:shadow-[0_0_12px_rgba(0,240,255,0.08)]'
                      }
                    `}
                  >
                    {atom.isHeavyMetal && (
                      <AlertTriangle className="absolute top-2 right-2 w-3 h-3 text-red-400" />
                    )}
                    <div className="text-2xl font-bold text-white font-mono">{atom.symbol}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{atom.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">×{atom.count}</span>
                      <span className="text-xs text-gray-500">{atom.mass.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-4 h-4 text-[#8B5CF6]" />
                  <h2 className="text-white font-semibold text-sm tracking-wide">分子量</h2>
                </div>
                <div
                  className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {result.molecularWeight.toFixed(3)}
                </div>
                <div className="text-gray-500 text-xs mt-1">g/mol</div>
              </div>

              {result.containsHeavyMetal && (
                <div className="rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-300 text-sm font-medium">检测到重金属</p>
                    <p className="text-red-400/70 text-xs mt-1">
                      包含 {result.atoms.filter(a => a.isHeavyMetal).map(a => a.name).join('、')}，已自动切换高精度模式
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="
              w-full py-4 rounded-2xl text-white font-bold text-lg tracking-wide
              bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6]
              hover:shadow-[0_0_40px_rgba(0,240,255,0.3)]
              active:scale-[0.98] transition-all duration-300
            "
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            开始计算
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
