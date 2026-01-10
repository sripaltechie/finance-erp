import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Smartphone, Lock, Building2 } from 'lucide-react';

const StaffManagement = () => {
  // Mock Data: Client has 2 Companies
  const [companies] = useState([
    { id: '101', name: 'Sai Finance - Vijayawada' },
    { id: '102', name: 'Sai Finance - Guntur' }
  ]);
  
  const [selectedCompany, setSelectedCompany] = useState('101');
  const [showModal, setShowModal] = useState(false);
  
  // Mock Staff List
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Ravi Kumar', mobile: '9988776655', role: 'Collection_Boy', companyId: '101', active: true },
    { id: 2, name: 'Suresh Babu', mobile: '8877665544', role: 'Manager', companyId: '101', active: true }
  ]);

  const [formData, setFormData] = useState({ name: '', mobile: '', password: '', role: 'Collection_Boy' });

  // Filter staff based on dropdown selection
  const currentStaff = staffList.filter(s => s.companyId === selectedCompany);

  const handleAddStaff = (e) => {
    e.preventDefault();
    // API Call here...
    const newStaff = { ...formData, id: Date.now(), companyId: selectedCompany, active: true };
    setStaffList([...staffList, newStaff]);
    setShowModal(false);
    setFormData({ name: '', mobile: '', password: '', role: 'Collection_Boy' });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Branch Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500">Add and manage collection boys for your branches.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Building2 size={20} className="text-gray-400 ml-2" />
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent font-medium text-gray-700 outline-none pr-2"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <UserPlus size={18} /> Add New Staff
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Employee Name</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Login ID (Mobile)</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800">{staff.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      staff.role === 'Manager' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                      {staff.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-gray-600">{staff.mobile}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                    <span className="text-gray-300 mx-2">|</span>
                    <button className="text-sm text-red-600 font-medium hover:underline">Block</button>
                  </td>
                </tr>
              ))}
              {currentStaff.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400">
                    No staff added to this branch yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {/* Branch Indicator */}
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Building2 size={16} />
                Adding to: {companies.find(c => c.id === selectedCompany)?.name}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Full Name</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    required type="text" placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Mobile Number (Login ID)</label>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    required type="tel" placeholder="e.g. 9876543210" maxLength="10"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    required type="text" placeholder="Set a temporary password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Role</label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-3 text-gray-400" />
                  <select 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Collection_Boy">Collection Boy (Field App)</option>
                    <option value="Manager">Manager (Web Admin Access)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 mt-2 transition shadow-lg shadow-blue-200">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;