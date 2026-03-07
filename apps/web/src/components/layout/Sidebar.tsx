import { NavLink } from 'react-router-dom'
import { Home, BarChart2, Settings } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/progress', label: 'Progress', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const user = useAppStore((s) => s.user)

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen bg-surface border-r border-border p-4 fixed left-0 top-0">
      <div className="font-mono font-bold text-white text-lg mb-8">devfeed</div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'text-white bg-white/5' : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#646CFF] flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="truncate">
            <div className="text-sm text-white truncate">{user.name || 'User'}</div>
            <div className="text-[10px] text-muted truncate">{user.email}</div>
          </div>
        </div>
      )}
    </aside>
  )
}
