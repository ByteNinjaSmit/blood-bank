import { NavLink } from 'react-router-dom'
import { useSidebar } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  LayoutDashboard,
  Users,
  TestTube,
  Building2,
  Package,
  Settings,
  Upload,
  FileText,
  Heart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/donor', label: 'Donor Management', icon: Users },
  { path: '/lab', label: 'Lab & Testing', icon: TestTube },
  { path: '/hospital', label: 'Hospital Requests', icon: Building2 },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/upload', label: 'Bulk Upload', icon: Upload },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar() {
  const { open, toggleSidebar } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out',
        open ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b px-4">
        <div className="flex items-center">
          <div className={cn('bg-red-500 text-white p-2 rounded-md mr-2', !open && 'p-1')}>
            <Heart className={cn('h-5 w-5', !open && 'h-4 w-4')} />
          </div>
          {open && (
            <div>
              <h1 className="font-bold text-lg text-red-600">Sanjivani</h1>
              <p className="text-xs text-gray-500">Blood Bank System</p>
            </div>
          )}
        </div>
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
                    !open && 'justify-center px-0',
                    open ? 'tooltip-none' : 'tooltip-auto'
                  )
                }
                title={!open ? item.label : undefined}
              >
                <item.icon className={cn('h-5 w-5', open && 'mr-2')} />
                {open && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar} 
          className="w-full flex items-center justify-center py-2"
          title={open ? "Hide Sidebar" : "Expand Sidebar"}
        >
          {open ? (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Hide Sidebar</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar