import React from 'react'
import { Route, Routes, useLocation, useNavigation } from "react-router-dom"
import LoginPage from './page/auth-pages/Login-Page'
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFound from './page/Error-Page';
import RegisterPage from './page/auth-pages/Registeration-Page';
import MasterLayout from './page/dashboard/layout/Master-Layout';
import Home from './page/Home';
import CampRegisteration from './page/dashboard/Camp-Registeration';
import CampListing from './page/dashboard/Camp-Listing';
import CampDonations from './page/dashboard/Camp-Donations';
import ViewDiscarded from './components/camp/View-Discarded';

const App = () => {
  const pathname = useLocation().pathname;
  // const navigation = useNavigation();
  const NoNavbarRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const NoFooterRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

  return (
    <div>
      {/* Conditional Rendering For Navbar */}
      {!NoNavbarRoutes.includes(pathname) && <Navbar />}

      <Routes>
        {/* Auth Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MasterLayout />}>
          {/*  Dashboard - Home Route */}
          <Route path="" element={<Home />} />

          {/*  Dashboard - Camp Routes */}
          <Route path="/camp-registration" element={<CampRegisteration />} />
          <Route path="/camp-donations" element={<CampDonations />} />
          <Route path="/camp-listing" element={<CampListing />} />

          <Route path="/discard" element={<ViewDiscarded />} />

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
