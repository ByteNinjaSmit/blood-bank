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

// Placeholder component for modules
const ModulePlaceholder = ({ title, description, icon: Icon, buttonText, buttonIcon: ButtonIcon }) => (
  <div className="w-full space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button className="w-full sm:w-auto">
          <ButtonIcon className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </div>
    </div>
    
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-center text-muted-foreground max-w-sm mx-auto">
        {description}. This module is currently under development.
      </p>
    </div>
  </div>
);

const App = () => {
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SidebarProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/donor/*" element={<DonorManagement />} />
                  <Route 
                    path="/lab/*" 
                    element={
                      <ModulePlaceholder
                        title="Lab & Testing"
                        description="Manage blood testing procedures, record test results, and track sample status"
                        icon={TestTube}
                        buttonText="New Test Entry"
                        buttonIcon={Plus}
                      />
                    } 
                  />
                  <Route 
                    path="/hospital/*" 
                    element={
                      <ModulePlaceholder
                        title="Hospital Requests"
                        description="Manage blood requests from hospitals, track deliveries, and maintain hospital relationships"
                        icon={Building2}
                        buttonText="New Request"
                        buttonIcon={Plus}
                      />
                    } 
                  />
                  <Route 
                    path="/inventory/*" 
                    element={
                      <ModulePlaceholder
                        title="Inventory Management"
                        description="Track blood inventory levels, manage expiry dates, and optimize stock distribution"
                        icon={Package}
                        buttonText="Add Inventory"
                        buttonIcon={Plus}
                      />
                    } 
                  />
                  <Route 
                    path="/reports/*" 
                    element={
                      <ModulePlaceholder
                        title="Reports & Analytics"
                        description="Generate reports, analyze trends, and make data-driven decisions for your blood bank operations"
                        icon={FileText}
                        buttonText="Export Reports"
                        buttonIcon={Download}
                      />
                    } 
                  />
                  <Route 
                    path="/upload/*" 
                    element={
                      <ModulePlaceholder
                        title="Bulk Upload"
                        description="Upload and import data in bulk from CSV, Excel, or other formats to quickly populate your system"
                        icon={Upload}
                        buttonText="Upload File"
                        buttonIcon={Upload}
                      />
                    } 
                  />
                  <Route 
                    path="/settings/*" 
                    element={
                      <ModulePlaceholder
                        title="Settings"
                        description="Configure system settings, manage user accounts, and customize the application to suit your needs"
                        icon={Settings}
                        buttonText="Add User"
                        buttonIcon={UserPlus}
                      />
                    } 
                  />
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