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
          "flex flex-col flex-1 w-full overflow-hidden transition-all duration-300",
          open ? "md:ml-64" : "md:ml-16"
        )}
      >
        <TopBar />
        <main className="flex-1 w-full overflow-y-auto p-4 md:p-6 h-[calc(100vh-64px)]">
          <div className="h-full w-full max-w-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout