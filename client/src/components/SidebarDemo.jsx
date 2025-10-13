import React, { useState } from 'react';
import { Heart, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import '@/components/layout/Sidebar.css';

const SidebarDemo = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setShowMobileOverlay(!showMobileOverlay);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeMobileOverlay = () => {
    setShowMobileOverlay(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex relative">
      {/* Demo Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        showMobileOverlay={showMobileOverlay}
        onCloseMobile={closeMobileOverlay}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-600" />
                  <span>Beautiful Sidebar Demo</span>
                </h1>
                <p className="text-slate-600 mt-1">Custom scroll design with modern UI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  Modern Sidebar Design
                </h2>
                <p className="text-slate-600 text-lg">
                  Beautiful, responsive sidebar with custom scroll design
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">✨ Features</h3>
                  <ul className="space-y-2 text-red-700">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Custom scrollbar design
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Smooth animations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Mobile responsive
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Modern gradient design
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">🎨 Design</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Glass morphism effects
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Hover animations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Backdrop blur
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Shadow effects
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">📱 Responsive Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600 font-bold">D</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">Desktop</h4>
                    <p className="text-sm text-slate-600">Full sidebar with all features</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-orange-600 font-bold">T</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">Tablet</h4>
                    <p className="text-sm text-slate-600">Collapsible sidebar</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-bold">M</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">Mobile</h4>
                    <p className="text-sm text-slate-600">Overlay sidebar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarDemo;
