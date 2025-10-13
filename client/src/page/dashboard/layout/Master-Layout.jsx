import React from "react"
import { useState, useEffect } from "react"
import {
    useNavigate,
    useSearchParams,
    useLocation,
    Outlet,
    Link,
} from "react-router-dom"
import { FaHome } from "react-icons/fa";
import {
    ChevronRight,
    Menu,
} from "lucide-react"
import { useAuth } from "@/store/auth";
import Sidebar from "@/components/layout/Sidebar";
import "@/components/layout/Sidebar.css";

// Modules and permission logic moved to Sidebar component

function MasterLayout() {
    const { user } = useAuth();
    const pathname = useLocation().pathname
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [showMobileOverlay, setShowMobileOverlay] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth < 768) {
                setSidebarOpen(false)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const toggleSidebar = () => {
        if (isMobile) {
            setShowMobileOverlay(!showMobileOverlay)
        } else {
            setSidebarOpen(!sidebarOpen)
        }
    }

    const closeMobileOverlay = () => {
        setShowMobileOverlay(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex relative">
            {/* New Sidebar Component */}
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                isMobile={isMobile}
                showMobileOverlay={showMobileOverlay}
                onCloseMobile={closeMobileOverlay}
            />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors md:hidden"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                                    <Link to={'/'} className="cursor-pointer text-red-600 hover:text-red-700 transition-colors">
                                        <FaHome className="w-5 h-5" />
                                    </Link>
                                    <ChevronRight className="text-slate-400 w-4 h-4" />
                                    <span>Blood Bank Management System</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default MasterLayout
