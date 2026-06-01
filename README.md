# Artisans Hub 🏗️

A cross-platform mobile application connecting skilled artisans with contractors and individuals who need their services. Built for iOS and Android.

## 📋 Project Overview

**Artisans Hub** is a marketplace platform where:
- **Artisans** (Masons, Plumbers, Carpenters, Electricians, Helpers/Labourers) showcase their skills and receive job offers
- **Employers** (Contractors, Individuals) post jobs and hire artisans
- **Admin** manages platform, processes payments, and takes 15% commission per job day

## 🎯 Key Features

### For Artisans
- ✅ User registration and profile creation
- ✅ Rate setting per day (250-300 GHC for skilled artisans, 180-200 GHC for helpers)
- ✅ Job browsing and acceptance
- ✅ Work status tracking
- ✅ Rating and review system
- ✅ Payment history and withdrawal to Mobile Money (Momo)

### For Employers
- ✅ User registration and verification
- ✅ Job posting with work type specification
- ✅ Artisan search and selection
- ✅ Secure payment (pre-pay to admin account)
- ✅ Work tracking and confirmation
- ✅ Rating artisans
- ✅ Invoice and payment receipt generation

### Admin Dashboard
- ✅ User management (Artisans & Employers)
- ✅ Job management and monitoring
- ✅ Payment processing and settlement
- ✅ Commission tracking (15% deduction)
- ✅ Terms & Conditions management
- ✅ Financial reports and analytics
- ✅ Dispute resolution

## 💰 Pricing Structure

| Work Type | Artisan Rate/Day | Helper/Labourer Rate/Day | Admin Commission (15%) |
|-----------|------------------|--------------------------|------------------------|
| Block Laying | 250-300 GHC | 180-200 GHC | 15% |
| Concrete Works | 300 GHC | 250 GHC | 15% |
| Plumbing | 250-300 GHC | 180-200 GHC | 15% |
| Carpentry | 250-300 GHC | 180-200 GHC | 15% |
| Electrical | 250-300 GHC | 180-200 GHC | 15% |

### Payment Flow Example
**Scenario:** Employer hires carpenter for 3 days @ 280 GHC/day
- Total: 3 × 280 = 840 GHC
- Employer pays: 840 GHC to admin
- Admin deducts 15%: 840 × 0.15 = 126 GHC
- Artisan receives: 840 - 126 = 714 GHC → Sent to Momo

## 🏗️ Project Structure

```
artisans-hub/
├── frontend/
│   ├── mobile/              # React Native app (iOS & Android)
│   └── web/                 # Admin Dashboard (React)
├── backend/
│   ├── api/                 # Express.js REST API
│   ├── models/              # Database models
│   ├── controllers/         # Business logic
│   ├── routes/              # API endpoints
│   └── middleware/          # Authentication, validation
├── database/
│   └── migrations/          # PostgreSQL migrations
├── docs/
│   ├── API.md               # API documentation
│   ├── TERMS.md             # Terms & Conditions
│   └── SETUP.md             # Setup guide
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development framework
- **Redux** - State management
- **React Navigation** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Momo API** - Mobile Money payments

### Admin Dashboard
- **React** - UI framework
- **Chart.js** - Analytics & reporting
- **Ant Design** - UI components

## 📱 Installation & Setup

### Prerequisites
- Node.js 14+
- npm or yarn
- Expo CLI (for mobile development)
- PostgreSQL 12+

### Quick Start

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm start
```

#### Mobile App Setup
```bash
cd frontend/mobile
npm install
npx expo start
```

#### Admin Dashboard
```bash
cd frontend/web
npm install
npm start
```

See [SETUP.md](docs/SETUP.md) for detailed instructions.

## 📖 API Documentation

Full API documentation available at [API.md](docs/API.md)

### Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/jobs` - Browse jobs
- `POST /api/jobs` - Post new job
- `POST /api/payments/process` - Process payment
- `GET /api/payments/history` - Payment history
- `POST /api/ratings` - Submit rating

## ⚖️ Terms & Conditions

Users must accept the Terms & Conditions upon registration. See [TERMS.md](docs/TERMS.md) for full details.

**Key Points:**
- 15% platform commission is deducted from each job payment
- All payments processed through admin account
- Artisan receives payment only after employer confirmation
- Disputes resolved by admin within 48 hours
- Mobile Money withdrawal available to verified artisans only

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password encryption (bcrypt)
- ✅ Secure payment processing
- ✅ Two-factor authentication (optional)
- ✅ Rate limiting
- ✅ Input validation & sanitization
- ✅ HTTPS enforcement

## 📊 Roles & Permissions

| User Type | Actions |
|-----------|---------|
| **Artisan** | Register, Set rates, Accept jobs, Update status, Submit ratings, View payments |
| **Employer** | Register, Post jobs, Select artisan, Make payment, Confirm work, Rate artisan |
| **Admin** | Manage users, Manage payments, Settle accounts, View reports, Manage disputes |

## 🚀 Development Roadmap

- [ ] Phase 1: Backend API & Database setup
- [ ] Phase 2: Mobile app (React Native)
- [ ] Phase 3: Admin Dashboard
- [ ] Phase 4: Payment integration (Momo)
- [ ] Phase 5: Testing & QA
- [ ] Phase 6: App Store & Play Store deployment

## 📝 License

This project is proprietary software. All rights reserved.

## 📧 Contact

For support or inquiries: admin@artisanshub.gh

---

**Last Updated:** June 1, 2026
