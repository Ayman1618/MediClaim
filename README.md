# MediClaim — Claims, made clear.

A minimal, production-style healthcare claims management platform connecting patients and insurers.

---

## Project Structure

```
MediClaim/
├── backend/    # NestJS · TypeScript · MongoDB
├── frontend/   # React · TypeScript · Vite · Tailwind
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or provide a remote URI)

### Backend

```bash
cd backend
cp .env.example .env          # fill in values
npm install
npm run seed                  # seed demo data
npm run start:dev
```

Backend runs on **http://localhost:3000**

### Frontend

```bash
cd frontend
cp .env.example .env.local    # set VITE_API_URL
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Demo Credentials (after seeding)

| Role    | Email                    | Password       |
|---------|--------------------------|----------------|
| Patient | priya.sharma@example.com | Patient@123    |
| Insurer | claims@healthsure.in     | Insurer@123    |

---

## Key Architecture Decisions

### Money Handling
All monetary values are stored and transmitted as **integers in paise** (1 INR = 100 paise). This avoids floating-point drift. The frontend is responsible for formatting display values (e.g. ₹1,250.00 from 125000 paise).

### Human-Readable Claim IDs
Claims receive a sequential identifier in the format `CLM-YYYY-NNNNN` (e.g. `CLM-2026-00001`). Generated server-side using an atomic MongoDB counter — safe without a distributed lock manager.

### Role-Based Access
Backend enforces all authorization rules via `JwtAuthGuard` + `RolesGuard`. Frontend route guards are UX — they are not a substitute for server-side authorization.

### File Uploads
Documents stored in `backend/uploads/` with UUID-based filenames. The `UploadsModule` abstracts the storage layer so it can later be swapped for S3/Azure without touching business logic.

### Audit History
Every state transition (submit, approve, reject) appends an immutable activity entry to the claim document. No synthetic events are created.

---

## API Overview

### Auth
| Method | Path | Access |
|--------|------|--------|
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |

### Claims — Patient
| Method | Path | Access |
|--------|------|--------|
| POST | `/claims` | PATIENT |
| GET | `/claims/my` | PATIENT |
| GET | `/claims/:claimId` | PATIENT (own) |

### Claims — Insurer
| Method | Path | Access |
|--------|------|--------|
| GET | `/claims` | INSURER |
| GET | `/claims/stats` | INSURER |
| GET | `/claims/:claimId` | INSURER |
| PATCH | `/claims/:claimId/decision` | INSURER |

### Uploads
| Method | Path | Access |
|--------|------|--------|
| POST | `/uploads` | PATIENT |
| GET | `/uploads/file/:filename` | Authenticated (ownership enforced) |

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.
