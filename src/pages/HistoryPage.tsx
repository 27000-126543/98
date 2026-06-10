import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Clock, Filter, ArrowUpDown, ChevronRight, CheckSquare, Square, AlertTriangle, Inbox } from 'lucide-react'
import { useStore } from '@/store'
import type { TaskStatus } from '@/types'
import { cn } from '@/lib/utils'

type SortKey = 'time' | 'weight' | 'status'
type FilterKey = 'all' | TaskStatus

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; glow: string }> = {
  pending: { label: '待计算', color: 'bg-white/20 text-white/60', glow: '' },
  computing: { label: '计算中', color: 'bg-[#00F0FF]/15 text-[#00F0FF]', glow: 'animate-pulse' },
  completed: { label: '已完成', color: 'bg-emerald-500/15 text-emerald-400', glow: '' },
  failed: { label: '失败', color: 'bg-red-500/15 text-red-400', glow: '' },
}

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待计算' },
  { key: 'computing', label: '计算中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'time', label: '按时间' },
  { key: 'weight', label: '按分子量' },
  { key: 'status', label: '按状态' },
]

const STATUS_ORDER: Record<TaskStatus, number> = { computing: 0, pending: 1, failed: 2, completed: 3 }

function formatDuration(seconds?: number) {
  if (seconds == null) return '-'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m${s}s`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const tasks = useStore(s => s.tasks)
  const deleteTask = useStore(s => s.deleteTask)
  const deleteTasks = useStore(s => s.deleteTasks)

  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('time')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'single' | 'batch'; id?: string } | null>(null)

  const filtered = useMemo(() => {
    let list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    return [...list].sort((a, b) => {
      if (sort === 'time') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      if (sort === 'weight') return b.molecularWeight - a.molecularWeight
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })
  }, [tasks, filter, sort])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(t => t.id)))
  }

  const handleDelete = () => {
    if (confirm?.type === 'single' && confirm.id) deleteTask(confirm.id)
    else if (confirm?.type === 'batch') deleteTasks([...selected])
    setConfirm(null)
    setSelected(new Set())
  }

  const handleRowClick = (task: (typeof tasks)[0]) => {
    if (task.status === 'computing') navigate(`/compute/${task.id}`)
    else if (task.status === 'completed') navigate(`/result/${task.id}`)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-white/30">
        <Inbox size={56} strokeWidth={1} />
        <p className="mt-4 text-lg">暂无计算任务</p>
        <p className="mt-1 text-sm text-white/20">上传分子文件开始计算</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">历史任务</h2>
        <span className="text-sm text-white/40">共 {tasks.length} 条记录</span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-white/30" />
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs transition-all duration-200',
                filter === opt.key
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-white/30" />
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs transition-all duration-200',
                sort === opt.key
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                  : 'bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-sm text-red-400">已选择 {selected.size} 项</span>
          <button
            onClick={() => setConfirm({ type: 'batch' })}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
          >
            <Trash2 size={12} /> 批量删除
          </button>
        </div>
      )}

      <div className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02] backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-white/40 text-xs">
              <th className="w-10 py-3 px-3">
                <button onClick={toggleAll}>
                  {selected.size === filtered.length && filtered.length > 0
                    ? <CheckSquare size={15} className="text-[#00F0FF]" />
                    : <Square size={15} className="text-white/20 hover:text-white/40" />}
                </button>
              </th>
              <th className="py-3 px-3 text-left font-medium">分子名</th>
              <th className="py-3 px-3 text-left font-medium">分子式</th>
              <th className="py-3 px-3 text-left font-medium">分子量</th>
              <th className="py-3 px-3 text-left font-medium">精度模式</th>
              <th className="py-3 px-3 text-left font-medium">状态</th>
              <th className="py-3 px-3 text-left font-medium">提交时间</th>
              <th className="py-3 px-3 text-left font-medium">耗时</th>
              <th className="py-3 px-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => {
              const sc = STATUS_CONFIG[task.status]
              const isClickable = task.status === 'computing' || task.status === 'completed'
              return (
                <tr
                  key={task.id}
                  onClick={() => isClickable && handleRowClick(task)}
                  className={cn(
                    'border-b border-white/[0.03] transition-all duration-200',
                    isClickable ? 'cursor-pointer hover:bg-[#00F0FF]/[0.03] hover:shadow-[inset_0_0_30px_rgba(0,240,255,0.03)]' : 'hover:bg-white/[0.02]',
                    selected.has(task.id) && 'bg-[#00F0FF]/[0.05]'
                  )}
                >
                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(task.id)}>
                      {selected.has(task.id)
                        ? <CheckSquare size={15} className="text-[#00F0FF]" />
                        : <Square size={15} className="text-white/20 hover:text-white/40" />}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-white/80 font-medium">{task.fileName}</td>
                  <td className="py-3 px-3 text-white/60 font-mono text-xs">{task.formula}</td>
                  <td className="py-3 px-3 text-white/60">{task.molecularWeight.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      task.precisionMode === 'high' ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-white/40'
                    )}>
                      {task.precisionMode === 'high' ? '高精度' : '标准'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs', sc.color, sc.glow)}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        task.status === 'pending' && 'bg-white/40',
                        task.status === 'computing' && 'bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]',
                        task.status === 'completed' && 'bg-emerald-400',
                        task.status === 'failed' && 'bg-red-400'
                      )} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white/40">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatTime(task.submittedAt)}</span>
                  </td>
                  <td className="py-3 px-3 text-white/40">{formatDuration(task.duration)}</td>
                  <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isClickable && <ChevronRight size={14} className="text-white/20" />}
                      <button
                        onClick={() => setConfirm({ type: 'single', id: task.id })}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <Filter size={32} strokeWidth={1} />
            <p className="mt-3 text-sm">当前筛选条件下无任务</p>
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirm(null)}>
          <div className="w-[380px] rounded-2xl border border-white/10 bg-[#0e1f36]/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">确认删除</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {confirm.type === 'batch' ? `将删除 ${selected.size} 条任务记录` : '此操作不可撤销'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors">取消</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
