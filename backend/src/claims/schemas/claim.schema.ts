import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClaimStatus } from '../enums/claim-status.enum';
import { ActivityType } from '../enums/activity-type.enum';

export type ClaimDocument = HydratedDocument<Claim>;

// ─── Sub-documents ────────────────────────────────────────────────────────────

/**
 * Metadata about a supporting document file uploaded with a claim.
 * Filesystem paths are never stored; only safe metadata.
 */
@Schema({ _id: false })
export class DocumentMeta {
  /** Original filename as uploaded by the patient */
  @Prop({ required: true })
  originalName!: string;

  /** UUID-based stored filename — no path traversal risk */
  @Prop({ required: true })
  storedName!: string;

  /** Validated MIME type (application/pdf, image/jpeg, image/png) */
  @Prop({ required: true })
  mimeType!: string;

  /** File size in bytes */
  @Prop({ required: true })
  size!: number;

  @Prop({ required: true, default: () => new Date() })
  uploadedAt!: Date;
}

export const DocumentMetaSchema = SchemaFactory.createForClass(DocumentMeta);

/**
 * An immutable activity entry in the claim's audit trail.
 */
@Schema({ _id: false })
export class ActivityEntry {
  @Prop({ required: true, enum: ActivityType })
  type!: ActivityType;

  /** Human-readable description of the event */
  @Prop({ required: true })
  message!: string;

  @Prop({ required: true, default: () => new Date() })
  timestamp!: Date;
}

export const ActivityEntrySchema = SchemaFactory.createForClass(ActivityEntry);

// ─── Claim ────────────────────────────────────────────────────────────────────

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete ret['__v'];
      return ret;
    },
  },
})
export class Claim {
  /**
   * Human-readable claim identifier, e.g. CLM-2026-00001.
   * Generated server-side from an atomic counter. Unique index enforced.
   */
  @Prop({ required: true, unique: true })
  claimId!: string;

  /** Reference to the patient User document */
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  patientId!: Types.ObjectId;

  /** Denormalised patient name for display — sourced from JWT at submission */
  @Prop({ required: true, trim: true })
  patientName!: string;

  /** Denormalised patient email — sourced from JWT at submission */
  @Prop({ required: true, lowercase: true, trim: true })
  patientEmail!: string;

  /**
   * Requested claim amount in paise (1 INR = 100 paise).
   * Integer representation avoids floating-point drift.
   * Must be > 0.
   */
  @Prop({ required: true, min: 1 })
  claimAmount!: number;

  @Prop({ required: true, trim: true })
  description!: string;

  /** Uploaded supporting documents */
  @Prop({ type: [DocumentMetaSchema], default: [] })
  documents!: DocumentMeta[];

  @Prop({ required: true, enum: ClaimStatus, default: ClaimStatus.PENDING })
  status!: ClaimStatus;

  /**
   * Approved amount in paise.
   * Set when status = APPROVED. Must be >= 0 and <= claimAmount.
   */
  @Prop({ type: Number, default: null })
  approvedAmount!: number | null;

  @Prop({ type: String, default: null })
  insurerComments!: string | null;

  @Prop({ required: true })
  submittedAt!: Date;

  /** Timestamp when the insurer made their decision */
  @Prop({ type: Date, default: null })
  decidedAt!: Date | null;

  /** Append-only audit trail. Never modified, only pushed to. */
  @Prop({ type: [ActivityEntrySchema], default: [] })
  activity!: ActivityEntry[];
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);

// Indexes for common query patterns
ClaimSchema.index({ patientId: 1, submittedAt: -1 });
ClaimSchema.index({ status: 1 });
ClaimSchema.index({ submittedAt: -1 });
// Note: claimId unique index is already created by the @Prop({ unique: true }) decorator above

