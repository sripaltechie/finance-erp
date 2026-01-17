import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Smartphone, ArrowRight, Loader } from 'lucide-react';
import { loginClientService } from '../../services/authService'; // Ensure this path is correct

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Default empty
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      // 1. Call Backend
      const data = await loginClientService({ identifier, password });

      // 2. Save Session
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // Consistent naming with app logic

      // 3. Handle Company Context
      if (data.user?.companies?.length > 0) {
        // Default to first company
        localStorage.setItem('activeCompanyId', data.user.companies[0]._id);
        // Optional: Store company name for UI
        localStorage.setItem('activeCompanyName', data.user.companies[0].name);
      } else {
        // No companies yet? Redirect to setup might be better, but dashboard handles empty states too
        console.warn("No active companies found for this user.");
      }

      // 4. Redirect
      // alert(`Welcome back, ${data.user.ownerName || 'Owner'}!`);
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || "Login Failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back!</h1>
          <p className="text-slate-500">Login to manage your finance business</p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Mobile Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number / Email</label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="e.g. 9876543210"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Login Securely</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              New Business Owner?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Register Here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;