import React, { useState, useEffect } from 'react';
import { Search, Wallet, ArrowRight, Check, Plus, Trash2, FileText, Percent } from 'lucide-react';

const LoanOrigination = () => {
  // --- MOCK DATA ---
  const [wallets] = useState([
    { _id: 'w1', name: 'Main Cash Drawer', type: 'Cash', balance: 500000 },
    { _id: 'w2', name: 'HDFC Bank', type: 'Online', balance: 800000 },
    { _id: 'w3', name: 'PhonePe Biz', type: 'Online', balance: 200000 }
  ]);

  const mockBorrowers = [
    { _id: '101', name: 'Mastan Vali', mobile: '9876543210' },
    { _id: '102', name: 'Ramesh Kumar', mobile: '9988776655' },
    { _id: '103', name: 'Suresh Babu', mobile: '8877665544' },
  ];
  
  // --- FORM STATE ---
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [showBorrowerList, setShowBorrowerList] = useState(false);

  // Loan Terms
  const [loanType, setLoanType] = useState('Daily'); 
  const [principal, setPrincipal] = useState('');
  
  // Daily Specifics
  const [dailyInstallment, setDailyInstallment] = useState('');
  const [totalDays, setTotalDays] = useState(100);
  
  // Monthly Specifics (Defaulted to 3%)
  const [interestRate, setInterestRate] = useState(3);
  
  // Interest Config (Upfront/End)
  const [interestConfig, setInterestConfig] = useState('End');

  // Custom Adjustments
  const [adjustments, setAdjustments] = useState([
    { id: 1, name: 'Document Charge', type: 'Minus', amount: 200 }
  ]);

  const [notes, setNotes] = useState('');

  // Payment Logic
  const [paymentMode, setPaymentMode] = useState('Single'); 
  const [selectedWallet, setSelectedWallet] = useState(wallets[0]?._id);
  const [splitCashWallet, setSplitCashWallet] = useState(wallets.find(w => w.type === 'Cash')?._id || '');
  const [splitOnlineWallet, setSplitOnlineWallet] = useState(wallets.find(w => w.type === 'Online')?._id || '');
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitOnlineAmount, setSplitOnlineAmount] = useState('');

  // --- ⚡ AUTO-CALCULATE DAILY DUE ---
  useEffect(() => {
    if (loanType === 'Daily' && principal && totalDays) {
      const p = parseFloat(principal) || 0;
      const d = parseFloat(totalDays) || 1;
      setDailyInstallment(Math.round(p / d).toString());
    }
  }, [principal, totalDays, loanType]);

  // --- 🧮 CALCULATIONS ---
  const principalAmount = parseFloat(principal) || 0;
  
  const totalAdjustments = adjustments.reduce((acc, curr) => {
    const amt = parseFloat(curr.amount) || 0;
    return curr.type === 'Plus' ? acc + amt : acc - amt;
  }, 0);

  // Frontend Display Calculation for Upfront Interest
  let upfrontInterest = 0;
  if (interestConfig === 'Upfront') {
    if (loanType === 'Daily') {
        // Example Logic: Upfront deduction based on rate if provided, 
        // OR implied interest (Total Return - Principal). 
        // Using Rate here since we now have the input:
        upfrontInterest = (principalAmount * interestRate) / 100;
    } else {
        // Monthly Estimate
        upfrontInterest = (principalAmount * interestRate) / 100;
    }
  }

  const netDisbursement = principalAmount + totalAdjustments - upfrontInterest;
  
  const currentSplitTotal = (Number(splitCashAmount) || 0) + (Number(splitOnlineAmount) || 0);
  const isSplitValid = currentSplitTotal === netDisbursement;

  // --- HANDLERS ---
  const filteredBorrowers = mockBorrowers.filter(b => 
    b.name.toLowerCase().includes(borrowerSearch.toLowerCase()) || 
    b.mobile.includes(borrowerSearch)
  );

  const addAdjustment = () => {
    setAdjustments([...adjustments, { id: Date.now(), name: '', type: 'Minus', amount: '' }]);
  };

  const removeAdjustment = (id) => {
    setAdjustments(adjustments.filter(a => a.id !== id));
  };

  const updateAdjustment = (id, field, value) => {
    setAdjustments(adjustments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleCreateLoan = () => {
    if (netDisbursement <= 0) return alert("Net Disbursement must be positive");
    if (paymentMode === 'Split' && !isSplitValid) return alert("Split amounts do not match Net Payout");
    if (!selectedBorrower) return alert("Please select a borrower");

    const payload = {
        customerId: selectedBorrower._id,
        loanType,
        principalAmount,
        startDate: new Date(),
        deductions: adjustments.map(a => ({
            name: a.name,
            type: 'Fixed',
            value: Number(a.amount),
            timing: a.type === 'Minus' ? 'Upfront' : 'None'
        })),
        deductionConfig: {
            interest: interestConfig === 'Upfront'
        },
        notes: notes,
        rules: loanType === 'Daily' ? {
            installment: Number(dailyInstallment),
            days: Number(totalDays),
            penaltyAfterDue: 10 
        } : {},
        monthlyConfig: loanType === 'Monthly' ? {
            rate: Number(interestRate)
        } : {},
        paymentMode: paymentMode === 'Single' 
            ? { cash: 0, online: 0 } 
            : { cash: splitCashAmount, online: splitOnlineAmount }
    };

    console.log("Submitting Loan Payload:", payload);
    alert("Loan Payload Ready (Check Console)");
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Loan</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: INPUTS */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Borrower Search */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Search size={18} /> Select Borrower
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search by Name or Mobile..." 
                            className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={borrowerSearch}
                            onChange={e => {
                                setBorrowerSearch(e.target.value);
                                setShowBorrowerList(true);
                                setSelectedBorrower(null);
                            }}
                            onFocus={() => setShowBorrowerList(true)}
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>

                    {showBorrowerList && borrowerSearch && (
                        <div className="absolute z-10 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {filteredBorrowers.length > 0 ? filteredBorrowers.map(b => (
                                <div 
                                    key={b._id} 
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                        setSelectedBorrower(b);
                                        setBorrowerSearch(`${b.name} (${b.mobile})`);
                                        setShowBorrowerList(false);
                                    }}
                                >
                                    <p className="font-bold text-gray-800">{b.name}</p>
                                    <p className="text-xs text-gray-500">{b.mobile}</p>
                                </div>
                            )) : (
                                <div className="p-3 text-gray-400 text-sm">No borrower found</div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Loan Terms & Config */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-700">Loan Terms</h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['Daily', 'Monthly'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setLoanType(type)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${
                                        loanType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Principal Input */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Principal</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded-lg p-3 font-bold text-lg outline-none focus:border-blue-500"
                                value={principal}
                                onChange={e => setPrincipal(e.target.value)}
                            />
                        </div>

                        {/* 🟢 UPDATED: Combined Interest UI */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interest Deduction</label>
                            <div className="border border-gray-300 rounded-lg p-1.5 flex items-center justify-between bg-white h-[54px]">
                                {/* Left: Input */}
                                <div className="pl-3 flex flex-col justify-center">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                            className="font-bold text-lg w-12 outline-none text-gray-800 placeholder-gray-300"
                                            placeholder="0"
                                        />
                                        <Percent size={14} className="text-gray-400 mt-1" />
                                    </div>
                                </div>

                                {/* Right: Toggle */}
                                <div className="flex bg-gray-100 rounded-lg p-1 h-full">
                                    {['Upfront', 'End'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setInterestConfig(type)}
                                            className={`px-3 flex items-center justify-center rounded-md text-xs font-bold transition-all ${
                                                interestConfig === type 
                                                ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-Calculated Fields (Only for Daily now, since Interest is handled above) */}
                    {loanType === 'Daily' && (
                        <div className="grid grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div>
                                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Total Days</label>
                                <input 
                                    type="number" className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white"
                                    value={totalDays} onChange={e => setTotalDays(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Daily Due (Auto)</label>
                                <input 
                                    type="number" className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white font-bold"
                                    value={dailyInstallment} onChange={e => setDailyInstallment(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Disbursement Source */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Wallet size={18} /> Disbursement Source
                    </h3>
                    
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={paymentMode === 'Single'} onChange={() => setPaymentMode('Single')} />
                            <span className="text-sm font-medium">Single Wallet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={paymentMode === 'Split'} onChange={() => setPaymentMode('Split')} />
                            <span className="text-sm font-medium">Split Payment</span>
                        </label>
                    </div>

                    {paymentMode === 'Single' ? (
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none bg-white"
                            value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)}
                        >
                            {wallets.map(w => (
                                <option key={w._id} value={w._id}>{w.name} (Bal: ₹{w.balance.toLocaleString()})</option>
                            ))}
                        </select>
                    ) : (
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Cash Source</label>
                                    <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white" value={splitCashWallet} onChange={e => setSplitCashWallet(e.target.value)}>
                                        {wallets.filter(w => w.type === 'Cash').map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Amount</label>
                                    <input type="number" placeholder="0" className="w-full border border-gray-300 rounded p-2 text-sm font-bold" value={splitCashAmount} onChange={e => setSplitCashAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Online Source</label>
                                    <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white" value={splitOnlineWallet} onChange={e => setSplitOnlineWallet(e.target.value)}>
                                        {wallets.filter(w => w.type === 'Online').map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Amount</label>
                                    <input type="number" placeholder="0" className="w-full border border-gray-300 rounded p-2 text-sm font-bold" value={splitOnlineAmount} onChange={e => setSplitOnlineAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className={`text-xs font-bold flex justify-between pt-2 border-t ${isSplitValid ? 'text-green-600' : 'text-red-500'}`}>
                                <span>Total Entered: ₹{currentSplitTotal}</span>
                                {isSplitValid && <span className="flex items-center gap-1"><Check size={14}/> Match</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. CUSTOM ADJUSTMENTS */}
                <fieldset className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <legend className="px-2 text-sm font-bold text-gray-600 flex items-center gap-2">
                        <Plus size={16} /> Additional Charges / Discounts
                    </legend>
                    <div className="space-y-3 mt-2">
                        {adjustments.map((item) => (
                            <div key={item.id} className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="Charge Name" 
                                    className="flex-[2] border border-gray-300 rounded-lg p-2 text-sm"
                                    value={item.name}
                                    onChange={e => updateAdjustment(item.id, 'name', e.target.value)}
                                />
                                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 h-[38px]">
                                    <button 
                                        type="button"
                                        onClick={() => updateAdjustment(item.id, 'type', 'Plus')}
                                        className={`px-3 rounded text-xs font-bold transition ${item.type === 'Plus' ? 'bg-green-500 text-white' : 'text-gray-400'}`}
                                    >
                                        +
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => updateAdjustment(item.id, 'type', 'Minus')}
                                        className={`px-3 rounded text-xs font-bold transition ${item.type === 'Minus' ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                                    >
                                        -
                                    </button>
                                </div>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    className={`flex-1 border rounded-lg p-2 text-sm font-bold text-right ${item.type === 'Plus' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
                                    value={item.amount}
                                    onChange={e => updateAdjustment(item.id, 'amount', e.target.value)}
                                />
                                <button onClick={() => removeAdjustment(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addAdjustment} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
                            + Add New Row
                        </button>
                    </div>
                </fieldset>

                {/* 5. NOTES / TERMS FIELD */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText size={18} /> Notes / Terms
                    </h3>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 resize-none outline-none focus:border-blue-500"
                        placeholder="e.g. Penalty applies if overdue > 100 days. Special repayment conditions..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">Optional</p>
                </div>

            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-6">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Disbursement Summary</h3>
                    
                    <div className="space-y-3 mb-6 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Principal Amount</span>
                            <span className="font-bold">₹ {principalAmount.toLocaleString()}</span>
                        </div>
                        
                        {adjustments.map(a => (
                            Number(a.amount) > 0 && (
                                <div key={a.id} className={`flex justify-between ${a.type === 'Plus' ? 'text-green-600' : 'text-red-500'}`}>
                                    <span>{a.name || 'Untitled'}</span>
                                    <span>{a.type === 'Plus' ? '+' : '-'} ₹ {Number(a.amount).toLocaleString()}</span>
                                </div>
                            )
                        ))}

                        {/* Interest Upfront Summary */}
                        {upfrontInterest > 0 && (
                            <div className="flex justify-between text-red-500 font-medium bg-red-50 p-1 rounded">
                                <span>Upfront Interest</span>
                                <span>- ₹ {upfrontInterest.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between text-lg font-bold text-gray-900 mt-2">
                            <span>Net Cash to Give</span>
                            <span className="text-green-600">₹ {netDisbursement.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <h4 className="font-bold text-blue-800 text-sm mb-2">Repayment Schedule</h4>
                        {loanType === 'Daily' ? (
                            <>
                                <p className="text-sm text-blue-700 flex justify-between">
                                    <span>Daily Due:</span> 
                                    <strong>₹{dailyInstallment || 0}</strong>
                                </p>
                                <p className="text-sm text-blue-700 flex justify-between mt-1">
                                    <span>Duration:</span> 
                                    <strong>{totalDays} Days</strong>
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-blue-700 flex justify-between">
                                <span>Monthly Interest:</span> 
                                <strong>₹{Math.round((principalAmount * interestRate) / 100).toLocaleString()} / month</strong>
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={handleCreateLoan}
                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition transform active:scale-95"
                    >
                        Create Loan <ArrowRight size={20} />
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default LoanOrigination;