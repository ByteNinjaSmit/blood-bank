import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthenticatedRoute } from './components/auth/Authentic-Routes';
import { useAuth } from './store/auth';
import ScrollToTop from './features/dashboard/pages/layout/ScrollToTop';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Auth
import LoginPage from './features/auth/pages/Login-Page';
import RegisterPage from './features/auth/pages/Registration-Page';

// Dashboard
import MasterLayout from './features/dashboard/pages/layout/Master-Layout';
import Home from './page/Home';
import Dashboard from './features/dashboard/pages/Dashboard';

// Camp
import CampRegistration from './features/camp/pages/Camp-Registration';
import CampListing from './features/camp/pages/Camp-Listing';
import CampDetails from './features/camp/pages/CampDetails';
import CampVolunteerList from './features/camp/pages/CampVolunteerList';
import CampDonorManagement from './features/camp/pages/CampDonorManagement';
import CampDonationManagement from './features/camp/pages/CampDonationManagement';
import CampReports from './features/camp/pages/CampReports';

// Component
import { ComponentsList, ComponentSeparate, NearExpiry } from './features/component/pages';
import ViewDiscarded from './features/discard/components/View-Discarded';

// Inventory
import Stock from './features/inventory/pages/Stock';
import Reserve from './features/inventory/pages/Reserve';
import ReserveWizard from './features/inventory/pages/ReserveWizard';
import Issue from './features/inventory/pages/Issue';
import InventoryNearExpiry from './features/inventory/pages/NearExpiry';

// Serology
import Serology from './features/serology/pages/Serology';
import SerologyResults from './features/serology/pages/SerologyResults';

// Donation + Donor
import CreateDonation from './features/donation/components/Create-Donation';
import DonationManagement from './features/donation/pages/DonationManagement';
import DonorManagement from './features/donor/pages/DonorManagement';
import CreateDonorPage from './features/donor/pages/CreateDonor';
import MasterDonors from './features/donor/pages/MasterDonors';
import MasterDonations from './features/donation/pages/MasterDonations';

// User + Hospital
import UserManage from './features/user/pages/UserManage';
import { AddHospital, ListHospital } from './features/hospital/pages';

// Bag Procurement
import PurchaseOrders from './features/bag-procurement/pages/PurchaseOrders';
import GoodsReceipt from './features/bag-procurement/pages/GoodsReceipt';
import BagInventory from './features/bag-procurement/pages/BagInventory';
import BagInspection from './features/bag-procurement/pages/BagInspection';
import BagIssuance from './features/bag-procurement/pages/BagIssuance';
import BagDiscard from './features/bag-procurement/pages/BagDiscard';

// Chemical Reagents Inventory
import ChemicalDashboard from './features/chemical-inventory/pages/ChemicalDashboard';
import ChemicalMaster from './features/chemical-inventory/pages/ChemicalMaster';
import Suppliers from './features/chemical-inventory/pages/Suppliers';
import Manufacturers from './features/chemical-inventory/pages/Manufacturers';
import PurchaseEntry from './features/chemical-inventory/pages/PurchaseEntry';
import StockUsage from './features/chemical-inventory/pages/StockUsage';
import ExpiryMonitoring from './features/chemical-inventory/pages/ExpiryMonitoring';
import Reports from './features/chemical-inventory/pages/Reports';
import AuditHistory from './features/chemical-inventory/pages/AuditHistory';

// Requisition
import RequisitionManagement from './features/requisition/pages/RequisitionManagement';
import RequisitionList from './features/requisition/pages/RequisitionList';

// Appointment
import AppointmentList from './features/appointment/pages/AppointmentList';

// MIS
import DonorMIS from './features/mis/pages/DonorMIS';
import DonationMIS from './features/mis/pages/DonationMIS';
import CampMIS from './features/mis/pages/CampMIS';
import BagMIS from './features/mis/pages/BagMIS';
import ComponentMIS from './features/mis/pages/ComponentMIS';
import InventoryMIS from './features/mis/pages/InventoryMIS';
import IssueMIS from './features/mis/pages/IssueMIS';
import DiscardMIS from './features/mis/pages/DiscardMIS';
import TestingMIS from './features/mis/pages/TestingMIS';
import ExceptionMIS from './features/mis/pages/ExceptionMIS';
import RegulatoryMIS from './features/mis/pages/RegulatoryMIS';
import ExecutiveMIS from './features/mis/pages/ExecutiveMIS';

// Error
import NotFound from './page/Error-Page';

const NO_SHELL = ['/login', '/register', '/forgot-password', '/reset-password'];

