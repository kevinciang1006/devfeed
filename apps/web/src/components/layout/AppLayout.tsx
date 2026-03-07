import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-56 pb-20 md:pb-0 px-4 md:px-8 py-6 max-w-4xl">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
