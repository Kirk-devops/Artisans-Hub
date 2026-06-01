# Artisans Hub - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APPLICATIONS                      │
│         ┌──────────────────┬──────────────────┐            │
│         │   iOS App        │   Android App    │            │
│         │  (React Native)  │  (React Native)  │            │
│         └────────┬─────────┴────────┬─────────┘            │
│                  │                  │                       │
│                  └──────────┬───────┘                       │
│                             │                               │
├─────────────────────────────┼───────────────────────────────┤
│                             │                               │
│           API GATEWAY (Express.js)                          │
│              ↓              │              ↓                │
│        Authentication    Routes         Validation          │
│                             │                               │
├────────────────────────────┼────────────────────────────────┤
│                            │                                │
│          BUSINESS LOGIC LAYER                               │
│     ┌──────────────────────┴────────────────────┐          │
│     ↓          ↓           ↓          ↓         ↓          │
│   Auth      Users        Jobs      Payments   Ratings       │
│ Controllers Controllers Controllers Controllers Controllers │
│                                                             │
├───────────────────────────────────���────────────────────────┤
│                                                             │
│              DATA ACCESS LAYER                              │
│  ┌──────────────┬──────────────┬────────────────┐         │
│  ↓              ↓              ↓                ↓         │
│PostgreSQL   Redis Cache    File Storage     Logs          │
│ Database     (Optional)      (S3/Local)                    │
│                                                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│           EXTERNAL SERVICES                                 │
│  ┌──────────────┬──────────────┬────────────────┐         │
│  ↓              ↓              ↓                ↓         │
│Mobile Money   Email        SMS           Analytics         │
│ (Momo API)   (Nodemailer)  (Twilio)        (Mixpanel)      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables
1. **users** - User profiles (artisans, employers, admin)
2. **jobs** - Job postings and assignments
3. **payments** - Payment transactions
4. **ratings** - User ratings and reviews
5. **disputes** - Dispute management
6. **verification_documents** - User verification files

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [ /* additional details */ ]
  }
}
```

## Authentication Flow

```
1. User Registration
   ↓
2. Email Verification
   ↓
3. User Login
   ↓
4. JWT Token Generation
   ↓
5. Token Stored in Mobile/Web
   ↓
6. Token Sent with API Requests
   ↓
7. Token Validation Middleware
```

## Payment Flow

```
1. Employer posts job with cost
   ↓
2. Employer pays to Admin account
   ↓
3. Payment verified by system
   ↓
4. Artisan accepts/completes job
   ↓
5. Employer confirms completion
   ↓
6. Admin deducts 15% commission
   ↓
7. Remaining 85% sent to Artisan's Momo
```

## File Structure

```
backend/
├── src/
│   ├── controllers/       # Business logic
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication, validation
│   ├── utils/             # Helper functions
│   ├── services/          # External service integrations
│   └── index.js           # Entry point
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── config/
│   └── database.js        # Database configuration
├── migrations/            # Database migrations
└── package.json
```

## Key Features Implementation Priority

### Phase 1 (MVP)
- User authentication (Register/Login)
- User profiles
- Job posting and browsing
- Basic payment processing
- Rating system

### Phase 2 (Enhancement)
- Dispute resolution
- Admin dashboard
- Advanced filtering
- Push notifications

### Phase 3 (Scaling)
- Analytics
- Machine learning recommendations
- Multi-currency support
- Advanced reporting

---
**Last Updated:** June 1, 2026
