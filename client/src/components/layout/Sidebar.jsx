import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/store/auth';

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
    icon: <User className="w-5 h-5" />,
    href: "/donor",
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Create Donor",
        href: "/donor/create-donor",
        permissions: ["read", "write"],
        description: "Create Donor",
      },
      {
        name: "View Donor",
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
    icon: <Heart className="w-5 h-5" />,
    href: "/donations",
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Create Donation",
        href: "/donations/create-donation",
        permissions: ["read", "write"],
        description: "Create Donation",
      },
      {
        name: "View Donation",
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
    icon: <TestTube className="w-5 h-5" />,
    permissions: ["read", "write"],
    subModules: [
      {
        name: "Components List",
        href: "/component/list",
        permissions: ["read"],
        description: "View all blood components",
      },
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
    id: "labs",
    name: "Labs",
    icon: <Microscope className="w-5 h-5" />,
    href: "/labs",
    permissions: ["read", "admin"],
    description: "Laboratory testing",
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
      {
        name: "Stock",
        href: "/inventory/stock",
        permissions: ["read", "write"],
        description: "Display current stock",
      },
    ],
    description: "Blood stock management",
  },
  {
    id: "discard",
    name: "Discard",
    icon: <Edit className="w-5 h-5" />,
    permissions: ["read", "write"],
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
];

const getUserPermissions = (role) => {
  switch (role) {
    case "admin":
      return ["read", "write", "admin"];
    case "doctor":
      return ["read", "write"];
    case "nurse":
      return ["read", "write"];
    case "technician":
      return ["read"];
    default:
      return ["read"];
  }
};

const hasPermission = (userPermissions, requiredPermissions) => {
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedSubModule, setSelectedSubModule] = useState(null);

  const userPermissions = getUserPermissions(user?.role);

  useEffect(() => {
    const currentModule = modules.find((module) => {
      if (module.href === location.pathname) return true;
      return module.subModules?.some((sub) => sub.href === location.pathname);
    });

    if (currentModule) {
      setSelectedModule(currentModule);
      const currentSubModule = currentModule.subModules?.find((sub) => sub.href === location.pathname);
      setSelectedSubModule(currentSubModule || null);

      if (currentSubModule) {
        setExpandedModules((prev) => new Set([...prev, currentModule.id]));
      }
    }
  }, [location.pathname]);

  const filteredModules = modules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      hasPermission(userPermissions, module.permissions)
  );

  const handleModuleClick = (module) => {
    if (!hasPermission(userPermissions, module.permissions)) {
      toast.error("ACCESS DENIED!!", {
        description: "You don't have permission to access this section"
      });
      return;
    }

    if (module.subModules && module.subModules.length > 0) {
      const newExpanded = new Set(expandedModules);
      if (newExpanded.has(module.id)) {
        newExpanded.delete(module.id);
      } else {
        newExpanded.add(module.id);
      }
      setExpandedModules(newExpanded);
    } else if (module.href) {
      navigate(module.href);
      if (isMobile) {
        onCloseMobile();
      }
    }
  };

  const handleSubModuleClick = (module, subModule) => {
    if (!hasPermission(userPermissions, subModule.permissions)) {
      toast.error("ACCESS DENIED!!", {
        description: "You don't have permission to access this section"
      });
      return;
    }

    navigate(subModule.href);
    if (isMobile) {
      onCloseMobile();
    }
  };

  const isActive = (href) => location.pathname === href;

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
            ? `fixed left-0 top-0 h-full w-80 z-50 transform transition-all duration-300 ease-in-out ${
                showMobileOverlay ? "translate-x-0" : "-translate-x-full"
              }`
            : `${isOpen ? "w-80" : "w-16"} transition-all duration-300 ease-in-out`
          } 
          bg-gradient-to-br from-red-900 via-red-800 to-red-900 
          text-white flex flex-col shadow-2xl border-r border-red-700/30
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-red-700/30 bg-red-800/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {isOpen && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white">Blood Bank</h1>
                  <p className="text-red-100 text-sm font-medium">Management System</p>
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
            <button 
              onClick={onToggle} 
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              {isMobile ? (
                showMobileOverlay ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />
              ) : isOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        {isOpen && (
          <div className="p-4 border-b border-red-700/30">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-300 w-4 h-4 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-red-600/30 rounded-xl text-white placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all duration-200 backdrop-blur-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-2">
              {filteredModules.map((module) => (
                <div key={module.id} className="group">
                  {/* Main Module */}
                  <div
                    onClick={() => handleModuleClick(module)}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2
                      ${isActive(module.href) || module.subModules?.some((sub) => isActive(sub.href))
                        ? "bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/20"
                        : "hover:bg-white/15 text-red-100 hover:text-white hover:shadow-md"
                      }
                      group-hover:scale-[1.02] transform
                    `}
                  >
                    <div className="flex-shrink-0 p-1">
                      {module.icon}
                    </div>
                    {isOpen && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{module.name}</span>
                          {!hasPermission(userPermissions, module.permissions) && (
                            <Lock className="w-3 h-3 text-red-300" />
                          )}
                        </div>
                        <div className="text-xs opacity-80 truncate">{module.description}</div>
                      </div>
                    )}
                    {module.subModules && module.subModules.length > 0 && isOpen && (
                      <div className="transition-transform duration-200">
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sub Modules */}
                  {module.subModules && module.subModules.length > 0 && isOpen && (
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
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubModuleClick(module, subModule);
                            }}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                              ${isActive(subModule.href)
                                ? "bg-white/30 text-white shadow-md backdrop-blur-sm border border-white/30"
                                : "hover:bg-white/20 text-red-100 hover:text-white"
                              }
                              hover:scale-[1.01] transform
                            `}
                          >
                            <div className="flex-shrink-0 p-1">
                              {subModule.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{subModule.name}</span>
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
          </div>
        </div>

        {/* Sidebar Footer */}
        {isOpen && (
          <div className="p-4 border-t border-red-700/30 bg-red-800/20 backdrop-blur-sm">
            <div className="space-y-2">
              <button
                onClick={LogoutUser}
                className="w-full flex items-center gap-3 p-3 text-red-100 hover:text-white hover:bg-red-700/30 rounded-lg transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed State Icons */}
        {!isOpen && (
          <div className="p-2 space-y-2">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`
                  group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 relative
                  ${isActive(module.href) || module.subModules?.some((sub) => isActive(sub.href))
                    ? "bg-white/25 text-white shadow-lg"
                    : "hover:bg-white/15 text-red-100 hover:text-white"
                  }
                  hover:scale-105 transform
                `}
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
    </>
  );
};

export default Sidebar;
