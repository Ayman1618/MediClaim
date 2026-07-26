/**
 * MediClaim — Seed Script
 *
 * Creates repeatable, idempotent demo data:
 *   - 1 patient: Priya Sharma
 *   - 1 insurer: HealthSure Claims
 *   - 10 realistic fictional claims with mixed statuses
 *
 * Running the seed twice will not duplicate data (upsert-based).
 *
 * Usage:
 *   npm run seed
 *
 * Demo credentials printed at the end.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve .env relative to the backend project root (where package.json lives)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

// ─── Inline Schema Definitions ─────────────────────────────────────────────────
// We import mongoose directly to avoid bootstrapping the full NestJS app.

const BCRYPT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: String,
  },
  { timestamps: true },
);

const DocumentMetaSchema = new mongoose.Schema(
  {
    originalName: String,
    storedName: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date,
  },
  { _id: false },
);

const ActivityEntrySchema = new mongoose.Schema(
  {
    type: String,
    message: String,
    timestamp: Date,
  },
  { _id: false },
);

const CounterSchema = new mongoose.Schema(
  { name: { type: String, unique: true }, seq: { type: Number, default: 0 } },
  { timestamps: false },
);

const ClaimSchema = new mongoose.Schema(
  {
    claimId: { type: String, unique: true },
    patientId: mongoose.Schema.Types.ObjectId,
    patientName: String,
    patientEmail: String,
    claimAmount: Number,
    description: String,
    documents: [DocumentMetaSchema],
    status: String,
    approvedAmount: { type: Number, default: null },
    insurerComments: { type: String, default: null },
    submittedAt: Date,
    decidedAt: { type: Date, default: null },
    activity: [ActivityEntrySchema],
  },
  { timestamps: true },
);

const UserModel = mongoose.model('User', UserSchema);
const ClaimModel = mongoose.model('Claim', ClaimSchema);
const CounterModel = mongoose.model('Counter', CounterSchema);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Atomically generate the next claim ID for seeding.
 */
