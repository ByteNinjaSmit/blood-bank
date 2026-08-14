import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthenticatedRoute } from './components/auth/Authentic-Routes';
import PageGuard from './features/access/PageGuard';
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
import CampDonorManagement from './features/camp/pages/CampDonorManagement';
import CampDonationManagement from './features/camp/pages/CampDonationManagement';
import CampReports from './features/camp/pages/CampReports';

// Component
import { ComponentsList, ComponentSeparate, NearExpiry } from './features/component/pages';
import ViewDiscarded from './features/discard/components/View-Discarded';

// Inventory
import Stock from './features/inventory/pages/Stock';
import Reserve from './features/inventory/pages/Reserve';
import ReserveWizard from './features/inventory/pages/reserve-wizard/ReserveWizard';
import Issue from './features/inventory/pages/Issue';
import InventoryNearExpiry from './features/inventory/pages/NearExpiry';

// Serology
import Serology from './features/serology/pages/Serology';
import SerologyResults from './features/serology/pages/SerologyResults';

// Donation + Donor
import MasterDonors from './features/donor/pages/MasterDonors';
import MasterDonations from './features/donation/pages/MasterDonations';
import DonorCreation from './features/donor/pages/DonorCreation';

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

// Audit Trail (centralized)
import AuditTrail from './features/audit/pages/AuditTrail';

// Monthly / Yearly Statutory Report
import MonthlyReport from './features/monthly-report/pages/MonthlyReport';
import YearlyReport from './features/yearly-report/pages/YearlyReport';

// Requisition
import RequisitionManagement from './features/requisition/pages/RequisitionManagement';
import RequisitionList from './features/requisition/pages/RequisitionList';

// Appointment
import DonorAppointmentList from './features/appointment/pages/DonorAppointmentList';
import CampDonorAppointmentList from './features/appointment/pages/CampDonorAppointmentList';
import FeedbackList from './features/appointment/pages/FeedbackList';

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
import AnalyticsMIS from './features/mis/pages/AnalyticsMIS';
import RecycleBin from './features/mis/pages/RecycleBin';

// Guide
import SoftwareGuide from './features/guide/pages/SoftwareGuide';

// Error
import NotFound from './page/Error-Page';

const NO_SHELL = ['/login', '/register', '/forgot-password', '/reset-password'];

