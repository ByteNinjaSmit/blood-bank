import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useSidebar } from '../ui/sidebar'
import { cn } from '../../lib/utils'

function MainLayout() {
  const { open } = useSidebar()
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300",
          open ? "ml-64" : "ml-16"
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout