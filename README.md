# MediClaim

**Claims, made clear.**

MediClaim is a healthcare claims management platform that provides distinct, role-based workflows for patients and insurers. 

Patients can submit reimbursement claims, upload supporting medical evidence (bills, prescriptions, diagnostic reports), and track real-time claim status and decision details. Insurers can search, filter, inspect medical evidence, and record approval or rejection decisions with custom reimbursement amounts.

---

## Features

### Patient Experience
- **Personalized Overview Dashboard**: Real-time summary metrics (Total Claims, Pending Review, Approved Claims, Total Reimbursed Amount) formatted in Indian Rupees (₹).
- **Claim Submission**: Focused, multi-section form accepting claim descriptions, rupee amounts, and supporting document attachments.
- **Drag-and-Drop File Uploads**: Client-side format (PDF, JPG, PNG) and size validation (max 10MB) with upload preview and removal.
- **Submission Confirmation**: Immediate post-submission view displaying reference ID, timestamp, and requested amount.
- **Claim Detail & Document Viewer**: View treatment description, policyholder details, supporting documents, and decision banners.
- **Claim Activity History**: Chronological record of all claim events (`CLAIM_SUBMITTED`, `CLAIM_APPROVED`, `CLAIM_REJECTED`).

### Insurer Experience
- **Insurer Operational Dashboard**: Aggregated operational metrics (Total, Pending, Approved, Rejected) and financial summary (Total Requested vs. Total Approved).
- **Workload Distribution Bar**: Visual progress indicator representing real-time claim status breakdown.
- **Prioritised "Needs Review" Queue**: Rapid review access to incoming pending claims.
- **Server-Side Search & Filtering**: Debounced multi-field search (Claim ID, Patient Name, Patient Email) combined with status, date range (`fromDate`, `toDate`), and amount range (`minAmount`, `maxAmount`) filters.
- **Dense Data Management Table**: Desktop scannable table and mobile stacked card layout with pagination controls (`Previous` / `Next`).
- **Claim Review Workspace**: Two-column layout pairing patient details, treatment description, and document evidence alongside an interactive decision panel.
- **Decision Confirmation Modal**: Confirmation dialog step summarizing decision terms before recording irreversible state changes.
- **Read-Only Decided Claims**: Prevents accidental re-decision of already-decided claims.

### Platform & Security
- **JWT Authentication & Server-Side RBAC**: Stateless authentication backed by NestJS `JwtAuthGuard` and `@Roles()` decorator enforced via `RolesGuard`.
- **Patient Data Ownership**: Patients can strictly access only their own claims and attached documents; insurers have full administrative visibility.
- **Persistent Document Storage**: MongoDB-backed file metadata (`UploadMetadata` schema) ensuring uploaded evidence metadata survives backend restarts.
- **Integer Paise Money Architecture**: Prevents floating-point rounding drift by storing and processing all monetary values in integer paise.

---

## Tech Stack

| Layer | Technologies Used |
|-------|-------------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Hook Form, Zod, Lucide React |
| **Backend** | NestJS, TypeScript, MongoDB, Mongoose, Passport.js, JWT, bcrypt, Multer |
| **Testing & Tooling** | Jest, ts-node, ESLint, PostCSS |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               MediClaim Client (React)                 │
│  - AuthContext (JWT)     - TanStack Query (Caching)    │
│  - Patient Portal        - Insurer Workspace           │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│              MediClaim Backend (NestJS)                │
│  - AuthModule (bcrypt/JWT) - ClaimsModule (Lifecycle)  │
│  - UsersModule (RBAC)      - UploadsModule (Multer)    │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
┌───────────────────────────▼────────────────────────────┐
│                    MongoDB Database                    │
│  - users      - claims     - uploadmetadata - counters │
└────────────────────────────────────────────────────────┘
```

---

## Claim Lifecycle

```
    [ Patient ]                            [ Insurer ]
Submit Claim + Document ──►  PENDING  ──► Search & Review
                               │
                       ┌───────┴───────┐
                       ▼               ▼
                   APPROVED        REJECTED
                       │               │
        Approved Amount (₹)     Rejection Reason
                       └───────┬───────┘
                               ▼
                    Patient Views Decision &
                  Claim Activity Timeline
