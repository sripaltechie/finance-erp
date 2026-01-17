import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Capital from './pages/Client/Capital';
import CreateLoan from './pages/Loans/LoanOrigination';

// Import Pages
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import CompanySetup from './pages/Client/CompanySetup';
import StaffManagement from './pages/Client/StaffManagement';
import RegisterScreen from '../../admin-web/src/pages/Auth/Register'
import LoginScreen from '../../admin-web/src/pages/Auth/Login'
import Customers from './pages/Client/Customers';
import PaymentModes from './pages/Client/PaymentModes';

// Mock User for Testing (Change role to test different views)
// localStorage.getItem('token', data.token);
const userData = localStorage.getItem('user');
const userInfo = JSON.parse(userData);
// Layout Wrapper (Adds Sidebar to pages)
const DashboardLayout = () => (
  <div className="flex">
    <Sidebar user={userInfo} />
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
        <Route path="/" element={<RegisterScreen/>} />
        <Route path="/register" element={<RegisterScreen/>} />
        <Route path="/login" element={<LoginScreen/>} />

        {/* PROTECTED DASHBOARD ROUTES */}
        <Route element={<DashboardLayout />}>
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<SuperAdminDashboard />} />

          {/* Client Admin Routes */}
          <Route path="/client/companies" element={<CompanySetup />} />
          <Route path="/client/staff" element={<StaffManagement />} />
          <Route path="/client/customers" element={<Customers />} />
          
          {/* Placeholders for future pages */}
          <Route path="/dashboard" element={<div className="p-8"><h1>Main Dashboard (Coming Soon)</h1></div>} />
          <Route path="/customers" element={<div className="p-8"><h1>Customer List (Coming Soon)</h1></div>} />
          <Route path="/loans" element={<div className="p-8"><h1>Loan Management (Coming Soon)</h1></div>} />
          {/* <Route path="/client/capital" element={<div className="p-8"><h1>Capital & Wallet (Coming Soon)</h1></div>} /> */}
          <Route path="/client/capital" element={<Capital />} />
          <Route path="/client/loans/create" element={<CreateLoan />} />
          <Route path="/client/settings/payment-modes" element={<PaymentModes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;