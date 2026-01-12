import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxios from '../../hooks/useAxios'; 
import { getLoanDetailsService, applyPenaltyService, addRepaymentService } from '../../services/loanService'; // Imported Service
import { ArrowLeft, User, Phone, DollarSign, FileText, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';

const LoanDetails = () => {
  const { id } = useParams();
  const { loading, error, fetchData } = useAxios();
  
  const [loan, setLoan] = useState(null);
  const [stats, setStats] = useState({ isOverdue: false, overdueDays: 0, penaltyAmt: 0 });

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  // 1. Fetch Data on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData(getLoanDetailsService, id);
        setLoan(data.loan);
        setStats(data.stats);
      } catch (err) {}
    };
    if (id) loadData();
  }, [id, fetchData]);

  // 2. Handle Penalty (Existing)
  const handleApplyPenalty = async () => {
     // ... (Your existing penalty logic)
  };

  // 3. 🟢 NEW: Handle Repayment
  const handleRepayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return alert("Enter valid amount");

    try {
      const result = await fetchData(addRepaymentService, id, {
        amount: payAmount,
        type: 'Cash' // You can add a radio button for 'Online' later
      });

      setLoan(result.loan); // Update UI with new balance
      setShowPayModal(false); // Close Modal
      setPayAmount(''); // Reset Input
      alert("Payment Collected Successfully!");

    } catch (err) {
      alert("Payment Failed");
    }
  };

  if (!loan) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <div className="max-w-5xl mx-auto">
        
        {/* Header & existing UI ... */}
        
        {/* REPAYMENT BUTTON (Add this near the Repayment Progress section) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Actions</h3>
             </div>
             <button 
                onClick={() => setShowPayModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
             >
                <DollarSign size={18} /> Collect Payment
             </button>
        </div>

      </div>

      {/* 🟢 MODAL OVERLAY */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 relative">
            
            <button 
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Collect Payment</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-600 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                autoFocus
                className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold outline-none focus:border-blue-500"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>

            <button 
              onClick={handleRepayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoanDetails;