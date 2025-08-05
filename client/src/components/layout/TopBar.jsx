import { Menu, Bell, User, Search, PlusCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { useSidebar } from '../ui/sidebar'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '../../lib/utils'

function TopBar() {
  const { toggleSidebar, open } = useSidebar()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 shadow-sm">
      {!open && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4 md:hidden"
          title="Show Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      <div className="relative w-full max-w-md hidden md:block">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input 
          type="search" 
          className="block w-full p-2 pl-10 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary" 
          placeholder="Search donors, requests, inventory..." 
        />
      </div>
      
      <div className="ml-auto flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-3">
          <Link to="/donor/register">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Quick Register Donor
            </Button>
          </Link>
          
          <Link to="/hospital/emergency">
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Emergency Request
            </Button>
          </Link>
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
          </Button>
        </div>
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden"
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform", showMobileMenu && "rotate-180")} />
          </Button>
          
          {/* Mobile dropdown menu */}
          {showMobileMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 md:hidden">
              <div className="py-1">
                <Link 
                  to="/donor/register"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    <span>Quick Register Donor</span>
                  </div>
                </Link>
                <Link 
                  to="/hospital/emergency"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 font-medium">Emergency Request</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

export default TopBar