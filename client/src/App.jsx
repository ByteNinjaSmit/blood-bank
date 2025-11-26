import React from 'react'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import LoginPage from './page/auth-pages/Login-Page'
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFound from './page/Error-Page';
import RegisterPage from './page/auth-pages/Registeration-Page';
import MasterLayout from './page/dashboard/layout/Master-Layout';
import Home from './page/Home';
import CampRegisteration from './page/camp/Camp-Registeration';
import CampListing from './page/camp/Camp-Listing';
import CampDetails from './page/camp/CampDetails';
import { ComponentsList, ComponentSeparate, NearExpiry } from './page/component-separate';
import Serology from './page/Serology/Serology';
import SerologyResults from './page/Serology/SerologyResults';
import ViewDiscarded from './components/discard/View-Discarded';
import Stock from './page/Inventory/Stock';
import Reserve from './page/Inventory/Reserve';
import ReserveWizard from './page/Inventory/ReserveWizard';
import Issue from './page/Inventory/Issue';
import InventoryNearExpiry from './page/Inventory/NearExpiry';
import DonationManagement from './page/donation/DonationManagement';
import DonorManagement from './page/donor/DonorManagement';
import { AuthenticatedRoute } from './components/auth/Authentic-Routes';
import CampDonorManagement from './page/camp/CampDonorManagement';
import CampDonationManagement from './page/camp/CampDonationManagement';
import ScrollToTop from './page/dashboard/layout/ScrollToTop';
import Loader from './components/utils/Spinner';
import { useAuth } from './store/auth';
import CreateDonation from './components/donation/Create-Donation';
import UserManage from './page/user-manage/UserManage';
import Dashboard from './page/dashboard/Dashboard';
import CreateDonorPage from './page/donor/CreateDonor';
import { AddHospital, ListHospital } from './page/hospital';
import RequisitionManagement from './page/requisition/RequisitionManagement';
import RequisitionList from './page/requisition/RequisitionList';
import DonorMIS from './page/mis/DonorMIS';
import DonationMIS from './page/mis/DonationMIS';
import CampMIS from './page/mis/CampMIS';
import CampReports from './page/camp/CampReports';
import BagMIS from './page/mis/BagMIS';
import ComponentMIS from './page/mis/ComponentMIS';
import InventoryMIS from './page/mis/InventoryMIS';
import IssueMIS from './page/mis/IssueMIS';
import DiscardMIS from './page/mis/DiscardMIS';
import TestingMIS from './page/mis/TestingMIS';
import ExceptionMIS from './page/mis/ExceptionMIS';
import RegulatoryMIS from './page/mis/RegulatoryMIS';
import ExecutiveMIS from './page/mis/ExecutiveMIS';
import AppointmentList from './page/appointment/AppointmentList';

const App = () => {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { isLoading } = useAuth()
  // const isLoading = true;
  // const navigation = useNavigation();
  const NoNavbarRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const NoFooterRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

  return (
    <div>

      <ScrollToTop />
      {/* Conditional Rendering For Navbar */}
      {!NoNavbarRoutes.includes(pathname) && <Navbar />}
      <Routes>
        {/* Auth Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />


        <Route path="/" element={
          <AuthenticatedRoute>
            <MasterLayout />
          </AuthenticatedRoute>
        }>
          {/*  Dashboard - Home Route */}
          <Route path="" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/*  Dashboard - Camp Routes */}
          <Route path="/camp-registration" element={<CampRegisteration />} />
          <Route path="/camp-details" element={<CampDetails />} />
          <Route path="/camp-listing" element={<CampListing />} />
          <Route path="/camp-donors" element={<CampDonorManagement />} />
          <Route path="/camp-donation" element={<CampDonationManagement />} />
          <Route path="/camp-reports" element={<CampReports />} />

          {/*  Dashboard - Component Routes */}
          <Route path="/component/list" element={<ComponentsList />} />
          <Route path="/component/separate" element={<ComponentSeparate />} />
          <Route path="/component/near-expiry" element={<NearExpiry />} />
          <Route path="/discard" element={<ViewDiscarded />} />

          <Route path="/inventory/stock" element={<Stock />} />
          <Route path="/inventory/reserve" element={<Reserve />} />
          <Route path="/inventory/reserve/new" element={<ReserveWizard />} />
          <Route path="/inventory/issue" element={<Issue />} />
          <Route path="/inventory/near-expiry" element={<InventoryNearExpiry />} />

          {/*  Dashboard - Labs Routes */}
          <Route path="/labs/serology" element={<Serology />} />
          <Route path="/labs/serology-results" element={<SerologyResults />} />

          {/* Donation Module  */}
          <Route path="/donations/create-donation" element={<CreateDonation />} />
          <Route path="/donations/view-donation" element={<DonationManagement />} />

          {/* Donor Module */}
          <Route path="/donor/create-donor" element={<CreateDonorPage />} />
          <Route path="/donor/view-donor" element={<DonorManagement />} />

          {/* Appointments Module */}
          <Route path="/appointments" element={<AppointmentList />} />

          {/* Admin Module */}
          <Route path="/admin/user-manage" element={<UserManage />} />

          {/* Hospital Module */}
          <Route path="/hospital/add" element={<AddHospital />} />
          <Route path="/hospital/list" element={<ListHospital />} />

          {/* Requisition Module */}
          <Route path="/requisition" element={<RequisitionManagement />} />
          <Route path="/requisition/:id" element={<RequisitionManagement />} />
          <Route path="/requisition/list" element={<RequisitionList />} />

          {/* MIS Module */}
          <Route path="/mis/donors" element={<DonorMIS />} />
          <Route path="/mis/donations" element={<DonationMIS />} />
          <Route path="/mis/camps" element={<CampMIS />} />
          <Route path="/mis/bags" element={<BagMIS />} />
          <Route path="/mis/components" element={<ComponentMIS />} />
          <Route path="/mis/inventory" element={<InventoryMIS />} />
          <Route path="/mis/issues" element={<IssueMIS />} />
          <Route path="/mis/discards" element={<DiscardMIS />} />
          <Route path="/mis/testing" element={<TestingMIS />} />
          <Route path="/mis/exceptions" element={<ExceptionMIS />} />
          <Route path="/mis/regulatory" element={<RegulatoryMIS />} />
          <Route path="/mis/executive" element={<ExecutiveMIS />} />

          {/*For Dashboard - Loading*/}


          {/*For Dashboard - Error Routes - 404 NOT FOUND */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Error Routes - 404 NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Conditional Rendering For Footer */}
      {!NoFooterRoutes.includes(pathname) && <Footer />}
    </div>
  )
}

export default App
