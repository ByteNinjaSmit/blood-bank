import React from "react"
import { useState, useEffect } from "react"
import {
    useNavigate,
    useSearchParams,
    useLocation,
    Outlet,
    Link,
    href
} from "react-router-dom"
import { FaHome } from "react-icons/fa";
import {
    Search,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Activity,
    Calendar,
    TestTube,
    BarChart3,
    Package,
    Users,
    Heart,
    Microscope,
    Menu,
    X,
    Lock,
    Shield,
    Edit,
    PieChart,
    Home,
    HomeIcon,
    List,
    Plus,
    User,
} from "lucide-react"
import { toast } from "sonner"
import { sub } from "date-fns";
import { useAuth } from "@/store/auth";

const modules = [
    {
        id: "requisition",
        name: "Requisition",
        icon: <Activity className="w-5 h-5" />,
        href: "/requisition",
        permissions: ["read", "write"],
        description: "Manage blood requests and orders",
    },
    {
        id: "camp",
        name: "Camp",
        icon: <Calendar className="w-5 h-5" />,
        permissions: ["read", "write"],
        subModules: [
            {
                name: "Camp Registration",
                icon: <Plus className="w-5 h-5" />,
                href: "/camp-registration",
                permissions: ["write"],
                description: "Register new blood donation camps",
            },
            {
                name: "Camp Donations",
                icon: <Heart className="w-5 h-5" />,
                href: "/camp-donations",
                permissions: ["read", "write"],
                description: "Track donations from camps",
            },
            {
                name: "Camp List",
                icon: <List className="w-5 h-5" />,
                href: "/camp-listing",
                permissions: ["read"],
                description: "View all registered blood donation camps",
            },
            {
                name: "Camp Reports",
                icon: <PieChart className="w-5 h-5" />,
                href: "/camp-reports",
                permissions: ["read"],
                description: "Generate reports for blood donation camps",
            },
        ],
        description: "Blood donation camp management",
    },
    {
        id: "component",
        name: "Component",
        icon: <TestTube className="w-5 h-5" />,
        permissions: ["read", "write"],
        subModules: [
            {
                name: "Separate",
                href: "/component/separate",
                permissions: ["write"],
                description: "Separate blood components",
            },
            {
                name: "Near-Expiry",
                href: "/component/near-expiry",
                permissions: ["read"],
                description: "View near-expiry components",
            },
        ],
        description: "Blood component processing",
    },
    {
        id: "report",
        name: "Report",
        icon: <BarChart3 className="w-5 h-5" />,
        permissions: ["read", "admin"],
        subModules: [
            {
                name: "Daily",
                href: "/report/daily",
                permissions: ["read"],
                description: "Daily reports",
            },
            {
                name: "Expiry",
                href: "/report/expiry",
                permissions: ["read"],
                description: "Expiry reports",
            },
            {
                name: "Audit",
                href: "/report/audit",
                permissions: ["admin"],
                description: "Audit reports",
            },
        ],
        description: "Analytics and reporting",
    },
    {
        id: "inventory",
        name: "Inventory",
        icon: <Package className="w-5 h-5" />,
        permissions: ["read", "write"],
        subModules: [
            {
                name: "Reserve",
                href: "/inventory/reserve",
                permissions: ["write"],
                description: "Reserve blood units",
            },
            {
                name: "Issue",
                href: "/inventory/issue",
                permissions: ["write"],
                description: "Issue blood units",
            },
            // {
            //     name: "Discard",
            //     href: "/inventory/discard",
            //     permissions: ["admin"],
            //     description: "Discard expired units",
            // },
        ],
        description: "Blood stock management",
    },
    {
        id: "discard",
        name: "Discard",
        icon: <Edit className="w-5 h-5" />,
        //href: "/discard",
        permissions: ["read", "write"],   //make it admin in production
        subModules: [
            {
                name: "Discard List",
                href: "/discard",
                permissions: ["read", "write"],
                description: "View discarded blood units",
            }
        ],
        description: "Manage discarded blood units",

    },
    {
        id: "queue",
        name: "Queue",
        icon: <Users className="w-5 h-5" />,
        permissions: ["read", "write"],
        subModules: [
            {
                name: "Book",
                href: "/queue/book",
                permissions: ["write"],
                description: "Book donor appointments",
            },
            {
                name: "Queue List",
                href: "/queue/list",
                permissions: ["read"],
                description: "View donor queue",
            },
        ],
        description: "Donor queue management",
    },
    {
        id: "donations",
        name: "Donations",
        icon: <Heart className="w-5 h-5" />,
        href: "/donations",
        permissions: ["read", "write"],
        description: "Track donation records",
    },
    {
        id: "labs",
        name: "Labs",
        icon: <Microscope className="w-5 h-5" />,
        href: "/labs",
        permissions: ["read", "admin"],
        description: "Laboratory testing",
    },
]

const getUserPermissions = (role) => {
    switch (role) {
        case "admin":
            return ["read", "write", "admin"]
        case "doctor":
            return ["read", "write"]
        case "nurse":
            return ["read", "write"]
        case "technician":
            return ["read"]
        default:
            return ["read"]
    }
}

const hasPermission = (userPermissions, requiredPermissions) => {
    return requiredPermissions.some((permission) => userPermissions.includes(permission))
}

function MasterLayout() {
    const { user, API,LogoutUser } = useAuth();
    const router = useNavigate()
    const pathname = useLocation().pathname
    const [searchParams] = useSearchParams()
    const [selectedModule, setSelectedModule] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedSubModule, setSelectedSubModule] = useState(null)
    const [expandedModules, setExpandedModules] = useState(new Set())
    const [isMobile, setIsMobile] = useState(false)
    const [showMobileOverlay, setShowMobileOverlay] = useState(false)
    const userPermissions = getUserPermissions(user?.role)

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

    useEffect(() => {
        const currentModule = modules.find((module) => {
            if (module.href === pathname) return true
            return module.subModules?.some((sub) => sub.href === pathname)
        })

        if (currentModule) {
            setSelectedModule(currentModule)
            const currentSubModule = currentModule.subModules?.find((sub) => sub.href === pathname)
            setSelectedSubModule(currentSubModule || null)

            if (currentSubModule) {
                setExpandedModules((prev) => new Set([...prev, currentModule.id]))
            }
        }
    }, [pathname])

    const filteredModules = modules.filter(
        (module) =>
            module.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            hasPermission(userPermissions, module.permissions),
    )

    const handleModuleClick = (module) => {
        if (!hasPermission(userPermissions, module.permissions)) {
            toast.error("ACCESS DENIED!!", {
                description: "You don't have permission to access this section"
            })
            return
        }

        if (module.subModules && module.subModules.length > 0) {
            const newExpanded = new Set(expandedModules)
            if (newExpanded.has(module.id)) {
                newExpanded.delete(module.id)
            } else {
                newExpanded.add(module.id)
            }
            setExpandedModules(newExpanded)
        } else if (module.href) {
            router(module.href)
            if (isMobile) {
                setShowMobileOverlay(false)
            }
        }
    }

    const handleSubModuleClick = (module, subModule) => {
        if (!hasPermission(userPermissions, subModule.permissions)) {
            toast.error("ACCESS DENIED!!", {
                description: "You don't have permission to access this section"
            })
            return
        }

        router(subModule.href)
        if (isMobile) {
            setShowMobileOverlay(false)
        }
    }

    const toggleSidebar = () => {
        if (isMobile) {
            setShowMobileOverlay(!showMobileOverlay)
        } else {
            setSidebarOpen(!sidebarOpen)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex relative">
            {isMobile && showMobileOverlay && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileOverlay(false)} />
            )}

            <div
                className={`${isMobile
                    ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ${showMobileOverlay ? "translate-x-0" : "-translate-x-full"
                    }`
                    : `${sidebarOpen ? "w-80" : "w-16"} transition-all duration-300`
                    } bg-gradient-to-b from-red-800 via-red-700 to-red-900 text-white flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-red-600/30">
                    <div className="flex items-center justify-between">
                        {(sidebarOpen || showMobileOverlay) && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold">Blood Bank</h1>
                                    <p className="text-red-100 text-sm">Management System</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <User className="w-3 h-3" />
                                        <span className="text-xs">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Shield className="w-3 h-3" />
                                        <span className="text-xs capitalize">{user?.role}</span>
                                    </div>

                                    {/* Logout Button */}
                                    <button
                                        onClick={LogoutUser}
                                        className="mt-3 text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>

                        )}
                        <button onClick={toggleSidebar} className="text-white hover:bg-white/20 p-2 rounded-md transition-colors">
                            {isMobile ? (
                                showMobileOverlay ? (
                                    <X className="w-4 h-4" />
                                ) : (
                                    <Menu className="w-4 h-4" />
                                )
                            ) : sidebarOpen ? (
                                <ChevronLeft className="w-4 h-4" />
                            ) : (
                                <Menu className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Search */}
                {(sidebarOpen || showMobileOverlay) && (
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-200 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-red-600/30 rounded-md text-white placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                    </div>
                )}

                {/* Modules List */}
                <div className="flex-1 overflow-y-auto">
                    {sidebarOpen || showMobileOverlay ? (
                        <div className="p-2">
                            {filteredModules.map((module) => (
                                <div key={module.id}>
                                    <div
                                        onClick={() => handleModuleClick(module)}
                                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${pathname === module.href || module.subModules?.some((sub) => sub.href === pathname)
                                            ? "bg-white/20 text-white"
                                            : "hover:bg-white/10 text-red-100 hover:text-white"
                                            }`}
                                    >
                                        <div className="flex-shrink-0">{module.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{module.name}</span>
                                                {!hasPermission(userPermissions, module.permissions) && (
                                                    <Lock className="w-3 h-3 text-red-300" />
                                                )}
                                            </div>
                                            <div className="text-xs opacity-75 truncate">{module.description}</div>
                                        </div>
                                        {module.subModules && module.subModules.length > 0 && (
                                            <div className="transition-transform duration-200">
                                                {expandedModules.has(module.id) ? (
                                                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {module.subModules && module.subModules.length > 0 && (
                                        <div
                                            className={`overflow-hidden transition-all  duration-300 ease-in-out ${expandedModules.has(module.id) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="ml-8 mr-2 mb-2">
                                                {module.subModules.map((subModule, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleSubModuleClick(module, subModule)
                                                        }}
                                                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200 mb-1 ${pathname === subModule.href
                                                            ? "bg-white/30 text-white"
                                                            : "hover:bg-white/15 text-red-100 hover:text-white"
                                                            }`}
                                                    >
                                                        <div className="flex-shrink-0">{subModule.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex font-semibold items-center gap-2">
                                                                <span className="text-sm">{subModule.name}</span>
                                                                {!hasPermission(userPermissions, subModule.permissions) && (
                                                                    <Lock className="w-3 h-3 text-red-300" />
                                                                )}
                                                            </div>
                                                            <div className="text-xs opacity-75 truncate">{subModule.description}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-2">
                            {filteredModules.map((module) => (
                                <div
                                    key={module.id}
                                    onClick={() => handleModuleClick(module)}
                                    className={`group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 relative ${pathname === module.href || module.subModules?.some((sub) => sub.href === pathname)
                                        ? "bg-white/20 text-white"
                                        : "hover:bg-white/10 text-red-100 hover:text-white"
                                        }`}
                                    title={module.name}
                                >
                                    {module.icon}
                                    {!hasPermission(userPermissions, module.permissions) && (
                                        <Lock className="w-2 h-2 absolute top-1 right-1 text-red-300" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="bg-white border-b border-slate-200 p-4">
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
                                {selectedModule ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-md md:text-lg font-semibold text-slate-800 flex items-center gap-2"> <Link to={'/'} className="cursor-pointer"><FaHome /></Link> <ChevronRight className="text-slate-500 w-4 h-4" /> {selectedModule.name}</h1>
                                        {selectedSubModule && (
                                            <>
                                                <div className="font-bold"><ChevronRight className="text-slate-500 w-4 h-4" /></div>
                                                <span className="text-sm md:text-md font-semibold text-red-600">{selectedSubModule.name}</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <h1 className="text-lg md:text-xl font-semibold text-slate-800">Blood Bank Management System</h1>
                                )}
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
