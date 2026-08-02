import React from "react"
import { useState, useEffect, useCallback } from "react"
import {
    useLocation,
    Outlet,
    Link,
} from "react-router-dom"
import { FaHome } from "react-icons/fa";
import {
    ChevronRight,
    Menu,
    PanelLeftDashed,
} from "lucide-react"
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/features/notification/components/NotificationBell";
import { useNotificationToastWatcher } from "@/features/notification/hooks/useNotificationToastWatcher";
import { useIsMobile } from "@/hooks/use-mobile";

function MasterLayout() {
    useNotificationToastWatcher();
    const pathname = useLocation().pathname
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const isMobile = useIsMobile()
    const [showMobileOverlay, setShowMobileOverlay] = useState(false)

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    const toggleSidebar = useCallback(() => {
        if (isMobile) {
            setShowMobileOverlay(prev => !prev);
        } else {
            setSidebarOpen(prev => !prev);
        }
    }, [isMobile]);

    const closeMobileOverlay = useCallback(() => {
        setShowMobileOverlay(false);
    }, []);

    // Close the mobile overlay on navigation only — must NOT depend on
    // showMobileOverlay itself, or opening the drawer (which flips that
    // value to true) immediately re-triggers this effect and closes it
    // right back before the user ever sees it.
    useEffect(() => {
        if (isMobile) {
            closeMobileOverlay();
        }
    }, [pathname, isMobile, closeMobileOverlay]);

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden print:h-auto print:block print:overflow-visible">
            <div className="print:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onToggle={toggleSidebar}
                    isMobile={isMobile}
                    showMobileOverlay={showMobileOverlay}
                    onCloseMobile={closeMobileOverlay}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
                <header className="flex-shrink-0 bg-white border-b border-slate-200 p-3 sm:p-4 shadow-sm sticky top-0 z-30 print:hidden">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <button
                                onClick={toggleSidebar}
                                className="flex-shrink-0 text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
                            >
                                <PanelLeftDashed className="w-5 h-5 cursor-pointer" />
                            </button>
                            <div className="flex items-center gap-2 min-w-0">
                                <Link
                                    to={'/'}
                                    className="flex-shrink-0 cursor-pointer text-red-800 hover:text-red-800 transition-colors flex items-center gap-2"
                                >
                                    <FaHome className="w-5 h-5" />
                                </Link>
                                <ChevronRight className="flex-shrink-0 text-slate-400 w-4 h-4" />
                                <h1 className="truncate text-base sm:text-lg md:text-xl font-semibold text-slate-800">
                                    <span className="sm:hidden">Sanjivani Blood Bank</span>
                                    <span className="hidden sm:inline">Sanjivani Blood Bank, Kopargaon</span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <NotificationBell />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto print:overflow-visible print:block">
                    <div className="h-full print:h-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MasterLayout