```

---

## Key Engineering Decisions

1. **Integer Paise Storage**: Monetary values are stored and transmitted as integers in the smallest currency unit (paise: 1 INR = 100 paise) to eliminate floating-point arithmetic errors. Frontend formatters convert paise to INR for display (e.g. `2500000 paise` → `₹25,000`).
2. **Atomic Human-Readable Claim IDs**: Claim reference IDs (`CLM-YYYY-NNNNN`, e.g., `CLM-2026-00001`) are generated server-side using an atomic MongoDB `$inc` counter on a dedicated `Counter` collection.
3. **Server-Side Authorization Depth**: Frontend route guards provide smooth UX redirects, while server-side NestJS guards (`JwtAuthGuard` and `RolesGuard`) authoritatively enforce role and ownership checks.
4. **Persistent Upload Metadata**: Uploaded document metadata is persisted in a MongoDB `UploadMetadata` collection upon upload, ensuring metadata survives server restarts.
5. **Claim Activity History**: Each claim lifecycle event appends an event to the claim's `activity[]` array with its timestamp and description, providing a chronological record of submission and insurer decisions.

---

## Repository Structure

```
MediClaim/
├── backend/                  # NestJS TypeScript backend API
│   ├── src/
│   │   ├── auth/             # JWT login, strategies, guards, decorators
│   │   ├── users/            # User schema (select: false passwordHash), service
│   │   ├── claims/           # Claims service, controller, DTOs, schemas
│   │   ├── uploads/          # Document upload, storage, UploadMetadata schema
│   │   └── seed/             # Idempotent seed script
│   ├── .env.example          # Backend environment template
│   └── package.json
├── frontend/                 # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/       # Design system components & AppShell layout
│   │   ├── features/auth/    # AuthContext & session management
│   │   ├── lib/              # API client & formatters (paise ↔ INR)
│   │   ├── pages/            # Login, Patient & Insurer screens
│   │   └── services/         # Axios API service layers
│   ├── .env.example          # Frontend environment template
│   └── package.json
├── docs/
│   └── screenshots/          # Application screenshot assets
└── README.md
```

---

## Local Setup & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Community Edition running locally on default port `27017` (or remote MongoDB URI)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Seed demo users and claims database
npm run seed

# Start NestJS development server
npm run start:dev
```

The backend server will run on **http://localhost:3000**.

### 2. Frontend Setup

```bash
# Open a new terminal tab and navigate to frontend directory
cd frontend

# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will run on **http://localhost:5173**.

---

## Demo Accounts

After running `npm run seed`, use these credentials or the one-click demo login buttons on the sign-in screen:

| Role | Email | Password | Access Rights |
|------|-------|----------|---------------|
| **Patient** | `priya.sharma@example.com` | `Patient@123` | Submit claims, upload evidence, track own claims |
| **Insurer** | `claims@healthsure.in` | `Insurer@123` | Search all claims, view evidence, approve/reject claims |

---

## API Overview

### Authentication (`/auth`)
- `POST /auth/login` — Validate credentials & issue JWT (Public)
- `GET /auth/me` — Retrieve current authenticated user profile (Authenticated)

### Claims (`/claims`)
- `POST /claims` — Submit a new reimbursement claim (Patient only)
- `GET /claims/my` — Fetch current patient's claims list (Patient only)
- `GET /claims/stats` — Aggregate operational and financial statistics (Insurer only)
- `GET /claims` — Query all claims with search, status, date, amount, and pagination filters (Insurer only)
- `GET /claims/:claimId` — Fetch claim details by human-readable ID (Patient own / Insurer)
- `PATCH /claims/:claimId/decision` — Approve or reject a claim with amount and comments (Insurer only)

### Uploads (`/uploads`)
- `POST /uploads` — Upload supporting document file (Patient only)
- `GET /uploads/file/:filename` — Serve document file with Content-Type headers (Authenticated, ownership check)

---

## Testing & Build Verification

```bash
# Run backend Jest unit tests
cd backend && npm test

# Run backend TypeScript compilation check
cd backend && npx tsc --noEmit

# Run frontend TypeScript compilation check
cd frontend && npx tsc --noEmit

# Run frontend production build
cd frontend && npm run build
```
