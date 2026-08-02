import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronRight, ChevronDown, Shield, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/store/auth';
import useAccess from '@/features/access/useAccess';
import { findPageByRoute } from '@/config/access-registry';
import { GiDrop } from 'react-icons/gi';
import { MODULES } from './nav-modules';

// nav-modules.jsx's ids predate the canonical access-registry module ids —
// this maps the (cosmetic) sidebar structure onto the real registry so the
// sidebar's view-gating uses the same module/page permission resolution as
// everywhere else, instead of the old flat ModuleArray-keyed checkAccess().
const NAV_ID_TO_REGISTRY_MODULE = {
  dashboard: 'dashboard',
  requisition: 'requisition',
  hospital: 'hospital',
  camp: 'camp',
  component: 'component',
  labs: 'labs',
  inventory: 'inventory',
  'master-register': 'donor',
  procurement: 'bag-procurement',
  'chemical-inventory': 'chemical-inventory',
  appointments: 'appointment',
  discard: 'discard',
  'audit-trail': 'audit',
  admin: 'admin',
  mis: 'mis',
  'recycle-bin': 'mis',
};

const Sidebar = ({
  isOpen,
  isMobile,
  showMobileOverlay,
  onCloseMobile
}) => {
  const { user, LogoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { canViewModule: canViewRegistryModule, canViewPage } = useAccess();

  const canViewModule = useCallback(
    (_user, moduleId) => {
      const registryId = NAV_ID_TO_REGISTRY_MODULE[moduleId];
      return registryId ? canViewRegistryModule(registryId) : false;
    },
    [canViewRegistryModule],
  );

  // Per-item gate: resolves a nav href to its actual registry page (via
  // route match) and checks that page's own view permission, instead of
  // the module-wide `canViewModule` above — a module having *some* visible
  // page must not make every one of its sibling submodules render too.
  // Falls back to visible for hrefs with no registry entry (nothing to
  // gate on) rather than hiding something we haven't audited.
  const canViewHref = useCallback(
    (href) => {
      if (!href) return true;
      const match = findPageByRoute(href);
      if (!match) return true;
      return canViewPage(match.moduleId, match.pageId);
    },
    [canViewPage],
  );

  // Which of a module's subModules the current user can actually open —
  // the module header itself is only shown once this is non-empty (see
  // filteredModules below), so a module never renders as an empty,
  // all-locked expandable group.
  const visibleSubModules = useCallback(
    (module) => (module.subModules ? module.subModules.filter((sub) => canViewHref(sub.href)) : null),
    [canViewHref],
  );

  // State declarations with proper initialization
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState(() => new Set());
  const [, setSelectedModule] = useState(null);
  const [, setSelectedSubModule] = useState(null);
  const [tempOpenForSubmodule, setTempOpenForSubmodule] = useState(false);

  // Memoize filtered modules to prevent unnecessary re-renders. A grouped
  // module (has subModules) is shown only if at least one of its actual
  // nav items is visible; a standalone module (no subModules, just its own
  // href) is gated directly on that href's page permission.
  const filteredModules = useMemo(() =>
    MODULES.filter((module) => {
      if (!module.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (module.always) return true;
      if (module.subModules && module.subModules.length > 0) {
        return visibleSubModules(module).length > 0;
      }
      return canViewHref(module.href);
    }),
    [searchQuery, canViewHref, visibleSubModules]
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
    if (!module.always && !canViewModule(user, module.id)) {
      toast.error("ACCESS DENIED!!", {
        description: "You don't have permission to access this section"
      });
      return;
    }

    // If sidebar is closed and module has submodules, open sidebar temporarily.
    // Desktop-only: on mobile the drawer is either fully open or hidden (driven
    // by showMobileOverlay, not isOpen), so this temp-open/icon-rail behavior
    // doesn't apply — falling through lets the normal expand/collapse toggle
    // below handle mobile submodule clicks instead.
    if (!isMobile && !isOpen && module.subModules && module.subModules.length > 0) {
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
  }, [user, navigate, isMobile, onCloseMobile, isOpen, canViewModule]);

  const handleSubModuleClick = useCallback((module, subModule) => {
    // Default to requiring view access for submodules unless always allowed
    if (!module.always && !canViewModule(user, module.id)) {
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
  }, [user, navigate, isMobile, onCloseMobile, canViewModule]);

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

  // Determine if sidebar should be displayed as open. On mobile the drawer's
  // open/closed state is driven entirely by showMobileOverlay (isOpen stays
  // false the whole time on mobile — see Master-Layout) — using isOpen here
  // would leave the drawer stuck rendering its collapsed icon-rail content
  // even while visually slid into view.
  const shouldDisplayOpen = isMobile ? showMobileOverlay : (isOpen || tempOpenForSubmodule);

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
                    <h1 className="text-xl font-bold text-white">Sanjivani Blood Bank</h1>
                    <p className="text-red-100 text-sm font-medium">Kopargoan</p>
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
                </div>

                {/* Sub Modules */}
                {module.subModules && module.subModules.length > 0 && shouldDisplayOpen && (
                  <div
                    className={`
                      transition-all duration-300 ease-in-out
                      ${expandedModules.has(module.id)
                        ? `max-h-[28rem] opacity-100 overflow-y-auto ${module.id === "mis" ? "scrollbar-sleek-red" : "scrollbar-none"}`
                        : "max-h-0 opacity-0 overflow-hidden"
                      }
                    `}
                  >
                    <div className="ml-6 mr-2 space-y-1">
                      {visibleSubModules(module).map((subModule, index) => (
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

export default memo(Sidebar);