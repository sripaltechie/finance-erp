export const PLATFORMS = [
  { id: 'mobile', label: 'Mobile App Only' },
  { id: 'web', label: 'Web Admin Only' },
  { id: 'combo', label: 'Mobile + Web (Combo)' },
];

export const DURATIONS = [
  { id: 1, label: 'Monthly', discount: 0 },
  { id: 6, label: '6 Months', discount: 10 }, // 10% off
  { id: 12, label: '1 Year', discount: 20 },  // 20% off
  { id: 36, label: '3 Years', discount: 40 }, // 40% off
];

// Base Prices (Monthly) - Calculator will apply duration discounts
export const BASE_PRICES = {
  mobile: { silver: 499, gold: 999, platinum: 1999 },
  web: { silver: 799, gold: 1499, platinum: 2999 },
  combo: { silver: 1199, gold: 2199, platinum: 4500 }
};

export const PLANS = [
  { 
    id: 'silver',
    name: 'Silver',
    color: '#94a3b8', // Slate-400
    limitations: {
      maxCompanies: 1,
      maxStaffPerCompany: 2,
      maxCustomers: 100,
      maxLoans: 150,
      maxPaymentModes: 3, // Basic: Cash, Bank, Split
      hasRouteNavigation: false,
      hasCustomBranding: false
    },
    features: ['Up to 100 Customers', 'Basic Reports', 'Single Company', 'Email Support', 'No Custom Branding'],
    allFeatures: ['100 Customers Limit', 'Daily Collection', 'Basic PDF Reports', '1 Company', 'Email Support', 'No Data Export', 'Standard Speed']
  },
  {
    id: 'gold',
    name: 'Gold',
    color: '#eab308', // Yellow-500
    recommended: true,
    limitations: {
      maxCompanies: 3,
      maxStaffPerCompany: 10,
      maxCustomers: 1000,
      maxLoans: 1500,
      maxPaymentModes: 5, // Custom modes like "Cheque", "Gold", etc.
      hasRouteNavigation: false,
      hasCustomBranding: false
    },
    features: ['Up to 1000 Customers', 'Advanced Analytics', '3 Companies', 'WhatsApp Reminders', 'Priority Support'],
    allFeatures: ['1000 Customers Limit', 'Daily + Monthly Logic', 'Advanced Excel Exports', '3 Companies', 'WhatsApp Integration', 'Priority Email Support', 'High Speed Server']
  },
  {
    id: 'platinum',
    name: 'Platinum',
    color: '#3b82f6', // Blue-500
    limitations: {
      maxCompanies: 999, // Unlimited
      maxStaffPerCompany: 999,
      maxCustomers: 999999,
      maxLoans: 999999,
      maxPaymentModes: 99, // Unlimited
      hasRouteNavigation: true, // 🟢 Route Line Feature
      hasCustomBranding: true
    },
    features: ['Unlimited Customers', 'AI Credit Score', 'Unlimited Companies', 'White Labeling', 'Dedicated Manager'],
    allFeatures: ['Unlimited Customers', 'AI Credit Scoring', 'Unlimited Companies', 'White Labeling (Your Logo)', '24/7 Phone Support', 'Dedicated Server', 'Automated Backups']
  }
];