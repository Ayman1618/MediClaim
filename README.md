# MediClaim

**Claims, made clear.**

MediClaim is a full-stack healthcare claims management platform with separate workflows for patients and insurers. Patients can submit claims with supporting documents and track decisions, while insurers can review, filter, approve, or reject claims.

## Features

- Role-based Patient and Insurer workspaces
- Claim submission with PDF/JPG/PNG evidence
- Claim status and activity tracking
- Insurer search, filtering, and review queue
- Full/partial reimbursement approval and rejection
- Protected document access with patient ownership checks
- Responsive operational dashboards

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query  
**Backend:** NestJS, TypeScript, MongoDB, Mongoose, JWT, bcrypt  
**Testing:** Jest

## How It Works

```text
Patient submits claim
        ↓
     PENDING
        ↓
  Insurer reviews
     ↙       ↘
APPROVED   REJECTED
     ↘       ↙
 Patient sees decision
```

## Engineering Highlights

- **Integer paise storage** for reliable monetary calculations.
- **Atomic claim IDs** such as `CLM-2026-00014` using MongoDB counters.
- **Server-side RBAC & ownership checks** for patient and insurer access.
- **Protected document access** with persistent upload metadata.
- **Claim activity history** for submission and decision events.

## Run Locally

**Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run start:dev
```

**Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Patient | `priya.sharma@example.com` | `Patient@123` |
| Insurer | `claims@healthsure.in` | `Insurer@123` |

## Verification

- Backend Jest tests: **9/9 passing**
- Frontend & backend TypeScript checks: **0 errors**
- Production builds: **passing**
- Complete Patient → Insurer → Patient workflow: **verified**
