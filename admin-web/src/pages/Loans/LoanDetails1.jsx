import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, DollarSign, FileText, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { getLoanDetailsService, applyPenaltyService } from '../../services/loanService'; // The Service

const LoanDetails = ({ loanId = "mock_id" }) => { // pass ID via router params usually
  const { id } = useParams(); // Get loan ID from URL
  const { loading, error, fetchData } = useAxios(); // Hook for API calls
  
  const [loan, setLoan] = useState(null);
  const [stats, setStats] = useState({ isOverdue: false, overdueDays: 0, penaltyAmt: 0 });
  // --- MOCK DATA (Replace with API Data) ---
//   const [loan, setLoan] = useState({
//     _id: 'L001',
//     customerId: { name: 'Mastan Vali', mobile: '9876543210' },
//     loanType: 'Daily',
//     principalAmount: 10000,
//     startDate: '2025-10-01', // Example: Old date to force overdue
//     status: 'Active',
//     notes: "Penalty applies if overdue > 100 days. Verification done by Ramesh.",
//     rules: {
//       dailyInstallment: 120,
//       totalDays: 100,
//       penaltyPerDayAfterDue: 50 // ₹50 per day penalty
//     },
//     summary: {
//       amountPaid: 8000,
//       pendingBalance: 4000 
//     }
//   });

  // Derived Stats (Normally comes from Backend Step 1, but calculating here for Demo)
  
// 1. Fetch Data on Mount
  useEffect(() => {
    // Simulate Backend "Get Details" Calculation
    if (loan.loanType === 'Daily') {
        const start = new Date(loan.startDate);
        const now = new Date(); // Current Date
        const diffTime = Math.abs(now - start);
        const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const totalDays = loan.rules.totalDays;
        
        if (daysPassed > totalDays) {
            const overdue = daysPassed - totalDays;
            setStats({
                isOverdue: true,
                overdueDays: overdue,
                penaltyAmt: overdue * (loan.rules.penaltyPerDayAfterDue || 0)
            });
        }
    }
  }, [loan]);

  // --- ACTIONS ---
// ... inside LoanDetails component

  const handleApplyPenalty = async () => {
    if (!stats.penaltyAmt || stats.penaltyAmt <= 0) return;

    const confirm = window.confirm(`Are you sure you want to add a penalty of ₹${stats.penaltyAmt}?`);
    if (!confirm) return;

    try {
      // 1. Call Backend
      // Replace 'http://localhost:5000' with your actual backend URL or proxy
      const response = await axios.post(`http://localhost:5000/api/loans/${loan._id}/penalty`, {
        amount: stats.penaltyAmt,
        reason: `Overdue by ${stats.overdueDays} days`
      }, {
        headers: {
           // If using JWT, don't forget your token!
           Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });

      // 2. Update UI instantly without refresh
      setLoan(prev => ({
        ...prev,
        summary: { 
          ...prev.summary, 
          pendingBalance: response.data.loan.summary.pendingBalance 
        },
        notes: response.data.loan.notes // Update notes to show the log
      }));

      alert("Penalty Added Successfully!");
      
      // Optionally reset stats so button hides/changes
      setStats(prev => ({ ...prev, isOverdue: false })); 

    } catch (error) {
      console.error(error);
      alert("Failed to apply penalty: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button className="p-2 bg-white rounded-full border hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Loan Details</h1>
            <p className="text-sm text-gray-500">ID: #{loan._id}</p>
          </div>
          <span className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold ${loan.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {loan.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: INFO CARDS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Borrower Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                    <User size={16} /> Borrower Information
                </h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold text-gray-800">{loan.customerId.name}</p>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <Phone size={14} /> {loan.customerId.mobile}
                        </p>
                    </div>
                    <div className="text-right">
                         <p className="text-sm text-gray-400">Principal</p>
                         <p className="text-xl font-bold text-gray-800">₹{loan.principalAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* 2. Repayment Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-6 flex items-center gap-2">
                    <DollarSign size={16} /> Repayment Progress
                </h3>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Paid Amount</span>
                    <span className="font-bold text-green-600">₹{loan.summary.amountPaid.toLocaleString()}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                    <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${(loan.summary.amountPaid / (loan.summary.amountPaid + loan.summary.pendingBalance)) * 100}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-blue-600 font-bold uppercase">Pending Balance</p>
                        <p className="text-2xl font-bold text-blue-800 mt-1">₹{loan.summary.pendingBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 font-bold uppercase">Daily Installment</p>
                        <p className="text-2xl font-bold text-gray-700 mt-1">₹{loan.rules.dailyInstallment}</p>
                    </div>
                </div>
            </div>

            {/* 3. NOTES / TERMS SECTION */}
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-yellow-800 text-sm font-bold uppercase mb-3 flex items-center gap-2">
                    <FileText size={18} /> Notes & Terms
                </h3>
                <p className="text-yellow-900 text-sm italic whitespace-pre-line">
                    "{loan.notes || 'No specific notes added.'}"
                </p>
            </div>

          </div>

          {/* RIGHT: PENALTY & DATES */}
          <div className="lg:col-span-1 space-y-6">

            {/* Date Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Timeline
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Start Date</span>
                        <span className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">{loan.rules.totalDays} Days</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                         <span className="text-gray-500">Due Date</span>
                         <span className="font-bold text-gray-800">
                             {(() => {
                                 const d = new Date(loan.startDate);
                                 d.setDate(d.getDate() + loan.rules.totalDays);
                                 return d.toLocaleDateString();
                             })()}
                         </span>
                    </div>
                </div>
            </div>

            {/* PENALTY ACTION CARD */}
            <div className={`p-6 rounded-xl border-2 ${stats.isOverdue ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                    {stats.isOverdue ? <AlertTriangle className="text-red-600" /> : <CheckCircle className="text-green-600" />}
                    <h3 className={`font-bold ${stats.isOverdue ? 'text-red-800' : 'text-green-800'}`}>
                        {stats.isOverdue ? 'Loan Overdue' : 'On Track'}
                    </h3>
                </div>

                {stats.isOverdue ? (
                    <>
                        <p className="text-sm text-red-700 mb-2">
                            This loan is overdue by <strong>{stats.overdueDays} days</strong>.
                        </p>
                        <div className="bg-white p-3 rounded border border-red-100 mb-4">
                            <p className="text-xs text-gray-500">Calculated Penalty</p>
                            <p className="text-xs text-gray-400 mb-1">({stats.overdueDays} days × ₹{loan.rules.penaltyPerDayAfterDue})</p>
                            <p className="text-xl font-bold text-red-600">₹{stats.penaltyAmt.toLocaleString()}</p>
                        </div>
                        <button 
                            onClick={handleApplyPenalty}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition"
                        >
                            Apply Penalty to Balance
                        </button>
                    </>
                ) : (
                    <p className="text-sm text-green-700">
                        Loan is within the agreed {loan.rules.totalDays} days period. No penalty actions required yet.
                    </p>
                )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default LoanDetails;