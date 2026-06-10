import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { BarChart3, Clock, CheckCircle, TrendingUp, Activity } from 'lucide-react'
import { useStore } from '@/store'

function getDateKey(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function DashboardPage() {
  const tasks = useStore(s => s.tasks)

  const stats = useMemo(() => {
    const now = new Date()
    const dailyCounts: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyCounts[getDateKey(d.toISOString())] = 0
    }

    const completed = tasks.filter(t => t.status === 'completed')
    const computing = tasks.filter(t => t.status === 'computing')
    const pending = tasks.filter(t => t.status === 'pending')
    const failed = tasks.filter(t => t.status === 'failed')

    for (const t of tasks) {
      const key = getDateKey(t.submittedAt)
      if (key in dailyCounts) dailyCounts[key]++
    }

    const avgDuration = completed.length
      ? Math.round(completed.reduce((s, t) => s + (t.duration ?? 0), 0) / completed.length)
      : 0

    const byPrecision = tasks.reduce(
      (acc, t) => {
        if (t.status === 'completed' && t.duration != null) {
          acc[t.precisionMode].push(t.duration)
        }
        return acc
      },
      { standard: [] as number[], high: [] as number[] }
    )

    const avgByPrecision = {
      standard: byPrecision.standard.length
        ? Math.round(byPrecision.standard.reduce((a, b) => a + b, 0) / byPrecision.standard.length)
        : 0,
      high: byPrecision.high.length
        ? Math.round(byPrecision.high.reduce((a, b) => a + b, 0) / byPrecision.high.length)
        : 0,
    }

    const moleculeDist = tasks.reduce(
      (acc, t) => {
        acc[t.moleculeType]++
        return acc
      },
      { organic: 0, inorganic: 0, metalContaining: 0 }
    )

    return {
      total: tasks.length,
      completedCount: completed.length,
      computingCount: computing.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      avgDuration,
      completedRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
      dailyCounts,
      avgByPrecision,
      moleculeDist,
    }
  }, [tasks])

  const dailyDates = Object.keys(stats.dailyCounts)
  const dailyValues = Object.values(stats.dailyCounts)

  const lineOption = {
    backgroundColor: 'transparent',
    textStyle: { color: 'rgba(255,255,255,0.6)' },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category' as const,
      data: dailyDates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        type: 'line' as const,
        data: dailyValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#00F0FF', width: 2 },
        itemStyle: { color: '#00F0FF' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,240,255,0.25)' },
              { offset: 1, color: 'rgba(0,240,255,0.02)' },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(10,22,40,0.95)',
      borderColor: 'rgba(0,240,255,0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [8, 12],
    },
  }

  const barOption = {
    backgroundColor: 'transparent',
    textStyle: { color: 'rgba(255,255,255,0.6)' },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category' as const,
      data: ['标准精度', '高精度'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, formatter: '{value}s' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        type: 'bar' as const,
        data: [
          { value: stats.avgByPrecision.standard, itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#00F0FF' }, { offset: 1, color: '#0090FF' }] } } },
          { value: stats.avgByPrecision.high, itemStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#8B5CF6' }, { offset: 1, color: '#6D28D9' }] } } },
        ],
        barWidth: 48,
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
    ],
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(10,22,40,0.95)',
      borderColor: 'rgba(0,240,255,0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [8, 12],
      formatter: (p: any[]) => `${p[0].name}: ${p[0].value}s`,
    },
  }

  const pieData = [
    { value: stats.moleculeDist.organic, name: '有机物', itemStyle: { color: '#10B981' } },
    { value: stats.moleculeDist.inorganic, name: '无机物', itemStyle: { color: '#00F0FF' } },
    { value: stats.moleculeDist.metalContaining, name: '含金属', itemStyle: { color: '#8B5CF6' } },
  ]

  const pieOption = {
    backgroundColor: 'transparent',
    textStyle: { color: 'rgba(255,255,255,0.6)' },
    legend: {
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['50%', '72%'],
        center: ['50%', '42%'],
        data: pieData,
        label: {
          show: false,
        },
        labelLine: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.4)' },
          scale: true,
          scaleSize: 6,
        },
      },
    ],
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(10,22,40,0.95)',
      borderColor: 'rgba(0,240,255,0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [8, 12],
      formatter: '{b}: {c} ({d}%)',
    },
  }

  const statCards = [
    { icon: <BarChart3 size={18} />, label: '总任务数', value: stats.total, accent: 'border-t-[#00F0FF]', iconColor: 'text-[#00F0FF]' },
    { icon: <Activity size={18} />, label: '计算中', value: stats.computingCount, accent: 'border-t-blue-500', iconColor: 'text-blue-400' },
    { icon: <CheckCircle size={18} />, label: '已完成', value: stats.completedCount, accent: 'border-t-emerald-500', iconColor: 'text-emerald-400' },
    { icon: <Clock size={18} />, label: '平均耗时', value: stats.avgDuration ? `${stats.avgDuration}s` : '-', accent: 'border-t-[#8B5CF6]', iconColor: 'text-[#8B5CF6]' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <TrendingUp size={22} className="text-[#00F0FF]" />
        <h1 className="text-xl font-bold text-white">统计仪表盘</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 ${c.accent} border-t-2 p-4 transition-all hover:bg-white/[0.07]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-xs">{c.label}</span>
              <span className={c.iconColor}>{c.icon}</span>
            </div>
            <div className="font-['Space_Grotesk'] text-3xl font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h2 className="text-white/70 text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#00F0FF]" /> 近7日计算量
          </h2>
          <ReactECharts option={lineOption} style={{ height: 240 }} />
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h2 className="text-white/70 text-sm font-medium mb-4 flex items-center gap-2">
            <Clock size={14} className="text-[#8B5CF6]" /> 精度模式耗时对比
          </h2>
          <ReactECharts option={barOption} style={{ height: 240 }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h2 className="text-white/70 text-sm font-medium mb-4">分子类型分布</h2>
          <ReactECharts option={pieOption} style={{ height: 200 }} />
        </div>
        <div className="col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h2 className="text-white/70 text-sm font-medium mb-4">任务状态概览</h2>
          <div className="grid grid-cols-4 gap-4 h-[200px]">
            {[
              { label: '总任务', value: stats.total, color: '#fff', bg: 'bg-white/5', border: 'border-white/10' },
              { label: '计算中', value: stats.computingCount, color: '#60A5FA', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: '已完成', value: stats.completedCount, color: '#34D399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: '失败', value: stats.failedCount, color: '#F87171', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} ${s.border} border rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:scale-105`}
              >
                <span className="font-['Space_Grotesk'] text-4xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="text-white/40 text-sm mt-2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
