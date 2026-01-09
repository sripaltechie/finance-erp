import React, { useState } from 'react';
import { Check, X, Search, Smartphone, Globe, Monitor, Clock } from 'lucide-react';

const SuperAdminDashboard = () => {
  // Mock Data (Replace with API Call)
  const [clients, setClients] = useState([
    { id: 1, owner: 'Ramesh Gupta', business: 'Gupta Finance', mobile: '9876543210', status: 'Pending', plan: 'Gold', platform: 'combo', duration: 12, amount: 26388, date: '2024-01-09' },
    { id: 2, owner: 'Suresh Kumar', business: 'SK Credits', mobile: '9988776655', status: 'Approved', plan: 'Silver', platform: 'mobile', duration: 1, amount: 499, date: '2024-01-08' },
    { id: 3, owner: 'Demo User', business: 'Test Biz', mobile: '9123456789', status: 'Demo', plan: 'Demo', platform: 'mobile', duration: 0, amount: 0, date: '2024-01-09' },
  ]);

  const [filter, setFilter] = useState('Pending');

  const handleApprove = (id) => {
    if(confirm("Confirm Payment Received? This will activate the account.")) {
      setClients(clients.map(c => c.id === id ? { ...c, status: 'Approved' } : c));
    }
  };

  const getPlatformIcon = (type) => {
    switch(type) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'web': return <Globe className="w-4 h-4 text-green-500" />;
      default: return <Monitor className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <p className="text-gray-500">Manage Client Approvals & Licenses</p>
        </div>
        <div className="flex gap-2">
          {['Pending', 'Approved', 'Demo'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Client Details</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Plan Requested</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Duration</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Amount Due</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.filter(c => c.status === filter).map(client => (
              <tr key={client.id} className="hover:bg-blue-50/50">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{client.owner}</p>
                  <p className="text-sm text-gray-500">{client.business}</p>
                  <p className="text-xs text-gray-400 mt-1">{client.mobile}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(client.platform)}
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      client.plan === 'Platinum' ? 'bg-blue-100 text-blue-700' : 
                      client.plan === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.plan}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-3 h-3" />
                    {client.duration === 0 ? '7 Days' : `${client.duration} Months`}
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono font-bold text-gray-800">
                    ₹ {client.amount.toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {client.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleApprove(client.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    </div>
                  )}
                  {client.status === 'Approved' && <span className="text-xs text-green-600 font-bold px-3 py-1 bg-green-50 rounded-full">Active</span>}
                  {client.status === 'Demo' && <span className="text-xs text-gray-500 italic">Expiring in 6 days</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clients.filter(c => c.status === filter).length === 0 && (
          <div className="p-10 text-center text-gray-400">No {filter} requests found.</div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;