const App = () => {
  const pathname = useLocation().pathname;
  const { isLoading } = useAuth();
  const hideShell = NO_SHELL.includes(pathname);

  return (
    <div>
      <ScrollToTop />
      {!hideShell && <Navbar />}
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <AuthenticatedRoute>
            <MasterLayout />
          </AuthenticatedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Camp */}
          <Route path="camp-registration" element={<CampRegistration />} />
          <Route path="camp-details" element={<CampDetails />} />
          <Route path="camp-listing" element={<CampListing />} />
          <Route path="camp-donors" element={<CampDonorManagement />} />
          <Route path="camp-donation" element={<CampDonationManagement />} />
          <Route path="camp-reports" element={<CampReports />} />
          <Route path="camp-volunteers" element={<CampVolunteerList />} />

          {/* Component */}
          <Route path="component/list" element={<ComponentsList />} />
          <Route path="component/separate" element={<ComponentSeparate />} />
          <Route path="component/near-expiry" element={<NearExpiry />} />
          <Route path="discard" element={<ViewDiscarded />} />

          {/* Inventory */}
          <Route path="inventory/stock" element={<Stock />} />
          <Route path="inventory/reserve" element={<Reserve />} />
          <Route path="inventory/reserve/new" element={<ReserveWizard />} />
          <Route path="inventory/issue" element={<Issue />} />
          <Route path="inventory/near-expiry" element={<InventoryNearExpiry />} />

          <Route path="procurement/po" element={<PurchaseOrders />} />
          <Route path="procurement/grn" element={<GoodsReceipt />} />
          <Route path="procurement/inspection" element={<BagInspection />} />
          <Route path="procurement/issue" element={<BagIssuance />} />
          <Route path="procurement/discard" element={<BagDiscard />} />
          <Route path="procurement/inventory" element={<BagInventory />} />

          {/* Chemical Inventory */}
          <Route path="chemical-inventory/dashboard" element={<ChemicalDashboard />} />
          <Route path="chemical-inventory/chemicals" element={<ChemicalMaster />} />
          <Route path="chemical-inventory/suppliers" element={<Suppliers />} />
          <Route path="chemical-inventory/manufacturers" element={<Manufacturers />} />
          <Route path="chemical-inventory/purchase" element={<PurchaseEntry />} />
          <Route path="chemical-inventory/usage" element={<StockUsage />} />
          <Route path="chemical-inventory/expiry" element={<ExpiryMonitoring />} />
          <Route path="chemical-inventory/reports" element={<Reports />} />
          <Route path="chemical-inventory/history" element={<AuditHistory />} />

          {/* Serology */}
          <Route path="labs/serology" element={<Serology />} />
          <Route path="labs/serology-results" element={<SerologyResults />} />

          {/* Donation + Donor */}
          <Route path="donations/create-donation" element={<CreateDonation />} />
          <Route path="donations/view-donation" element={<DonationManagement />} />
          <Route path="donor/create-donor" element={<CreateDonorPage />} />
          <Route path="donor/view-donor" element={<DonorManagement />} />
          <Route path="master-register/donors" element={<MasterDonors />} />
          <Route path="master-register/donations" element={<MasterDonations />} />

          {/* Appointments */}
          <Route path="appointments" element={<AppointmentList />} />

          {/* Admin */}
          <Route path="admin/user-manage" element={<UserManage />} />

          {/* Hospital */}
          <Route path="hospital/add" element={<AddHospital />} />
          <Route path="hospital/list" element={<ListHospital />} />

          {/* Requisition */}
          <Route path="requisition" element={<RequisitionManagement />} />
          <Route path="requisition/:id" element={<RequisitionManagement />} />
          <Route path="requisition/list" element={<RequisitionList />} />

          {/* MIS */}
          <Route path="mis/donors" element={<DonorMIS />} />
          <Route path="mis/donations" element={<DonationMIS />} />
          <Route path="mis/camps" element={<CampMIS />} />
          <Route path="mis/bags" element={<BagMIS />} />
          <Route path="mis/components" element={<ComponentMIS />} />
          <Route path="mis/inventory" element={<InventoryMIS />} />
          <Route path="mis/issues" element={<IssueMIS />} />
          <Route path="mis/discards" element={<DiscardMIS />} />
          <Route path="mis/testing" element={<TestingMIS />} />
          <Route path="mis/exceptions" element={<ExceptionMIS />} />
          <Route path="mis/regulatory" element={<RegulatoryMIS />} />
          <Route path="mis/executive" element={<ExecutiveMIS />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideShell && <Footer />}
    </div>
  );
};

export default App;
