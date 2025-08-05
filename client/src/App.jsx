import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Layout Components
import MainLayout from './components/layout/MainLayout'

// Pages
import LandingPage from './pages/landing/LandingPage'
import Dashboard from './pages/dashboard/Dashboard'
import DonorManagement from './pages/donor/DonorManagement'
import LabWorkflow from './pages/lab/LabWorkflow'
import HospitalRequests from './pages/hospital/HospitalRequests'
import Inventory from './pages/inventory/Inventory'
import Settings from './pages/settings/Settings'
import BulkUpload from './pages/upload/BulkUpload'
import Reports from './pages/reports/Reports'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page at root path */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin dashboard and other pages */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="donor/*" element={<DonorManagement />} />
          <Route path="lab/*" element={<LabWorkflow />} />
          <Route path="hospital/*" element={<HospitalRequests />} />
          <Route path="inventory/*" element={<Inventory />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="upload" element={<BulkUpload />} />
          <Route path="reports/*" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