const App = () => {
  const pathname = useLocation().pathname;
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
          <Route index element={<PageGuard module="dashboard" page="home"><Home /></PageGuard>} />
          <Route path="dashboard" element={<PageGuard module="dashboard" page="dashboard"><Dashboard /></PageGuard>} />

          {/* Camp */}
          <Route path="camp-registration" element={<PageGuard module="camp" page="camp-registration"><CampRegistration /></PageGuard>} />
          <Route path="camp-details" element={<PageGuard module="camp" page="camp-details"><CampDetails /></PageGuard>} />
          <Route path="camp-listing" element={<PageGuard module="camp" page="camp-listing"><CampListing /></PageGuard>} />
          <Route path="camp-donors" element={<PageGuard module="camp" page="camp-donors"><CampDonorManagement /></PageGuard>} />
          <Route path="camp-donation" element={<PageGuard module="camp" page="camp-donation"><CampDonationManagement /></PageGuard>} />
          <Route path="camp-reports" element={<PageGuard module="camp" page="camp-reports"><CampReports /></PageGuard>} />

          {/* Component */}
          <Route path="component/list" element={<PageGuard module="component" page="component-list"><ComponentsList /></PageGuard>} />
          <Route path="component/separate" element={<PageGuard module="component" page="component-separate"><ComponentSeparate /></PageGuard>} />
          <Route path="component/near-expiry" element={<PageGuard module="component" page="component-near-expiry"><NearExpiry /></PageGuard>} />
          <Route path="discard" element={<PageGuard module="discard" page="discard-list"><ViewDiscarded /></PageGuard>} />

          {/* Inventory */}
          <Route path="inventory/stock" element={<PageGuard module="inventory" page="inventory-stock"><Stock /></PageGuard>} />
          <Route path="inventory/reserve" element={<PageGuard module="inventory" page="inventory-reserve"><Reserve /></PageGuard>} />
          <Route path="inventory/reserve/new" element={<PageGuard module="inventory" page="inventory-reserve-new"><ReserveWizard /></PageGuard>} />
          <Route path="inventory/issue" element={<PageGuard module="inventory" page="inventory-issue"><Issue /></PageGuard>} />
          <Route path="inventory/near-expiry" element={<PageGuard module="inventory" page="inventory-near-expiry"><InventoryNearExpiry /></PageGuard>} />

          <Route path="procurement/po" element={<PageGuard module="bag-procurement" page="procurement-po"><PurchaseOrders /></PageGuard>} />
          <Route path="procurement/grn" element={<PageGuard module="bag-procurement" page="procurement-grn"><GoodsReceipt /></PageGuard>} />
          <Route path="procurement/inspection" element={<PageGuard module="bag-procurement" page="procurement-inspection"><BagInspection /></PageGuard>} />
          <Route path="procurement/issue" element={<PageGuard module="bag-procurement" page="procurement-issue"><BagIssuance /></PageGuard>} />
          <Route path="procurement/discard" element={<PageGuard module="bag-procurement" page="procurement-discard"><ViewDiscarded /></PageGuard>} />
          <Route path="procurement/inventory" element={<PageGuard module="bag-procurement" page="procurement-inventory"><BagInventory /></PageGuard>} />

          {/* Chemical Inventory */}
          <Route path="chemical-inventory/dashboard" element={<PageGuard module="chemical-inventory" page="chemical-dashboard"><ChemicalDashboard /></PageGuard>} />
          <Route path="chemical-inventory/chemicals" element={<PageGuard module="chemical-inventory" page="chemical-master"><ChemicalMaster /></PageGuard>} />
          <Route path="chemical-inventory/suppliers" element={<PageGuard module="chemical-inventory" page="chemical-suppliers"><Suppliers /></PageGuard>} />
          <Route path="chemical-inventory/manufacturers" element={<PageGuard module="chemical-inventory" page="chemical-manufacturers"><Manufacturers /></PageGuard>} />
          <Route path="chemical-inventory/purchase" element={<PageGuard module="chemical-inventory" page="chemical-purchase"><PurchaseEntry /></PageGuard>} />
          <Route path="chemical-inventory/usage" element={<PageGuard module="chemical-inventory" page="chemical-usage"><StockUsage /></PageGuard>} />
          <Route path="chemical-inventory/expiry" element={<PageGuard module="chemical-inventory" page="chemical-expiry"><ExpiryMonitoring /></PageGuard>} />
          <Route path="chemical-inventory/reports" element={<PageGuard module="chemical-inventory" page="chemical-reports"><Reports /></PageGuard>} />
          <Route path="chemical-inventory/history" element={<PageGuard module="chemical-inventory" page="chemical-history"><AuditHistory /></PageGuard>} />

          {/* Audit Trail */}
          <Route path="audit-trail" element={<PageGuard module="audit" page="audit-trail"><AuditTrail /></PageGuard>} />

          <Route path="reports/monthly" element={<PageGuard module="monthly-report" page="monthly-report"><MonthlyReport /></PageGuard>} />
          <Route path="reports/yearly" element={<PageGuard module="yearly-report" page="yearly-report"><YearlyReport /></PageGuard>} />

          {/* Serology */}
          <Route path="labs/serology" element={<PageGuard module="labs" page="labs-serology"><Serology /></PageGuard>} />
          <Route path="labs/serology-results" element={<PageGuard module="labs" page="labs-serology-results"><SerologyResults /></PageGuard>} />

          {/* Donation + Donor */}
          <Route path="master-register/donors" element={<PageGuard module="donor" page="donor-list"><MasterDonors /></PageGuard>} />
          <Route path="master-register/donations" element={<PageGuard module="donor" page="donation-list"><MasterDonations /></PageGuard>} />
          <Route path="master-register/donor-creation" element={<PageGuard module="donor" page="donor-creation"><DonorCreation /></PageGuard>} />

          {/* Appointments */}
          <Route path="appointments/donors" element={<PageGuard module="appointment" page="appointment-donors"><DonorAppointmentList /></PageGuard>} />
          <Route path="appointments/camps" element={<PageGuard module="appointment" page="appointment-camps"><CampDonorAppointmentList /></PageGuard>} />
          <Route path="appointments/feedback" element={<PageGuard module="appointment" page="appointment-feedback"><FeedbackList /></PageGuard>} />

          {/* Admin */}
          <Route path="admin/user-manage" element={<PageGuard module="admin" page="user-manage"><UserManage /></PageGuard>} />

          {/* Hospital */}
          <Route path="hospital/add" element={<PageGuard module="hospital" page="hospital-add"><AddHospital /></PageGuard>} />
          <Route path="hospital/list" element={<PageGuard module="hospital" page="hospital-list"><ListHospital /></PageGuard>} />

          {/* Requisition */}
          <Route path="requisition" element={<PageGuard module="requisition" page="requisition-manage"><RequisitionManagement /></PageGuard>} />
          <Route path="requisition/:id" element={<PageGuard module="requisition" page="requisition-manage"><RequisitionManagement /></PageGuard>} />
          <Route path="requisition/list" element={<PageGuard module="requisition" page="requisition-list"><RequisitionList /></PageGuard>} />

          {/* MIS */}
          <Route path="mis/donors" element={<PageGuard module="mis" page="mis-donors"><DonorMIS /></PageGuard>} />
          <Route path="mis/donations" element={<PageGuard module="mis" page="mis-donations"><DonationMIS /></PageGuard>} />
          <Route path="mis/camps" element={<PageGuard module="mis" page="mis-camps"><CampMIS /></PageGuard>} />
          <Route path="mis/bags" element={<PageGuard module="mis" page="mis-bags"><BagMIS /></PageGuard>} />
          <Route path="mis/components" element={<PageGuard module="mis" page="mis-components"><ComponentMIS /></PageGuard>} />
          <Route path="mis/inventory" element={<PageGuard module="mis" page="mis-inventory"><InventoryMIS /></PageGuard>} />
          <Route path="mis/issues" element={<PageGuard module="mis" page="mis-issues"><IssueMIS /></PageGuard>} />
          <Route path="mis/discards" element={<PageGuard module="mis" page="mis-discards"><DiscardMIS /></PageGuard>} />
          <Route path="mis/testing" element={<PageGuard module="mis" page="mis-testing"><TestingMIS /></PageGuard>} />
          <Route path="mis/exceptions" element={<PageGuard module="mis" page="mis-exceptions"><ExceptionMIS /></PageGuard>} />
          <Route path="mis/regulatory" element={<PageGuard module="mis" page="mis-regulatory"><RegulatoryMIS /></PageGuard>} />
          <Route path="mis/executive" element={<PageGuard module="mis" page="mis-executive"><ExecutiveMIS /></PageGuard>} />
          <Route path="mis/analytics" element={<PageGuard module="mis" page="mis-analytics"><AnalyticsMIS /></PageGuard>} />
          <Route path="recycle-bin" element={<PageGuard module="mis" page="mis-recycle-bin"><RecycleBin /></PageGuard>} />

          {/* Guide */}
          <Route path="software-guide" element={<PageGuard module="guide" page="software-guide"><SoftwareGuide /></PageGuard>} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideShell && <Footer />}
    </div>
  );
};

export default App;
