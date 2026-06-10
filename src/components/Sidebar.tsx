import { NavLink, useLocation } from 'react-router-dom'
import { Upload, Activity, History, BarChart3, Bell, Atom } from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { path: '/', label: '分子上传', icon: Upload },
  { path: '/history', label: '历史任务', icon: History },
  { path: '/dashboard', label: '统计看板', icon: BarChart3 },
]

export default function Sidebar() {
  const location = useLocation()
  const notifications = useStore(s => s.notifications)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#070e1a]/90 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#8B5CF6] flex items-center justify-center">
          <Atom size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>MolCalc</h1>
          <p className="text-[10px] text-white/40">分子性质计算平台</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/' || location.pathname.startsWith('/compute') || location.pathname.startsWith('/result')
            : location.pathname.startsWith(item.path)
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <Icon size={18} className={isActive ? 'text-[#00F0FF]' : 'text-white/40 group-hover:text-white/60'} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="relative px-4 py-2.5 rounded-lg text-white/40 text-xs">
          <Activity size={14} className="inline mr-2" />
          系统运行正常
          {unreadCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] rounded-full bg-[#EF4444] text-white text-[10px] flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
