import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Building2, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const Capital = () => {
  // Mock Data (Replace with API fetch later)
  const [loading, setLoading] = useState(false);
  const [totalCapital, setTotalCapital] = useState(1500000); // Auto-calculated
  const [paymentModes, setPaymentModes] = useState([
    { _id: '1', name: 'Main Cash Drawer', type: 'Cash', currentBalance: 500000, initialBalance: 500000, isActive: true },
    { _id: '2', name: 'HDFC Bank', type: 'Online', currentBalance: 800000, initialBalance: 800000, isActive: true },
    { _id: '3', name: 'PhonePe Business', type: 'Online', currentBalance: 200000, initialBalance: 200000, isActive: true },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newMode, setNewMode] = useState({ name: '', type: 'Online', initialBalance: '' });

  // --- API: ADD NEW MODE ---
  const handleAddMode = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API Call
    setTimeout(() => {
        const newItem = {
            _id: Date.now().toString(),
            ...newMode,
            currentBalance: Number(newMode.initialBalance),
            isActive: true
        };
        
        setPaymentModes([...paymentModes, newItem]);
        setTotalCapital(prev => prev + Number(newMode.initialBalance));
        
        // Reset & Close
        setLoading(false);
        setShowModal(false);
        setNewMode({ name: '', type: 'Online', initialBalance: '' });
    }, 1000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Capital & Wallets</h1>
            <p className="text-gray-500">Manage your business funds and payment collection methods.</p>
          </div>
          
          <div className="text-right">
             <p className="text-sm text-gray-500 font-medium">TOTAL BUSINESS CAPITAL</p>
             <h2 className="text-4xl font-bold text-emerald-600">₹ {totalCapital.toLocaleString()}</h2>
          </div>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 1. ADD NEW BUTTON CARD */}
            <button 
                onClick={() => setShowModal(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-blue-500 hover:text-blue-600 transition h-full min-h-[180px]"
            >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Plus size={24} />
                </div>
                <span className="font-bold">Add New Wallet</span>
                <span className="text-xs mt-1">e.g. GPay, Paytm, SBI</span>
            </button>

            {/* 2. RENDER EXISTING WALLETS */}
            {paymentModes.map((mode) => (
                <div key={mode._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                    {/* Visual Stripe */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${mode.type === 'Cash' ? 'bg-orange-400' : 'bg-blue-500'}`} />
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                mode.type === 'Cash' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                                {mode.type === 'Cash' ? <Wallet size={20} /> : <Building2 size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{mode.name}</h3>
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{mode.type} Account</span>
                            </div>
                        </div>
                        {mode.isActive && <span className="w-2 h-2 bg-green-500 rounded-full" title="Active"></span>}
                    </div>

                    <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-gray-800">₹ {mode.currentBalance.toLocaleString()}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                        <span>Started: ₹{mode.initialBalance.toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-green-600 font-bold">
                            <TrendingUp size={12} /> Live
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* INFO BANNER */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
                <h4 className="font-bold text-blue-800 text-sm">How this works?</h4>
                <p className="text-sm text-blue-700 mt-1">
                    These wallets will appear in your <strong>Mobile App</strong> when collecting money. 
                    If a Collection Boy selects "PhonePe", the money will be added to the wallet you created here named "PhonePe".
                </p>
            </div>
        </div>
      </div>

      {/* MODAL: CREATE NEW WALLET */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Add Payment Channel</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold">&times;</button>
                </div>
                
                <form onSubmit={handleAddMode} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Wallet Name</label>
                        <input 
                            required
                            type="text" 
                            placeholder="e.g. HDFC Bank or GPay Business"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newMode.name}
                            onChange={e => setNewMode({...newMode, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setNewMode({...newMode, type: 'Cash'})}
                                className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold transition ${
                                    newMode.type === 'Cash' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <Wallet size={18} /> Cash
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewMode({...newMode, type: 'Online'})}
                                className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold transition ${
                                    newMode.type === 'Online' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <CreditCard size={18} /> Online / Bank
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Opening Balance (Capital)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-bold">₹</span>
                            <input 
                                required
                                type="number" 
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                                value={newMode.initialBalance}
                                onChange={e => setNewMode({...newMode, initialBalance: e.target.value})}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This amount will be added to your Total Business Capital.</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 mt-2"
                    >
                        {loading ? 'Creating...' : 'Create Wallet'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Capital;