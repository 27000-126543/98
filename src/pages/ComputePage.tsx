import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Zap, ArrowLeftRight, Layers, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useStore } from '@/store'
import type { CalculationProgress } from '@/types'

const CARDS = [
  { key: 'energy' as const, label: '能量', sublabel: 'Energy', icon: Zap, color: '#00F0FF', gradient: 'from-[#00F0FF] to-[#0090FF]' },
  { key: 'dipole' as const, label: '偶极矩', sublabel: 'Dipole Moment', icon: ArrowLeftRight, color: '#8B5CF6', gradient: 'from-[#8B5CF6] to-[#EC4899]' },
  { key: 'homoLumo' as const, label: 'HOMO-LUMO能级', sublabel: 'HOMO-LUMO', icon: Layers, color: '#10B981', gradient: 'from-[#10B981] to-[#00F0FF]' },
]

export default function ComputePage() {
  const { id } = useParams<{ id: string }>()
  const task = useStore(s => s.tasks.find(t => t.id === id))
  const updateProgress = useStore(s => s.updateProgress)
  const completeTask = useStore(s => s.completeTask)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!task) return
    if (task.status === 'completed') {
      setCompleted(true)
      return
    }

    const isHigh = task.precisionMode === 'high'
    const totalTicks = isHigh ? 50 : 30
    const intervalMs = 100

    const initProgress = { ...task.progress }
    const maxInit = Math.max(initProgress.energy, initProgress.dipole, initProgress.homoLumo)
    let tick = Math.round((maxInit / 100) * totalTicks)

    const timer = setInterval(() => {
      tick += 1
      const t = tick / totalTicks

      const speedFactors = {
        energy: 1.0,
        dipole: 0.95,
        homoLumo: 0.9,
      }

      const next: CalculationProgress = {
        energy: Math.min(100, Math.max(initProgress.energy, Math.round(t * 100 * speedFactors.energy * (1 + Math.random() * 0.1)))),
        dipole: Math.min(100, Math.max(initProgress.dipole, Math.round(t * 100 * speedFactors.dipole * (1 + Math.random() * 0.15)))),
        homoLumo: Math.min(100, Math.max(initProgress.homoLumo, Math.round(t * 100 * speedFactors.homoLumo * (1 + Math.random() * 0.2)))),
      }

      updateProgress(task.id, next)

      if (tick >= totalTicks) {
        const forced: CalculationProgress = { energy: 100, dipole: 100, homoLumo: 100 }
        updateProgress(task.id, forced)
        clearInterval(timer)
        completeTask(task.id)
        setCompleted(true)
        return
      }

      if (next.energy >= 100 && next.dipole >= 100 && next.homoLumo >= 100) {
        clearInterval(timer)
        completeTask(task.id)
        setCompleted(true)
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [id, updateProgress, completeTask])

  if (!task) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-xl font-semibold mb-2">任务未找到</p>
          <p className="text-gray-500 text-sm mb-6">该计算任务不存在或已被删除</p>
          <Link to="/" className="inline-flex items-center gap-2 text-[#00F0FF] hover:underline text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F0FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <Link to="/history" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回历史任务
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">分子性质计算</h1>
          <p className="text-gray-400 text-sm">
            {task.formula} · {task.fileName} · {task.precisionMode === 'high' ? '高精度模式' : '标准模式'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {CARDS.map(card => {
            const value = task.progress[card.key]
            const Icon = card.icon
            return (
              <div
                key={card.key}
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{card.label}</p>
                    <p className="text-gray-500 text-xs">{card.sublabel}</p>
                  </div>
                </div>

                <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-3">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${card.gradient} transition-all duration-300`}
                    style={{ width: `${value}%` }}
                  >
                    <div
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{ boxShadow: `0 0 12px ${card.color}80` }}
                    />
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${card.color}40 50%, transparent 100%)`,
                        animation: 'shimmer 1.5s infinite',
                      }}
                    />
                  </div>
                </div>

                <p
                  className="text-3xl font-mono font-bold tabular-nums"
                  style={{ color: card.color }}
                >
                  {value}<span className="text-lg ml-0.5">%</span>
                </p>
              </div>
            )
          })}
        </div>

        {completed && (
          <div className="text-center animate-[fadeInUp_0.5s_ease-out]">
            <div className="relative inline-block mb-6">
              <CheckCircle className="w-20 h-20 text-emerald-400 animate-[pulse_2s_infinite]" />
              <div className="absolute inset-0 animate-[ping_1.5s_ease-out_infinite]">
                <CheckCircle className="w-20 h-20 text-emerald-400/30" />
              </div>
            </div>
            <p className="text-emerald-400 text-xl font-bold mb-2">计算完成</p>
            <p className="text-gray-400 text-sm mb-6">所有性质计算已完成，可查看详细结果</p>
            <Link
              to={`/result/${id}`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              查看结果
            </Link>
          </div>
        )}

        {!completed && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
              计算进行中...
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
