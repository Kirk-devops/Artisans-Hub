# ARTISANS HUB - SETUP GUIDE

Complete setup instructions for development, testing, and deployment.

---

## 📋 Prerequisites

### System Requirements
- **Node.js:** v14.0 or higher
- **npm:** v6.0 or higher (or yarn v1.22+)
- **PostgreSQL:** v12.0 or higher
- **Git:** v2.20 or higher
- **Docker:** (Optional, for containerized deployment)

### Required Accounts
- GitHub (for version control)
- Apple Developer Account (for iOS deployment)
- Google Play Developer Account (for Android deployment)
- Mobile Money API credentials (for payment processing)

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Kirk-devops/artisans-hub.git
cd artisans-hub
```

### 2. Create Directory Structure

```bash
mkdir -p frontend/mobile
mkdir -p frontend/web
mkdir -p backend
mkdir -p database
mkdir -p docs
```

---

## 🖥️ Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Initialize Node Project

```bash
npm init -y
```

### Step 3: Install Dependencies

```bash
npm install express pg bcryptjs jsonwebtoken dotenv cors helmet express-validator
npm install --save-dev nodemon jest supertest
```

### Step 4: Create Environment File

```bash
cat > .env << EOF
# Server
PORT=3000
NODE_ENV=development
APP_NAME=Artisans Hub API

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=artisans_hub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Mobile Money
MOMO_API_KEY=your_momo_api_key
MOMO_API_SECRET=your_momo_api_secret
MOMO_BASE_URL=https://api.momoapi.example.com

# Admin Email
ADMIN_EMAIL=admin@artisanshub.gh
ADMIN_PHONE=+233XXXXXXXXXX

# Frontend URLs
FRONTEND_MOBILE_URL=https://mobile.artisanshub.gh
FRONTEND_WEB_URL=https://admin.artisanshub.gh

# Commission
PLATFORM_COMMISSION=0.15
EOF
```

### Step 5: Create PostgreSQL Database

```bash
createdb artisans_hub
psql artisans_hub
```

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('artisan', 'employer', 'admin')),
  profession VARCHAR(50),
  daily_rate DECIMAL(10, 2),
  momo_number VARCHAR(20),
  profile_photo URL,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  total_jobs INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP
);

-- Create jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(50) UNIQUE NOT NULL,
  employer_id INT REFERENCES users(id),
  artisan_id INT REFERENCES users(id),
  work_type VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  duration INT NOT NULL,
  daily_rate DECIMAL(10, 2),
  total_cost DECIMAL(12, 2),
  commission DECIMAL(12, 2),
  artisan_earnings DECIMAL(12, 2),
  description TEXT,
  specifications TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'in_progress', 'completed', 'cancelled')),
  progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  job_id INT REFERENCES jobs(id),
  amount DECIMAL(12, 2),
  commission_amount DECIMAL(12, 2),
  artisan_payment DECIMAL(12, 2),
  paid_by INT REFERENCES users(id),
  paid_to INT REFERENCES users(id),
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_ref VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create ratings table
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  rating_id VARCHAR(50) UNIQUE NOT NULL,
  job_id INT REFERENCES jobs(id),
  rated_by INT REFERENCES users(id),
  rated_user INT REFERENCES users(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  quality_rating INT,
  professionalism_rating INT,
  punctuality_rating INT,
  communication_rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create disputes table
CREATE TABLE disputes (
  id SERIAL PRIMARY KEY,
  dispute_id VARCHAR(50) UNIQUE NOT NULL,
  job_id INT REFERENCES jobs(id),
  reported_by INT REFERENCES users(id),
  reported_against INT REFERENCES users(id),
  reason TEXT,
  evidence_photos TEXT[],
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution VARCHAR(50),
  refund_amount DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Create verification_documents table
CREATE TABLE verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  document_type VARCHAR(50),
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_artisan_id ON jobs(artisan_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user);
CREATE INDEX idx_disputes_status ON disputes(status);
```

### Step 6: Create Basic API Structure

```bash
mkdir -p src/{controllers,models,routes,middleware,utils}
```

Create `src/index.js`:

```javascript
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 7: Start Backend Server

```bash
npm start
```

Expected output:
```
Server running on port 3000
```

---

## 📱 Mobile App Setup (React Native)

### Step 1: Navigate to Mobile Directory

```bash
cd ../frontend/mobile
```

### Step 2: Initialize Expo Project

```bash
npx create-expo-app artisans-hub-mobile
cd artisans-hub-mobile
```

### Step 3: Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install axios redux react-redux
npm install react-native-vector-icons
npm install react-native-geolocation-service
npm install react-native-maps
npm install expo-camera expo-image-picker
```

### Step 4: Create Environment File

```bash
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=30000
EOF
```

### Step 5: Start Development Server

```bash
npx expo start
```

Choose:
- Press `i` for iOS simulator
- Press `a` for Android emulator

---

## 🖥️ Admin Dashboard Setup (React Web)

### Step 1: Navigate to Web Directory

```bash
cd ../../frontend/web
```

### Step 2: Create React App

```bash
npx create-react-app admin-dashboard
cd admin-dashboard
```

### Step 3: Install Dependencies

```bash
npm install axios redux react-redux
npm install react-router-dom
npm install chart.js react-chartjs-2
npm install antd
npm install date-fns
npm install styled-components
```

### Step 4: Create Environment File

```bash
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=30000
EOF
```

### Step 5: Start Admin Dashboard

```bash
npm start
```

Access at: `http://localhost:3000`

---

## 🗄️ Database Backups

### Create Backup

```bash
pg_dump artisans_hub > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
psql artisans_hub < backup_20260601_120000.sql
```

---

## 🚀 Docker Setup (Optional)

### Create Dockerfile for Backend

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: artisans_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      NODE_ENV: development
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

volumes:
  postgres_data:
```

### Start with Docker

```bash
docker-compose up -d
```

---

## 📧 Email Configuration

### Install Email Package

```bash
cd backend
npm install nodemailer
```

### Create Email Service

```javascript
// src/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email send failed:', error);
  }
};

module.exports = { sendEmail };
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Create Test File

```javascript
// src/__tests__/auth.test.js
describe('Authentication', () => {
  test('should register new user', () => {
    // Test code
  });

  test('should login user', () => {
    // Test code
  });
});
```

---

## 🔐 Security Checklist

- [ ] Enable HTTPS in production
- [ ] Use strong JWT secret
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains
- [ ] Implement 2FA for admin accounts
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Use HTTPS for API calls

---

## 📱 Mobile App Deployment

### iOS Deployment

```bash
cd frontend/mobile
eas build --platform ios
eas submit --platform ios
```

### Android Deployment

```bash
eas build --platform android
eas submit --platform android
```

---

## 🌐 Production Deployment

### Environment Setup

```bash
# Production backend deployment
cd backend
npm install -g pm2
pm2 start src/index.js --name "artisans-hub-api"
pm2 save
pm2 startup
```

### Database Migration

```bash
npm run migrate:prod
```

### SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d api.artisanshub.gh
```

---

## 📊 Monitoring

### Install Monitoring Tools

```bash
npm install winston morgan
```

### Create Logger

```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL status
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart
```

### Dependency Issues

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For setup issues or questions:
- Email: support@artisanshub.gh
- Docs: https://docs.artisanshub.gh

---

**Setup Guide Version:** 1.0  
**Last Updated:** June 1, 2026
