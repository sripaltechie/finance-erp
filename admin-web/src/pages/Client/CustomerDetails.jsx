import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, MapPin, CreditCard, Plus, ArrowRight, 
  FileText, CheckCircle, AlertCircle, Loader, Calendar 
} from 'lucide-react';

// API Services
import { getCustomerByIdService } from '../../services/customerService'; // Ensure this exists in customerService
import { getCustomerLoansService } from '../../services/loanService';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custData, loansData] = await Promise.all([
          getCustomerByIdService(id),
          getCustomerLoansService(id)
        ]);
        setCustomer(custData);
        setLoans(loansData);
      } catch (error) {
        console.error("Failed to load customer details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-blue-600" size={32} /></div>;
  if (!customer) return <div className="p-10 text-center">Customer not found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <User size={32} className="text-blue-600" />
                {customer.fullName}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 mt-2">
                <span className="flex items-center gap-1"><Phone size={14} /> {customer.mobile}</span>
                {customer.shortId && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">ID: {customer.shortId}</span>}
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.level === 'Level 3' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {customer.level || 'Level 2'}
                </span>
            </div>
        </div>
        
        <button 
            onClick={() => navigate(`/client/loans/create?customerId=${id}`)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition"
        >
            <Plus size={20} /> Create New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Customer Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" /> Profile Details
            </h3>
            
            <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                    <p className="text-sm font-medium text-slate-700 flex items-start gap-2 mt-1">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        {customer.locations?.residence?.addressText || "No Address Provided"}
                    </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-bold text-slate-400 uppercase">KYC Info</label>
                    <div className="mt-1 space-y-1">
                        <p className="text-sm text-slate-700 flex justify-between">
                            <span>Aadhar:</span> <span className="font-mono">{customer.kyc?.aadhaarNumber || '-'}</span>
                        </p>
                        <p className="text-sm text-slate-700 flex justify-between">
                            <span>Ration:</span> <span className="font-mono">{customer.kyc?.rationCardNumber || '-'}</span>
                        </p>
                    </div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg">
                    <label className="text-xs font-bold text-slate-400 uppercase">Credit Score</label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{customer.creditScore || 500}</p>
                </div>
            </div>
        </div>

        {/* 3. Loan History List */}
        <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-slate-400" /> Loan History
            </h3>

            {loans.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
                    <p className="text-slate-400">No loans found for this customer.</p>
                    <button 
                        onClick={() => navigate(`/client/loans/create?customerId=${id}`)}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                        Give First Loan
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map(loan => (
                        <div 
                            key={loan._id} 
                            onClick={() => navigate(`/client/loans/${loan._id}`)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            loan.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                            loan.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {loan.status}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(loan.start_date).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                            {loan.loan_type} Loan
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mt-2">
                                        ₹{loan.financials?.principalAmount?.toLocaleString()}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {loan.financials?.interestRate}% Interest • {loan.financials?.duration} {loan.financials?.durationType || 'Days'}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition">
                                        <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default CustomerDetails;