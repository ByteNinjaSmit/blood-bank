import { Menu, Bell, User } from 'lucide-react'
import { Button } from '../ui/button'
import { useSidebar } from '../ui/sidebar'

function TopBar() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="mr-4"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <h2 className="text-lg font-semibold">Sanjivani Blood Bank</h2>
      
      <div className="ml-auto flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

export default TopBar