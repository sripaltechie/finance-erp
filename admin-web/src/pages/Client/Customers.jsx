import React, { useState } from 'react';
import { UserPlus, Search, MapPin, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const Customers = () => {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock Data
  const [customers, setCustomers] = useState([
    { _id: '1', fullName: 'Mastan Vali', mobile: '9876543210', shortId: '100', address: 'Benz Circle', level: 'Level 2', isActive: true },
    { _id: '2', fullName: 'Raju Bhai', mobile: '9988776655', shortId: '101', address: 'One Town', level: 'Level 1', isActive: true },
  ]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', mobile: '', shortId: '', address: '',
    rationCard: '', aadhar: '', incomeType: 'Daily Wage'
  });

  const [warnings, setWarnings] = useState([]); // For Conflict Check

  // --- SIMULATED CONFLICT CHECK ---
  const checkConflict = (ration) => {
    if(ration === '123456') { // Mock existing card
        setWarnings(["⚠️ Warning: Ration Card '123456' is already used by Suresh (Active Loan)."]);
    } else {
        setWarnings([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // API Call to create customer
    const newCust = { ...formData, _id: Date.now().toString(), level: 'Level 2', isActive: true };
    setCustomers([newCust, ...customers]);
    setView('list');
    setFormData({ fullName: '', mobile: '', shortId: '', address: '', rationCard: '', aadhar: '', incomeType: 'Daily Wage' });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Customer Directory</h1>
            <p className="text-gray-500">Manage borrowers and check credit history.</p>
          </div>
          {view === 'list' && (
            <button 
              onClick={() => setView('create')}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              <UserPlus size={20} /> Add New Customer
            </button>
          )}
        </div>

        {/* VIEW 1: LIST VIEW */}
        {view === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by Name, Mobile or Short ID..." 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Short ID</th>
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Level</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50 group">
                                <td className="p-4">
                                    <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">#{c.shortId}</span>
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-gray-800">{c.fullName}</p>
                                    <p className="text-sm text-gray-500">{c.mobile}</p>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1"><MapPin size={14}/> {c.address}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        c.level === 'Level 3' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>{c.level}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-blue-600 font-medium hover:underline">Profile</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* VIEW 2: CREATE FORM */}
        {view === 'create' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-3xl mx-auto">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800">Registration Form</h2>
                    <button onClick={() => setView('list')} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* 1. Basic Identity */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                            <input 
                                required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Mastan Vali"
                                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                            <input 
                                required type="tel" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 9876543210"
                                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* 2. Location & ID */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quick Search ID</label>
                            <input 
                                required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="e.g. 105"
                                value={formData.shortId} onChange={e => setFormData({...formData, shortId: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Address / Landmark</label>
                            <input 
                                required className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Near Benz Circle"
                                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* 3. KYC & Conflict Check */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h3 className="font-bold text-orange-800 text-sm mb-3 flex items-center gap-2">
                            <FileText size={16}/> KYC Documents
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ration Card No.</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Check for conflicts..."
                                    value={formData.rationCard} 
                                    onChange={e => {
                                        setFormData({...formData, rationCard: e.target.value});
                                        checkConflict(e.target.value);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Aadhar Number</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="XXXX-XXXX-XXXX"
                                    value={formData.aadhar} onChange={e => setFormData({...formData, aadhar: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* WARNING ALERT */}
                        {warnings.length > 0 && (
                            <div className="mt-3 bg-white p-3 rounded border border-red-200 text-red-600 text-sm flex items-start gap-2 animate-pulse">
                                <AlertTriangle size={16} className="mt-0.5" />
                                <div>
                                    {warnings.map((w, i) => <p key={i} className="font-bold">{w}</p>)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex gap-4">
                        <button 
                            type="submit" 
                            disabled={warnings.length > 0}
                            className={`flex-1 py-4 rounded-lg font-bold text-white shadow-lg transition ${
                                warnings.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle size={20} /> Create Customer Profile
                            </span>
                        </button>
                    </div>

                </form>
            </div>
        )}

      </div>
    </div>
  );
};

export default Customers;