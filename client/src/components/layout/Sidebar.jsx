import { NavLink } from 'react-router-dom'
import { useSidebar } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Users,
  TestTube,
  Building2,
  Package,
  Settings,
  Upload,
  FileText
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/donor', label: 'Donor Management', icon: Users },
  { path: '/lab', label: 'Lab & Testing', icon: TestTube },
  { path: '/hospital', label: 'Hospital Requests', icon: Building2 },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/upload', label: 'Bulk Upload', icon: Upload },
  { path: '/reports', label: 'Reports & Logs', icon: FileText },
]

function Sidebar() {
  const { open } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out',
        open ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b px-4">
        <h1 className={cn('font-bold text-primary', open ? 'text-xl' : 'text-xs')}>
          {open ? 'SBBMS' : 'SB'}
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground',
                    !open && 'justify-center px-0'
                  )
                }
              >
                <item.icon className={cn('h-5 w-5', open && 'mr-2')} />
                {open && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar