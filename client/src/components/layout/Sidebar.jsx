import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  List,
  Plus,
  User,
  LogOut,
  Settings,
  Bell,
  FlaskConical,
  Delete,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/atoms/static';
import { FiUserPlus } from "react-icons/fi";
import { FaBoxOpen, FaChartPie, FaEye, FaHeart, FaListUl, FaMicroscope, FaTrash, FaUser, FaHospital } from "react-icons/fa";
import { SiPytest } from "react-icons/si";
import { GiCardDiscard, GiDrop , GiChemicalDrop , GiCampingTent } from "react-icons/gi";
import { IoIosSend } from "react-icons/io";
import { PiTestTubeFill } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { FaUsersCog } from "react-icons/fa";

const MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/dashboard",
    permissions: ["read"],
    description: "Operational analytics overview",
    always: true,
  },
    {
    id: "admin",
    name: "Admin",
    icon: <Shield className="w-5 h-5" />,
    permissions: ["admin"],
    subModules: [
      {
        name: "User Manage",
        href: "/admin/user-manage",
        permissions: ["admin"],
        description: "Manage users, roles, and permissions",
        icon: <Users className="w-5 h-5" />,
      }
    ],
    description: "Administration",
  },
  {
    id: "requisition",
    name: "Requisition",
    icon: <IoIosSend className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Manage",
        icon: <Plus className="w-5 h-5" />,
        href: "/requisition",
        permissions: ["write", "read"],
        description: "Create and manage requisitions",
      },
      {
        name: "List",
        icon: <List className="w-5 h-5" />,
        href: "/requisition/list",
        permissions: ["read"],
        description: "View and act on requisitions",
      },
    ],
    description: "Manage blood requests and orders",
  },
  {
    id: "hospital",
    name: "Hospital",
    icon: <FaHospital className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Add Hospital",
        icon: <Plus className="w-5 h-5" />,
        href: "/hospital/add",
        permissions: ["write", "read"],
        description: "Register new hospital",
      },
      {
        name: "List Hospital",
        icon: <List className="w-5 h-5" />,
        href: "/hospital/list",
        permissions: ["read"],
        description: "View all registered hospitals",
      },
    ],
    description: "Hospital management system",
  },
  {
    id: "camp",
    name: "Camp",
    icon: <GiCampingTent className="w-6 h-6" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Camp Registration",
        icon: <Plus className="w-5 h-5" />,
        href: "/camp-registration",
        permissions: ["write", "read"],
        description: "Register new blood donation camps",
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
    id: "donor",
    name: "Donor",
    icon: <FaUser className="w-5 h-5" />,
    href: "/donor",
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Create Donor",
        icon: <FiUserPlus className="w-5 h-5" />,
        href: "/donor/create-donor",
        permissions: ["read", "write"],
        description: "Create Donor",
      },
      {
        name: "View Donor",
        icon: <FaEye className="w-5 h-5" />,
        href: "/donor/view-donor",
        permissions: ["read", "write"],
        description: "View Donor",
      },
    ],
    description: "Manage donor records",
  },
  {
    id: "donations",
    name: "Donations",
    icon: <FaHeart className="w-5 h-5" />,
    href: "/donations",
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Create Donation",
        href: "/donations/create-donation",
        icon: <Plus className="w-5 h-5" />,
        permissions: ["read", "write"],
        description: "Create Donation",
      },
      {
        name: "View Donation",
        icon: <FaEye className="w-5 h-5" />,
        href: "/donations/view-donation",
        permissions: ["read", "write"],
        description: "View Donation",
      },
    ],
    description: "Track donation records",
  },
  {
    id: "component",
    name: "Component",
    icon: <SiPytest className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Components List",
        href: "/component/list",
        icon: <FaListUl className="w-5 h-5" />,
        permissions: ["read"],
        description: "View all blood components",
      },
      {
        name: "Separate",
        href: "/component/separate",
        icon: <PiTestTubeFill className="w-5 h-5" />,
        permissions: ["write"],
        description: "Separate blood components",
      },
      {
        name: "Near-Expiry",
        href: "/component/near-expiry",
        icon: <MdDelete className="w-5 h-5" />,
        permissions: ["read"],
        description: "View near-expiry components",
      },
    ],
    description: "Blood component processing",
  },
  {
    id: "labs",
    name: "Labs",
    icon: <FaMicroscope className="w-5 h-5" />,
    href: "/labs",
    permissions: ["read", "admin"],
    subModules: [
      {
        name: "Serology Results",
        href: "/labs/serology-results",
        permissions: ["read"],
        description: "View serology testing results",
        icon: <FaEye className="w-5 h-5" />,
      },
      {
        name: "Serology",
        href: "/labs/serology",
        permissions: ["write", "read"],
        description: "Enter serology results",
        icon: <FaMicroscope className="w-5 h-5" />,
      },
    ],
    description: "Laboratory testing",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: <FaBoxOpen className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Stock",
        href: "/inventory/stock",
        permissions: ["read", "write"],
        description: "Display current stock",
      },
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
    ],
    description: "Blood stock management",
  },
  {
    id: "discard",
    name: "Discard",
    icon: <FaTrash className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Discard List",
        href: "/discard",
        permissions: ["read", "write"],
        description: "View discarded blood units",
      },
    ],
    description: "Manage discarded blood units",
  },
  // {
  //   id: "queue",
  //   name: "Queue",
  //   icon: <FaUsersCog className="w-6 h-6" />,
  //   permissions: ["read", "write"],
  //   subModules: [
  //     {
  //       name: "Book",
  //       href: "/queue/book",
  //       permissions: ["write"],
  //       description: "Book donor appointments",
  //     },
  //     {
  //       name: "Queue List",
  //       href: "/queue/list",
  //       permissions: ["read"],
  //       description: "View donor queue",
  //     },
  //   ],
  //   description: "Donor queue management",
  // },
  {
    id: "mis",
    name: "MIS",
    icon: <FaChartPie className="w-5 h-5" />,
    permissions: ["read"],
    subModules: [
      {
        name: "Donor MIS",
        href: "/mis/donors",
        permissions: ["read"],
        description: "Donor master & monthly analytics",
        icon: <FaUser className="w-5 h-5" />,
      },
      {
        name: "Donation MIS",
        href: "/mis/donations",
        permissions: ["read"],
        description: "In-house vs camp donation analytics",
        icon: <FaHeart className="w-5 h-5" />,
      },
      {
        name: "Camp MIS",
        href: "/mis/camps",
        permissions: ["read"],
        description: "Camp-wise KPIs and rankings",
        icon: <GiCampingTent className="w-5 h-5" />,
      },
      {
        name: "Blood Bag MIS",
        href: "/mis/bags",
        permissions: ["read"],
        description: "Bag lifecycle & testing overview",
        icon: <GiDrop className="w-5 h-5" />,
      },
      {
        name: "Component MIS",
        href: "/mis/components",
        permissions: ["read"],
        description: "Component stock & near-expiry analytics",
        icon: <SiPytest className="w-5 h-5" />,
      },
      {
        name: "Inventory MIS",
        href: "/mis/inventory",
        permissions: ["read"],
        description: "Inventory status and hospital reservations",
        icon: <FaBoxOpen className="w-5 h-5" />,
      },
      {
        name: "Discard MIS",
        href: "/mis/discards",
        permissions: ["read"],
        description: "Discard reasons and wastage overview",
        icon: <GiCardDiscard className="w-5 h-5" />,
      },
      {
        name: "Testing MIS",
        href: "/mis/testing",
        permissions: ["read"],
        description: "Testing load & positivity",
        icon: <FaMicroscope className="w-5 h-5" />,
      },
      {
        name: "Exception MIS",
        href: "/mis/exceptions",
        permissions: ["read"],
        description: "Exception & audit trail analytics",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        name: "Regulatory MIS",
        href: "/mis/regulatory",
        permissions: ["read"],
        description: "Mandatory testing & compliance",
        icon: <GiChemicalDrop className="w-5 h-5" />,
      },
      {
        name: "Executive Dashboard",
        href: "/mis/executive",
        permissions: ["read"],
        description: "Top-level MIS KPIs",
        icon: <BarChart3 className="w-5 h-5" />,
      },
    ],
    description: "Management Information System",
  },
  // {
  //   id: "report",
  //   name: "Report",
  //   icon: <FaChartPie className="w-5 h-5" />,
  //   permissions: ["read", "admin"],
  //   subModules: [
  //     {
  //       name: "Daily",
  //       href: "/report/daily",
  //       permissions: ["read"],
  //       description: "Daily reports",
  //     },
  //     {
  //       name: "Expiry",
  //       href: "/report/expiry",
  //       permissions: ["read"],
  //       description: "Expiry reports",
  //     },
  //     {
  //       name: "Audit",
  //       href: "/report/audit",
  //       permissions: ["admin"],
  //       description: "Audit reports",
  //     },
  //   ],
  //   description: "Analytics and reporting",
  // },

];

// Access helper wrappers around user.permissions
const canViewModule = (user, moduleName) => checkAccess(user, moduleName, 'view');
const canCreateInModule = (user, moduleName) => checkAccess(user, moduleName, 'create');
const canUpdateInModule = (user, moduleName) => checkAccess(user, moduleName, 'update');
const canDeleteInModule = (user, moduleName) => checkAccess(user, moduleName, 'delete');

const Sidebar = ({
  isOpen,
  onToggle,
  isMobile,
  showMobileOverlay,
  onCloseMobile
}) => {
  const { user, LogoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State declarations with proper initialization
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState(() => new Set());
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedSubModule, setSelectedSubModule] = useState(null);
  const [tempOpenForSubmodule, setTempOpenForSubmodule] = useState(false);

  // Memoize filtered modules to prevent unnecessary re-renders
  const filteredModules = useMemo(() =>
    MODULES.filter(
      (module) =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (module.always || canViewModule(user, module.name))
    ),
    [searchQuery, user]
  );

  // Set current module and submodule based on location
  useEffect(() => {
    const currentModule = MODULES.find((module) => {
      if (module.href === location.pathname) return true;
      return module.subModules?.some((sub) => sub.href === location.pathname);
    });

    if (currentModule) {
      setSelectedModule(currentModule);
      const currentSubModule = currentModule.subModules?.find((sub) => sub.href === location.pathname);
      setSelectedSubModule(currentSubModule || null);

      if (currentSubModule) {
        setExpandedModules((prev) => {
          const newSet = new Set(prev);
          newSet.add(currentModule.id);
          return newSet;
        });
      }
    }
  }, [location.pathname]);

  // Handle module click with sidebar auto-open for submodules
  const handleModuleClick = useCallback((module) => {
    if (!module.always && !canViewModule(user, module.name)) {
      toast.error("ACCESS DENIED!!", {
        description: "You don't have permission to access this section"
      });
      return;
    }

    // If sidebar is closed and module has submodules, open sidebar temporarily
    if (!isOpen && module.subModules && module.subModules.length > 0) {
      setTempOpenForSubmodule(true);
      // Expand the module to show submodules
      setExpandedModules((prev) => {
        const newExpanded = new Set(prev);
        newExpanded.add(module.id);
        return newExpanded;
      });
      return;
    }

    // Normal behavior when sidebar is open
    if (module.subModules && module.subModules.length > 0) {
      setExpandedModules((prev) => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(module.id)) {
          newExpanded.delete(module.id);
        } else {
          newExpanded.add(module.id);
        }
        return newExpanded;
      });
    } else if (module.href) {
      navigate(module.href);
      if (isMobile) {
        onCloseMobile();
      }
      // Close temporary sidebar if it was opened for submodules
      setTempOpenForSubmodule(false);
    }
  }, [user, navigate, isMobile, onCloseMobile, isOpen]);

  const handleSubModuleClick = useCallback((module, subModule) => {
    // Default to requiring view access for submodules unless always allowed
    if (!module.always && !canViewModule(user, module.name)) {
      toast.error("ACCESS DENIED!!", {
        description: "You don't have permission to access this section"
      });
      return;
    }

    navigate(subModule.href);
    if (isMobile) {
      onCloseMobile();
    }
    // Close temporary sidebar after submodule selection
    setTempOpenForSubmodule(false);
  }, [user, navigate, isMobile, onCloseMobile]);

  // Close temporary sidebar when clicking outside or when main sidebar is toggled open
  useEffect(() => {
    if (isOpen && tempOpenForSubmodule) {
      setTempOpenForSubmodule(false);
    }
  }, [isOpen, tempOpenForSubmodule]);

  const isActive = useCallback((href) => location.pathname === href, [location.pathname]);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    LogoutUser();
  }, [LogoutUser]);

  // Memoized search handler
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Determine if sidebar should be displayed as open
  const shouldDisplayOpen = isOpen || tempOpenForSubmodule;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && showMobileOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile
            ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-all duration-300 ease-in-out ${showMobileOverlay ? "translate-x-0" : "-translate-x-full"
            }`
            : `${shouldDisplayOpen ? "w-80" : "w-16"} h-full transition-all duration-300 ease-in-out`
          } 
          bg-gradient-to-br from-red-900 via-red-800 to-red-900 
          text-white flex flex-col shadow-2xl border-r border-red-700/30
        `}
      >
        {/* Fixed Header Section */}
        <div className="flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-red-700/30 bg-red-800/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              {shouldDisplayOpen && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                      <GiDrop className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-white">Blood Bank</h1>
                    <p className="text-red-100 text-sm font-medium">Sanjivani, Kopargoan</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-red-200" />
                        <span className="text-xs text-red-100 truncate">{user?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-red-200" />
                      <span className="text-xs text-red-100 capitalize">{user?.role}</span>
                    </div>
                  </div>
                </div>
              )}
              {!shouldDisplayOpen && !isMobile && (
                <div className="flex justify-center w-full">
                  <div className="relative">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                      <GiDrop className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          {shouldDisplayOpen && (
            <div className="p-4 border-b border-red-700/30">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-300 w-4 h-4 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-red-600/30 rounded-xl text-white placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-200 backdrop-blur-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 scrollbar-none overflow-y-auto">
          <div className={`p-4 space-y-2 ${!shouldDisplayOpen && !isMobile ? "flex flex-col items-center" : ""}`}>
            {filteredModules.map((module) => (
              <div key={module.id} className={`${shouldDisplayOpen ? "group w-full" : "w-full flex justify-center"}`}>
                {/* Main Module */}
                <div
                  onClick={() => handleModuleClick(module)}
                  className={`
                    ${shouldDisplayOpen
                      ? "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 w-full"
                      : "flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 w-12 h-12"
                    }
                    ${isActive(module.href) || module.subModules?.some((sub) => isActive(sub.href))
                      ? "bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/20"
                      : "hover:bg-white/20 text-red-100 hover:text-white hover:shadow-md"
                    }
                    ${shouldDisplayOpen ? "group-hover:scale-[1.02]" : "hover:scale-105"} transform hover:border hover:border-white/20
                  `}
                  title={!shouldDisplayOpen ? module.name : ""}
                >
                  <div className={`flex-shrink-0 ${shouldDisplayOpen ? "p-1" : ""}`}>
                    {module.icon}
                  </div>
                  {shouldDisplayOpen && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{module.name}</span>
                          {!canViewModule(user, module.name) && (
                            <Lock className="w-3 h-3 text-red-300" />
                          )}
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
                      <div className="text-xs opacity-80 truncate">{module.description}</div>
                    </div>
                  )}
                  {!shouldDisplayOpen && !canViewModule(user, module.name) && (
                    <Lock className="w-2 h-2 absolute top-1 right-1 text-red-300" />
                  )}
                </div>

                {/* Sub Modules */}
                {module.subModules && module.subModules.length > 0 && shouldDisplayOpen && (
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expandedModules.has(module.id)
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                      }
                    `}
                  >
                    <div className="ml-6 mr-2 space-y-1">
                      {module.subModules.map((subModule, index) => (
                        <div
                          key={`${module.id}-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubModuleClick(module, subModule);
                          }}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                            ${isActive(subModule.href)
                              ? "bg-white/30 text-white shadow-md backdrop-blur-sm border border-white/30"
                              : "hover:bg-white/25 text-red-100 hover:text-white hover:shadow-md"
                            }
                            hover:scale-[1.01] transform hover:border hover:border-white/20
                          `}
                        >
                          <div className="flex-shrink-0 p-1">
                            {subModule.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{subModule.name}</span>
                              {!canViewModule(user, module.name) && (
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
        </div>

        {/* Fixed Footer Section */}
        <div className="flex-shrink-0 border-t border-red-700/30 bg-red-800/20 backdrop-blur-sm">
          <div className={`${shouldDisplayOpen ? "p-4" : "p-2"}`}>
            <button
              onClick={handleLogout}
              className={`
                ${shouldDisplayOpen
                  ? "w-full flex items-center gap-3 p-3 text-red-100 hover:text-white hover:bg-red-700/30 rounded-lg"
                  : "w-full flex items-center justify-center p-3 text-red-100 hover:text-white hover:bg-red-700/30 rounded-lg"
                }
                transition-all cursor-pointer duration-200 group hover:shadow-md hover:border hover:border-white/20
              `}
              title={!shouldDisplayOpen ? "Logout" : ""}
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {shouldDisplayOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Sidebar);