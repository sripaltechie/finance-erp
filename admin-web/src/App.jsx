import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import CompanySetup from './pages/Client/CompanySetup';
import StaffManagement from './pages/Client/StaffManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Creates a specific URL for your Super Admin Panel */}
        {/* <Route path="/super-admin" element={<SuperAdminDashboard />} /> */}
        <Route path="/client/staffmanagement" element={<StaffManagement />} />

        {/* Your existing or future login routes */}
        <Route path="/" element={<div>Home/Login Page Placeholder</div>} />
      </Routes>
    </Router>
  );
}

export default App;