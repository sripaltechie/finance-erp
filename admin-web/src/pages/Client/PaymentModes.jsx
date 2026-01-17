import React, { useState, useEffect } from 'react';
import { 
    Wallet, Plus, Trash2, Edit2, ShieldCheck, CreditCard, Banknote 
} from 'lucide-react';
import { 
    getCompaniesService, 
    getPaymentModesService, 
    addPaymentModeService, 
    deletePaymentModeService 
} from '../../services/companyService';

const PaymentModes = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [modes, setModes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'Cash', initialBalance: '' });

    // 1. Load Companies on Mount
    useEffect(() => {
        loadCompanies();
    }, []);

    // 2. Load Modes when Company Changes
    useEffect(() => {
        if (selectedCompanyId) {
            loadModes(selectedCompanyId);
        }
    }, [selectedCompanyId]);

    const loadCompanies = async () => {
        try {
            const rawdata = await getCompaniesService();
            const data = rawdata.data;
            // console.log(data.data[0]._id);
            setCompanies(data);
            if (data.length > 0) setSelectedCompanyId(data[0]._id); // Select first by default
        } catch (err) {
            console.error("Failed to load companies", err);
        }
    };

    const loadModes = async (compId) => {
        setLoading(true);
        try {
            const data = await getPaymentModesService(compId);
            console.log(data);
            setModes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.initialBalance) return;

        try {
            await addPaymentModeService(selectedCompanyId, formData);
            setShowModal(false);
            setFormData({ name: '', type: 'Cash', initialBalance: '' });
            loadModes(selectedCompanyId); // Refresh
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add mode");
        }
    };

    const handleDelete = async (modeId) => {
        if(!window.confirm("Are you sure?")) return;
        try {
            await deletePaymentModeService(selectedCompanyId, modeId);
            loadModes(selectedCompanyId);
        } catch (err) {
            alert("Cannot delete: " + (err.response?.data?.message || "Error"));
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                
                {/* Header & Company Selector */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Wallet className="text-blue-600" /> Payment & Wallet Settings
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Manage Cash Drawers, Bank Accounts, and Online Wallets.</p>
                    </div>
                    
                    <select 
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white font-medium shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Add New Card */}
                    <div 
                        onClick={() => setShowModal(true)}
                        className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition min-h-[200px]"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                            <Plus size={24} className="text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-700">Add New Wallet</h3>
                        <p className="text-xs text-gray-400 mt-1">Cash, Bank, or App</p>
                    </div>

                    {/* Mode Cards */}
                    {loading ? <p>Loading...</p> : modes.map(mode => (
                        <div key={mode._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${mode.type === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {mode.type === 'Cash' ? <Banknote size={24} /> : <CreditCard size={24} />}
                                </div>
                                {mode.isActive && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Active</span>
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-800">{mode.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{mode.type} Account</p>
                            
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Current Balance</span>
                                    <span className="font-bold text-gray-800">₹{mode.currentBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Initial: ₹{mode.initialBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <button 
                                onClick={() => handleDelete(mode._id)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Add Payment Mode</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="e.g. Shop Cash, Sowji Ac, HDFC"
                                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <div className="flex gap-2">
                                    {['Cash', 'Online'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, type})}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                                                formData.type === type 
                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Opening Balance</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        className="w-full p-3 pl-8 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.initialBalance}
                                        onChange={e => setFormData({...formData, initialBalance: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    Create Wallet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentModes;