import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 h-14 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-end px-6">
          <NotificationBell />
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
