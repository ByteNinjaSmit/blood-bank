import React from 'react'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import LoginPage from './page/auth-pages/Login-Page'
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFound from './page/Error-Page';
import RegisterPage from './page/auth-pages/Registeration-Page';
import MasterLayout from './page/dashboard/layout/Master-Layout';
import Home from './page/Home';
import CampRegisteration from './page/dashboard/Camp-Registeration';
import CampListing from './page/dashboard/Camp-Listing';
import CampDetails from './page/camp/CampDetails';
import { ComponentsList, ComponentSeparate, NearExpiry } from './page/component-separate';
import Serology from './page/Serology/Serology';
import SerologyResults from './page/Serology/SerologyResults';
import ViewDiscarded from './components/discard/View-Discarded';
import Stock from './page/Inventory/Stock';
import Reserve from './page/Inventory/Reserve';
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

          {/*  Dashboard - Component Routes */}
          <Route path="/component/list" element={<ComponentsList />} />
          <Route path="/component/separate" element={<ComponentSeparate />} />
          <Route path="/component/near-expiry" element={<NearExpiry />} />
          <Route path="/discard" element={<ViewDiscarded />} />

          <Route path="/inventory/stock" element={<Stock />} />
          <Route path="/inventory/reserve" element={<Reserve />} />
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

          {/* Admin Module */}
          <Route path="/admin/user-manage" element={<UserManage />} />

          {/* Hospital Module */}
          <Route path="/hospital/add" element={<AddHospital />} />
          <Route path="/hospital/list" element={<ListHospital />} />

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
