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
import ViewCampDetails from './page/dashboard/Camp-Details';
import { ComponentsList, ComponentSeparate, NearExpiry } from './page/component-separate';
import ViewDiscarded from './components/camp/View-Discarded';
import ViewStock from './components/Inventory/Stock-View';
import CreateDonation from './components/camp/Create-Donation';
import ViewDonations from './components/camp/View-Donations';
import CreateDonor from './components/camp/Create-Donor';
import ViewDonor from './components/camp/View-Donor';
import CampDonations from './page/dashboard/Camp-Details';
import { AuthenticatedRoute } from './components/auth/Authentic-Routes';
import ViewDonorCamp from './components/camp/View-Donor-Camp';
import ViewDonationsCamp from './components/camp/View-Donations-Camp';
import ScrollToTop from './page/dashboard/layout/ScrollToTop';


const App = () => {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  // const navigation = useNavigation();
  const NoNavbarRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const NoFooterRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

  return (
    <div>
      {/* Conditional Rendering For Navbar */}
      {!NoNavbarRoutes.includes(pathname) && <Navbar />}
      <ScrollToTop />
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

          {/*  Dashboard - Camp Routes */}
          <Route path="/camp-registration" element={<CampRegisteration />} />
          <Route path="/camp-details" element={<CampDonations />} />
          <Route path="/camp-listing" element={<CampListing />} />
          <Route path="/camp-donors" element={<ViewDonorCamp />} />
          <Route path="/camp-donation" element={<ViewDonationsCamp />} />

          {/*  Dashboard - Component Routes */}
          <Route path="/component/list" element={<ComponentsList />} />
          <Route path="/component/separate" element={<ComponentSeparate />} />
          <Route path="/component/near-expiry" element={<NearExpiry />} />
          <Route path="/discard" element={<ViewDiscarded />} />

          <Route path="/inventory/stock" element={<ViewStock />} />

          {/* Donation Module  */}
          <Route path="/donations/create-donation" element={<CreateDonation />} />
          <Route path="/donations/view-donation" element={<ViewDonations />} />

          {/* Donor Module */}
          <Route path="/donor/create-donor" element={<CreateDonor />} />
          <Route path="/donor/view-donor" element={<ViewDonor />} />

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
