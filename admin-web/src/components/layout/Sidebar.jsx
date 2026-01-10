import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, Wallet, 
  UserCheck, Banknote, LogOut, Settings, ShieldAlert
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token logic here
    navigate('/login');
  };

  // 1. MENU CONFIGURATION
  const menus = {
    // 👑 The Platform Owner (You)
    Super_Admin: [
      { path: '/super-admin', label: 'Platform Dashboard', icon: ShieldAlert },
      { path: '/super-admin/clients', label: 'Manage Clients', icon: Users },
      { path: '/super-admin/settings', label: 'Global Settings', icon: Settings },
    ],
    // 🏢 The Business Owner (Client)
    Client_Admin: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/client/companies', label: 'My Branches', icon: Building2 },
      { path: '/client/staff', label: 'Staff Management', icon: Users },
      { path: '/client/capital', label: 'Capital & Wallet', icon: Wallet },
      { path: '/customers', label: 'Customers', icon: UserCheck },
      { path: '/loans', label: 'Loan Management', icon: Banknote },
    ],
    // 👔 Branch Manager
    Manager: [
      { path: '/dashboard', label: 'Branch Dashboard', icon: LayoutDashboard },
      { path: '/customers', label: 'Customers', icon: UserCheck },
      { path: '/loans', label: 'Loans', icon: Banknote },
      { path: '/reports', label: 'Day Book', icon: Wallet },
    ]
  };

  // Select menu based on role (Default to Manager if unknown)
  const currentMenu = menus[user?.role] || menus['Manager'];

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Chanda ERP
        </h1>
        <p className="text-xs text-slate-400 mt-1">{user?.role?.replace('_', ' ')}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {currentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;