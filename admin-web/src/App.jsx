import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Creates a specific URL for your Super Admin Panel */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />

        {/* Your existing or future login routes */}
        <Route path="/" element={<div>Home/Login Page Placeholder</div>} />
      </Routes>
    </Router>
  );
}

export default App;