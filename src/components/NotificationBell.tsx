import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { useStore } from '@/store'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notifications = useStore(s => s.notifications)
  const markNotificationRead = useStore(s => s.markNotificationRead)
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead)
  const unreadCount = notifications.filter(n => !n.read).length
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell size={18} className="text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#EF4444] text-white text-[10px] flex items-center justify-center px-0.5 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#0d1a2e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-medium text-white">通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1"
              >
                <Check size={12} /> 全部已读
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/30 text-sm">暂无通知</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#00F0FF]/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-[#10B981]' : n.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#00F0FF]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{n.message}</p>
                      <p className="text-[10px] text-white/30 mt-1">
                        {new Date(n.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {!n.read && <X size={12} className="text-white/20 mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
