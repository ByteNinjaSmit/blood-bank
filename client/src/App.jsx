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
                  <Route path="/lab/*" element={
          <div className="h-full w-full space-y-6 animate-fade-in flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Lab & Testing</h1>
                <p className="text-muted-foreground">Manage blood testing and lab results</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Test Entry
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
              <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                <TestTube className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
              </div>
              <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Lab Module</h2>
              <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                This module allows you to manage blood testing procedures, record test results, and track sample status.
              </p>
            </div>
          </div>
        } />
                  <Route path="/hospital/*" element={<div className="h-full w-full space-y-6 animate-fade-in flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Hospital Requests</h1>
                        <p className="text-muted-foreground">Manage blood requests from hospitals and clinics</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          New Request
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
                      <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                      </div>
                      <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Hospital Requests Module</h2>
                      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                        This module allows you to manage blood requests from hospitals, track deliveries, and maintain hospital relationships.
                      </p>
                    </div>
                  </div>} />
                  <Route path="/inventory/*" element={<div className="h-full w-full space-y-6 animate-fade-in flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-muted-foreground">Track blood units, expiry dates, and inventory levels</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Inventory
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
                      <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                        <Package className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                      </div>
                      <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Inventory Management Module</h2>
                      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                        This module allows you to track blood inventory levels, manage expiry dates, and optimize stock distribution.
                      </p>
                    </div>
                  </div>} />
                  <Route path="/reports/*" element={<div className="h-full w-full space-y-6 animate-fade-in flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                        <p className="text-muted-foreground">Generate reports and analyze blood bank operations</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                          <Download className="h-4 w-4 mr-2" />
                          Export Reports
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
                      <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                      </div>
                      <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Reports & Analytics Module</h2>
                      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                        This module allows you to generate reports, analyze trends, and make data-driven decisions for your blood bank operations.
                      </p>
                    </div>
                  </div>} />
                  <Route path="/upload/*" element={<div className="h-full w-full space-y-6 animate-fade-in flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload</h1>
                        <p className="text-muted-foreground">Upload and import data in bulk</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
                      <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                      </div>
                      <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Bulk Upload Module</h2>
                      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                        This module allows you to upload and import data in bulk from CSV, Excel, or other formats to quickly populate your system.
                      </p>
                    </div>
                  </div>} />
                  <Route path="/settings/*" element={<div className="h-full w-full space-y-6 animate-fade-in flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Configure system settings and user accounts</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8 text-center animate-in fade-in-50">
                      <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
                        <Settings className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                      </div>
                      <h2 className="mt-4 sm:mt-6 text-xl font-semibold">Settings Module</h2>
                      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
                        This module allows you to configure system settings, manage user accounts, and customize the application to suit your needs.
                      </p>
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