import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { Button } from "./components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LandingPage from "./pages/landing/LandingPage";
import Dashboard from "./pages/dashboard/Dashboard";
import DonorManagement from "./pages/donor/DonorManagement";
import NotFound from "./NotFound";
import { Suspense } from "react";
import { SidebarProvider } from "./components/ui/sidebar";
import {
  TestTube,
  Building2,
  Package,
  FileText,
  Upload,
  Settings,
  Plus,
  UserPlus,
  Download
} from "lucide-react";

console.log('App.jsx is executing');

const queryClient = new QueryClient();
console.log('QueryClient created');

const App = () => {
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SidebarProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/donor/*" element={<DonorManagement />} />
                  <Route path="/lab/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Lab & Testing</h1>
                        <p className="text-muted-foreground">Manage blood sample testing and quality control</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <TestTube className="mr-2 h-4 w-4" />
                        New Test Entry
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <TestTube className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Lab & Testing Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will allow you to manage blood sample testing, track test results, and ensure quality control.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">Setup Lab Parameters</Button>
                      </div>
                    </div>
                  </div>} />
                  <Route path="/hospital/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Hospital Requests</h1>
                        <p className="text-muted-foreground">Manage blood requests and track fulfillment status</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        New Request
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <Building2 className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Hospital Requests Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will allow you to manage blood requests from hospitals, track fulfillment status, and prioritize emergency needs.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">Register New Hospital</Button>
                      </div>
                    </div>
                  </div>} />
                  <Route path="/inventory/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                        <p className="text-muted-foreground">Track blood units and monitor expiration dates</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Inventory
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <Package className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Inventory Management Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will allow you to track blood units, manage storage locations, and monitor expiration dates.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">Configure Storage</Button>
                      </div>
                    </div>
                  </div>} />
                  <Route path="/reports/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Reports</h1>
                        <p className="text-muted-foreground">Comprehensive reporting and analytics</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Download className="mr-2 h-4 w-4" />
                        Export Reports
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <FileText className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Reports Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will provide comprehensive reporting on donations, inventory, usage patterns, and more.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">Generate Report</Button>
                      </div>
                    </div>
                  </div>} />
                  <Route path="/upload/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Bulk Upload</h1>
                        <p className="text-muted-foreground">Import data in bulk from CSV or Excel files</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <Upload className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Bulk Upload Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will allow you to import data in bulk from CSV or Excel files to quickly populate your database.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">Download Template</Button>
                      </div>
                    </div>
                  </div>} />
                  <Route path="/settings/*" element={<div className="h-full w-full space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Configure system settings and manage user accounts</p>
                      </div>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                    <div className="flex-1 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center p-12">
                      <Settings className="h-16 w-16 text-gray-400 mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Settings Module</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">This module will allow you to configure system settings, manage user accounts, and customize your experience.</p>
                      <div className="flex gap-4">
                        <Button variant="outline">View Documentation</Button>
                        <Button variant="default">System Preferences</Button>
                      </div>
                    </div>
                  </div>} />
                </Route>
                {/* Catch all route for 404 pages */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;