async function nextClaimId(): Promise<string> {
  const year = new Date().getFullYear();
  const counterKey = `CLM-${year}`;
  const counter = await CounterModel.findOneAndUpdate(
    { name: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  const paddedSeq = String(counter!.seq).padStart(5, '0');
  return `${counterKey}-${paddedSeq}`;
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mediclaim';
  console.log(`\n🌱  Connecting to MongoDB: ${uri}`);

  await mongoose.connect(uri);
  console.log('✅  Connected\n');

  // ── Users ────────────────────────────────────────────────────────────────────

  const patientPassword = 'Patient@123';
  const insurerPassword = 'Insurer@123';

  const patientHash = await bcrypt.hash(patientPassword, BCRYPT_ROUNDS);
  const insurerHash = await bcrypt.hash(insurerPassword, BCRYPT_ROUNDS);

  const patient = await UserModel.findOneAndUpdate(
    { email: 'priya.sharma@example.com' },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      passwordHash: patientHash,
      role: 'PATIENT',
    },
    { upsert: true, new: true },
  );

  await UserModel.findOneAndUpdate(
    { email: 'claims@healthsure.in' },
    {
      name: 'HealthSure Claims',
      email: 'claims@healthsure.in',
      passwordHash: insurerHash,
      role: 'INSURER',
    },
    { upsert: true, new: true },
  );

  console.log('👤  Users seeded');

  // ── Claims ───────────────────────────────────────────────────────────────────
  // Only seed claims that don't already exist (keyed by description to keep idempotent)

  type ClaimSeed = {
    description: string;
    claimAmount: number; // paise
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAmount: number | null;
    insurerComments: string | null;
    submittedDaysAgo: number;
    decidedDaysAgo?: number;
  };

  const claimSeeds: ClaimSeed[] = [
    {
      description: 'Emergency appendectomy at Fortis Hospital, Bangalore. Includes surgeon fees, anaesthesia, and 3-day ward stay.',
      claimAmount: 18500000, // ₹1,85,000.00
      status: 'APPROVED',
      approvedAmount: 16000000, // ₹1,60,000.00
      insurerComments: 'Approved. Pre-authorised procedure. Standard ward rate applied; premium suite differential not covered per policy.',
      submittedDaysAgo: 45,
      decidedDaysAgo: 38,
    },
    {
      description: 'Cardiac catheterisation and stent placement at Apollo Hospitals, Chennai. Includes ICU stay (5 days).',
      claimAmount: 42000000, // ₹4,20,000.00
      status: 'APPROVED',
      approvedAmount: 38000000, // ₹3,80,000.00
      insurerComments: 'Approved. Life-saving intervention. Deduction applied for non-network consumables per clause 4.2.1.',
      submittedDaysAgo: 62,
      decidedDaysAgo: 55,
    },
    {
      description: 'MRI scan of lumbar spine (L4-L5 herniation assessment) at Manipal Hospitals. Radiologist report attached.',
      claimAmount: 850000, // ₹8,500.00
      status: 'APPROVED',
      approvedAmount: 850000,
      insurerComments: 'Approved in full. Medically necessary diagnostic procedure, within policy limits.',
      submittedDaysAgo: 18,
      decidedDaysAgo: 12,
    },
    {
      description: 'Physiotherapy — 12 sessions for post-surgical knee rehabilitation following ACL reconstruction. Therapist: Dr. Ramesh Iyer.',
      claimAmount: 360000, // ₹3,600.00
      status: 'REJECTED',
      approvedAmount: null,
      insurerComments: 'Rejected. Physiotherapy claims require a referral letter from the treating orthopaedic surgeon. Please resubmit with referral documentation (policy clause 8.3).',
      submittedDaysAgo: 10,
      decidedDaysAgo: 6,
    },
    {
      description: 'Hospitalisation for typhoid fever — 6 days at Narayana Health, Mysore. Includes IV antibiotics and investigations.',
      claimAmount: 5500000, // ₹55,000.00
      status: 'APPROVED',
      approvedAmount: 5200000, // ₹52,000.00
      insurerComments: 'Approved. Minor deduction for non-formulary antipyretics per policy schedule.',
      submittedDaysAgo: 30,
      decidedDaysAgo: 22,
    },
    {
      description: 'Cataract surgery (left eye) with premium IOL implant at Aravind Eye Hospital, Coimbatore.',
      claimAmount: 7500000, // ₹75,000.00
      status: 'REJECTED',
      approvedAmount: null,
      insurerComments: 'Rejected. Premium intraocular lens (IOL) upgrade is a patient-elected cosmetic enhancement not covered under the base plan. Standard IOL reimbursement requires resubmission with revised billing from the hospital.',
      submittedDaysAgo: 25,
      decidedDaysAgo: 19,
    },
    {
      description: 'Laparoscopic cholecystectomy (gallbladder removal) at KIMS Hospital, Hyderabad. Day-care procedure.',
      claimAmount: 9500000, // ₹95,000.00
      status: 'PENDING',
      approvedAmount: null,
      insurerComments: null,
      submittedDaysAgo: 3,
    },
    {
      description: 'Dengue fever hospitalisation — 4 days at Rainbow Hospital, Pune. Platelet transfusion (3 units) included.',
      claimAmount: 6200000, // ₹62,000.00
      status: 'PENDING',
      approvedAmount: null,
      insurerComments: null,
      submittedDaysAgo: 5,
    },
    {
      description: 'Annual health check-up package (comprehensive) at Metropolis Diagnostics. Includes lipid panel, HbA1c, thyroid, and chest X-ray.',
      claimAmount: 450000, // ₹4,500.00
      status: 'PENDING',
      approvedAmount: null,
      insurerComments: null,
      submittedDaysAgo: 1,
    },
    {
      description: 'Maternity — normal delivery at Cloudnine Hospital, Bangalore. Includes pre-natal consultations (6 visits) and post-natal care.',
      claimAmount: 12000000, // ₹1,20,000.00
      status: 'PENDING',
      approvedAmount: null,
      insurerComments: null,
      submittedDaysAgo: 2,
    },
  ];

  let seeded = 0;
  let skipped = 0;

  for (const seed of claimSeeds) {
    const exists = await ClaimModel.findOne({ description: seed.description });
    if (exists) {
      skipped++;
      continue;
    }

    const claimId = await nextClaimId();
    const submittedAt = daysAgo(seed.submittedDaysAgo);
    const decidedAt = seed.decidedDaysAgo != null ? daysAgo(seed.decidedDaysAgo) : null;

    const activity: Array<{ type: string; message: string; timestamp: Date }> = [
      {
        type: 'CLAIM_SUBMITTED',
        message: `Claim submitted by ${patient!.name} for ₹${(seed.claimAmount / 100).toFixed(2)}.`,
        timestamp: submittedAt,
      },
    ];

    if (seed.status === 'APPROVED' && decidedAt) {
      activity.push({
        type: 'CLAIM_APPROVED',
        message: `Claim approved with an approved amount of ₹${(seed.approvedAmount! / 100).toFixed(2)}.${seed.insurerComments ? ` Note: ${seed.insurerComments}` : ''}`,
        timestamp: decidedAt,
      });
    } else if (seed.status === 'REJECTED' && decidedAt) {
      activity.push({
        type: 'CLAIM_REJECTED',
        message: `Claim rejected. Reason: ${seed.insurerComments}`,
        timestamp: decidedAt,
      });
    }

    await ClaimModel.create({
      claimId,
      patientId: patient!._id,
      patientName: patient!.name,
      patientEmail: patient!.email,
      claimAmount: seed.claimAmount,
      description: seed.description,
      documents: [],
      status: seed.status,
      approvedAmount: seed.approvedAmount,
      insurerComments: seed.insurerComments,
      submittedAt,
      decidedAt,
      activity,
    });

    seeded++;
  }

  console.log(`📋  Claims: ${seeded} seeded, ${skipped} already existed`);

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║         MediClaim — Demo Credentials             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  PATIENT                                          ║');
  console.log('║  Email:    priya.sharma@example.com               ║');
  console.log('║  Password: Patient@123                            ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  INSURER                                          ║');
  console.log('║  Email:    claims@healthsure.in                   ║');
  console.log('║  Password: Insurer@123                            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  console.log('✅  Seed complete. MongoDB disconnected.\n');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
