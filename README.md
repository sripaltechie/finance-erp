# 🏦 Chanda Finance ERP (SaaS Platform)

A comprehensive, Multi-Tenant Financial Management Ecosystem designed for micro-finance firms, daily collection agents, and money lenders. Built with a scalable Monorepo structure using the MERN Stack and React Native.

## 🚀 Tech Stack
- **Backend:** Node.js, Express, MongoDB (Multi-Tenant Architecture)
- **Web Admin:** React.js + Vite + Tailwind CSS (Super Admin & Client Dashboards)
- **Mobile App:** React Native (Expo) (Field Collection & offline-first logic)

## 🌟 Key Features
- **Multi-Tenant SaaS:** Single backend supporting multiple distinct Finance Clients.
- **Hybrid Loan Logic:** Supports both **Daily Index Loans** (Partial payment logic) and **Monthly Reducing Balance** loans.
- **Credit Score Engine:** Automated custom credit scoring based on payment consistency.
- **Role-Based Access:** Super Admin → Client (Owner) → Company (Branch) → Staff (Collection Boy).
- **Smart Collection:** Android app with "Quick Add" shortcuts, route optimization, and voice reminders.
- **Audit Trails:** Full transaction logs and daybook generation.

## 📂 Project Structure
- `/backend`: API Service, Cron Jobs, and Database Models.
- `/admin-web`: Web-based dashboard for Owners to manage staff and approvals.
- `/collection-app`: Mobile application for field agents.

---
*Built for modern finance operations.*