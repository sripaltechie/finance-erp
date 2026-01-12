import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Loader } from 'lucide-react'; 

// 🟢 1. Import Hook & Service
import useAxios from '../../hooks/useAxios';
import { registerClientService } from '../../services/authService';
import { PLATFORMS, DURATIONS, BASE_PRICES, PLANS } from '../../../../shared/PricingData';

const Register = () => {
  const navigate = useNavigate();
  
  // 🟢 2. Use the Bridge (Hook)
  const { loading, error, fetchData } = useAxios();

  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({ ownerName: '', mobile: '', email: '', password: '', businessName: '' });

  // Pricing State
  const [selectedPlatform, setSelectedPlatform] = useState('mobile');
  const [selectedDuration, setSelectedDuration] = useState(1);
  
  const getPrice = (tierId) => {
    const baseMonthly = BASE_PRICES[selectedPlatform][tierId];
    const durationObj = DURATIONS.find(d => d.id === selectedDuration);
    const totalBase = baseMonthly * selectedDuration;
    const discounted = totalBase - (totalBase * (durationObj.discount / 100));
    return Math.round(discounted);
  };

  // 🟢 3. Updated Handler using Service
  const handleRegister = async (planId, isDemo = false) => {
    const finalPayload = {
      ...formData,
      plan: isDemo ? 'Demo' : planId,
      platform: selectedPlatform,
      duration: selectedDuration,
      price: isDemo ? 0 : getPrice(planId),
      isDemo
    };

    try {
      // Call Service via Hook
      await fetchData(registerClientService, finalPayload);
      
      alert(isDemo ? "7-Day Demo Activated! Please Login." : "Request Sent! Admin will contact you.");
      navigate('/login');

    } catch (err) {
      // Error is handled by hook, but we can log specific actions if needed
      console.error("Registration failed:", err);
    }
  };

  // --- STEP 1: BASIC FORM ---
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Create Account</h1>
          
          {/* Global Error from Hook */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input type="text" placeholder="Owner Name" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
            
            <input type="text" placeholder="Business Name" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />

            <input type="tel" placeholder="Mobile Number" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />

            <input type="email" placeholder="Email Address" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />

            <input type="password" placeholder="Password" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-6 hover:bg-slate-800 transition">
            Next: Select Plan
          </button>

          <button 
            onClick={() => handleRegister(null, true)} 
            disabled={loading}
            className="w-full border border-slate-900 text-slate-900 font-bold py-3 rounded-xl mt-4 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {loading ? 'Starting Demo...' : 'Start 7-Day Free Demo'}
          </button>

          <p className="text-center mt-4 text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold">Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // --- STEP 2: PRICING UI (Only updated the button logic) ---
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Choose Your Plan</h2>
            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-900">← Back</button>
        </div>

        {/* Global Error from Hook (Duplicate placement for visibility on step 2) */}
        {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-200 font-bold text-center">
                {error}
            </div>
        )}

        {/* ... (FILTERS SECTION - Same as before) ... */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
            {/* Platforms */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setSelectedPlatform(p.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedPlatform === p.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Durations */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                {DURATIONS.map(d => (
                    <button key={d.id} onClick={() => setSelectedDuration(d.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedDuration === d.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        {d.label} {d.discount > 0 && <span className="bg-yellow-400 text-black px-1.5 rounded text-[10px] ml-1">-{d.discount}%</span>}
                    </button>
                ))}
            </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map(plan => (
                <div key={plan.id} className="relative bg-white rounded-3xl p-8 border-2 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                     style={{ borderColor: plan.color }}>
                    
                    {/* ... (Card Details same as before) ... */}
                    <div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: plan.color }}>{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-extrabold text-slate-900">₹{getPrice(plan.id).toLocaleString()}</span>
                            <span className="text-slate-500 text-sm font-medium">/ {DURATIONS.find(d => d.id === selectedDuration).label}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-6"></div>
                        
                        <ul className="space-y-4 mb-8">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                    <div className="p-1 rounded-full bg-green-100">
                                        <Check size={14} className="text-green-600" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button 
                        onClick={() => handleRegister(plan.id)}
                        disabled={loading}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: plan.color }}
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : `Select ${plan.name}`}
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Register;