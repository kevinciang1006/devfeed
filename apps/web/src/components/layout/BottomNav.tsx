import { NavLink } from 'react-router-dom'
import { Home, BarChart2, Settings } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: Home },
  { to: '/progress', icon: BarChart2 },
  { to: '/settings', icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-3 z-50">
      {navItems.map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `p-2 ${isActive ? 'text-white' : 'text-muted'}`
          }
        >
          <Icon size={20} />
        </NavLink>
      ))}
    </nav>
  )
}
