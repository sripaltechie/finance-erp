import React, { useState } from 'react';
import { Plus, Building, MapPin, Settings, ShieldCheck, DollarSign } from 'lucide-react';

const CompanySetup = () => {
  // Mock Data: User is on 'Gold' Plan (Max 3)
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Sai Finance - Main Rd', address: 'Vijayawada', active: true }
  ]);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    allowPartial: true,
    monthlyInterest: true,
    geoFencing: false
  });

  const handleCreate = (e) => {
    e.preventDefault();
    // API Call would go here
    const newCo = { id: Date.now(), name: formData.name, address: formData.address, active: true };
    setCompanies([...companies, newCo]);
    setShowModal(false);
    setFormData({ name: '', address: '', allowPartial: true, monthlyInterest: true, geoFencing: false });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Branches</h1>
            <p className="text-gray-500">Manage your finance firms and settings.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add New Branch
          </button>
        </div>

        {/* List of Companies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map((co) => (
            <div key={co.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{co.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} /> {co.address}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Active</span>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2 flex gap-3">
                <button className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100">
                  Manage Staff
                </button>
                <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                  Dashboard
                </button>
              </div>
            </div>
          ))}

          {/* Empty State / Add New Placeholder */}
          {companies.length < 3 && (
            <button 
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition min-h-[180px]"
            >
              <Plus size={32} className="mb-2" />
              <span className="font-medium">Add another Branch</span>
              <span className="text-xs mt-1">(2 of 3 used)</span>
            </button>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Setup New Branch</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firm / Branch Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Sri Balaji Finance"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City / Location</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Benz Circle, Vijayawada"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Investment (Capital)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-bold">₹</span>
                        </div>
                        <input 
                        type="number" 
                        className="w-full pl-8 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none font-mono font-bold text-gray-700"
                        placeholder="e.g. 500000"
                        value={formData.initialCapital}
                        onChange={e => setFormData({...formData, initialCapital: e.target.value})}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        This amount will be set as the starting balance for {formData.name || 'this branch'}.
                    </p>
                </div>
              {/* Feature Toggles (The Cool Part) */}
              <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Operational Settings</p>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded"><DollarSign size={18} /></div>
                      <div>
                        <span className="block text-sm font-medium">Partial Payments</span>
                        <span className="block text-xs text-gray-500">Allow "odd amounts" (e.g. 1200 for 500 due)</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.allowPartial} onChange={e => setFormData({...formData, allowPartial: e.target.checked})} className="w-5 h-5 text-blue-600" />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded"><ShieldCheck size={18} /></div>
                      <div>
                        <span className="block text-sm font-medium">Geo-Fencing Security</span>
                        <span className="block text-xs text-gray-500">Staff must be at customer location to collect</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.geoFencing} onChange={e => setFormData({...formData, geoFencing: e.target.checked})} className="w-5 h-5 text-blue-600" />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySetup;