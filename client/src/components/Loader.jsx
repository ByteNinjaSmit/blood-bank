import React from "react"
import { useState, useEffect, useCallback } from "react"
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
    PanelLeftDashed,
} from "lucide-react"
import { useAuth } from "@/store/auth";
import Sidebar from "@/components/layout/Sidebar";
import Loader from "@/components/utils/Spinner";

function MasterLoader() {
    const { user } = useAuth();
    const pathname = useLocation().pathname
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [showMobileOverlay, setShowMobileOverlay] = useState(false)

    const checkMobile = useCallback(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) {
            setSidebarOpen(false);
        }
    }, []);

    useEffect(() => {
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [checkMobile]);

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

    useEffect(() => {
        if (isMobile && showMobileOverlay) {
            closeMobileOverlay();
        }
    }, [pathname, isMobile, showMobileOverlay, closeMobileOverlay]);

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                isMobile={isMobile}
                showMobileOverlay={showMobileOverlay}
                onCloseMobile={closeMobileOverlay}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="flex-shrink-0 bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors md:hidden"
                                >
                                    <PanelLeftDashed className="w-5 h-5 cursor-pointer" />
                                </button>
                            )}
                            {!isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors hidden md:block"
                                >
                                    <PanelLeftDashed className="w-5 h-5 cursor-pointer" />
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <Link 
                                    to={'/'} 
                                    className="cursor-pointer text-red-800 hover:text-red-800 transition-colors flex items-center gap-2"
                                >
                                    <FaHome className="w-5 h-5" />
                                </Link>
                                <ChevronRight className="text-slate-400 w-4 h-4" />
                                <h1 className="text-lg md:text-xl font-semibold text-slate-800">
                                    Blood Bank - Sanjivani, Kopargaon
                                </h1>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="h-full">
                       <Loader/>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MasterLoader