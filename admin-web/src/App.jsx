import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Capital from './pages/Client/Capital';
import LoanOrigination from './pages/Client/LoanOrigination';

// Import Pages
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import CompanySetup from './pages/Client/CompanySetup';
import StaffManagement from './pages/Client/StaffManagement';

// Mock User for Testing (Change role to test different views)
const mockUser = { role: 'Super_Admin', name: 'Ramesh Gupta' };

// Layout Wrapper (Adds Sidebar to pages)
const DashboardLayout = () => (
  <div className="flex">
    <Sidebar user={mockUser} />
    <div className="flex-1 ml-64 bg-gray-50 min-h-screen">
      <Outlet /> {/* Renders the child route here */}
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<div>Login Page</div>} />

        {/* PROTECTED DASHBOARD ROUTES */}
        <Route element={<DashboardLayout />}>
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<SuperAdminDashboard />} />

          {/* Client Admin Routes */}
          <Route path="/client/companies" element={<CompanySetup />} />
          <Route path="/client/staff" element={<StaffManagement />} />
          
          {/* Placeholders for future pages */}
          <Route path="/dashboard" element={<div className="p-8"><h1>Main Dashboard (Coming Soon)</h1></div>} />
          <Route path="/customers" element={<div className="p-8"><h1>Customer List (Coming Soon)</h1></div>} />
          <Route path="/loans" element={<div className="p-8"><h1>Loan Management (Coming Soon)</h1></div>} />
          {/* <Route path="/client/capital" element={<div className="p-8"><h1>Capital & Wallet (Coming Soon)</h1></div>} /> */}
          <Route path="/client/capital" element={<Capital />} />
          <Route path="/client/loans/create" element={<LoanOrigination />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;