import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Claim, ClaimDocument } from './schemas/claim.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { ClaimStatus } from './enums/claim-status.enum';
import { ActivityType } from './enums/activity-type.enum';
import { CreateClaimDto } from './dto/create-claim.dto';
import { QueryClaimsDto } from './dto/query-claims.dto';
import { ClaimDecisionDto, DecisionAction } from './dto/decision.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
    private readonly uploadsService: UploadsService,
  ) {}

  // ─── Claim ID Generation ───────────────────────────────────────────────────

  /**
   * Atomically increment and return the next claim sequence for the current year.
   * Counter key: "CLM-{YEAR}" — resets each calendar year.
   * Result format: "CLM-2026-00001"
   */
  private async generateClaimId(): Promise<string> {
    const year = new Date().getFullYear();
    const counterKey = `CLM-${year}`;

    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: 1 } },
      { upsert: true, new: true },
    );

    const paddedSeq = String(counter.seq).padStart(5, '0');
    return `${counterKey}-${paddedSeq}`;
  }

  // ─── Claim Submission ──────────────────────────────────────────────────────

  async createClaim(
    dto: CreateClaimDto,
    patient: UserDocument,
  ): Promise<ClaimDocument> {
    const claimId = await this.generateClaimId();
    const now = new Date();

    // Resolve document metadata for any keys provided
    const documents = dto.documentKeys
      ? await this.uploadsService.resolveDocumentMetas(dto.documentKeys)
      : [];

    const claim = await this.claimModel.create({
      claimId,
      patientId: patient._id,
      patientName: patient.name,
      patientEmail: patient.email,
      claimAmount: dto.claimAmount,
      description: dto.description,
      documents,
      status: ClaimStatus.PENDING,
      approvedAmount: null,
      insurerComments: null,
      submittedAt: now,
      decidedAt: null,
      activity: [
        {
          type: ActivityType.CLAIM_SUBMITTED,
          message: `Claim submitted by ${patient.name} for ₹${(dto.claimAmount / 100).toFixed(2)}.`,
          timestamp: now,
        },
      ],
    });

    return claim;
  }

  // ─── Patient Queries ───────────────────────────────────────────────────────

  /**
   * List all claims belonging to the authenticated patient, newest first.
   */
  async getPatientClaims(patientId: string): Promise<ClaimDocument[]> {
    return this.claimModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ submittedAt: -1 })
      .exec();
  }

  /**
   * Get a single claim by its human-readable claimId.
   * Enforces ownership for patients; insurers can access any claim.
   */
  async getClaimByClaimId(
    claimId: string,
    requestingUser: UserDocument,
  ): Promise<ClaimDocument> {
    const claim = await this.claimModel.findOne({ claimId }).exec();

    if (!claim) {
      throw new NotFoundException(`Claim '${claimId}' not found.`);
    }

    if (requestingUser.role === Role.PATIENT) {
      if (claim.patientId.toString() !== (requestingUser._id as Types.ObjectId).toString()) {
        throw new ForbiddenException('You do not have access to this claim.');
      }
    }

    return claim;
  }

  // ─── Insurer Queries ───────────────────────────────────────────────────────

  /**
   * List all claims with optional filtering and pagination.
   * Server-side filtering via MongoDB query — not in-memory.
   */
  async getAllClaims(query: QueryClaimsDto): Promise<{
    data: ClaimDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: FilterQuery<ClaimDocument> = {};
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    if (query.status) {
      filter.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      filter.submittedAt = {};
      if (query.fromDate) filter.submittedAt.$gte = new Date(query.fromDate);
      if (query.toDate) {
        // Include the full day
        const end = new Date(query.toDate);
        end.setHours(23, 59, 59, 999);
        filter.submittedAt.$lte = end;
      }
    }

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      filter.claimAmount = {};
      if (query.minAmount !== undefined) filter.claimAmount.$gte = query.minAmount;
      if (query.maxAmount !== undefined) filter.claimAmount.$lte = query.maxAmount;
    }

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { claimId: searchRegex },
        { patientName: searchRegex },
        { patientEmail: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.claimModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).exec(),
      this.claimModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Insurer Decision ──────────────────────────────────────────────────────

  async makeDecision(
    claimId: string,
    dto: ClaimDecisionDto,
  ): Promise<ClaimDocument> {
    const claim = await this.claimModel.findOne({ claimId }).exec();

    if (!claim) {
      throw new NotFoundException(`Claim '${claimId}' not found.`);
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new ConflictException(
        `Claim '${claimId}' has already been decided (status: ${claim.status}).`,
      );
    }

    const now = new Date();

    if (dto.action === DecisionAction.APPROVE) {
      if (dto.approvedAmount === undefined) {
        throw new BadRequestException('approvedAmount is required when approving a claim.');
      }

      if (dto.approvedAmount > claim.claimAmount) {
        throw new BadRequestException(
          `Approved amount (${dto.approvedAmount} paise) cannot exceed the requested claim amount (${claim.claimAmount} paise).`,
        );
      }

      claim.status = ClaimStatus.APPROVED;
      claim.approvedAmount = dto.approvedAmount;
      claim.insurerComments = dto.insurerComments ?? null;
      claim.decidedAt = now;
      claim.activity.push({
        type: ActivityType.CLAIM_APPROVED,
        message: `Claim approved with an approved amount of ₹${(dto.approvedAmount / 100).toFixed(2)}.${dto.insurerComments ? ` Note: ${dto.insurerComments}` : ''}`,
        timestamp: now,
      });
    } else {
      // REJECT
      if (!dto.insurerComments || dto.insurerComments.trim().length < 5) {
        throw new BadRequestException('A rejection reason (insurerComments) is required.');
      }

      claim.status = ClaimStatus.REJECTED;
      claim.approvedAmount = null;
      claim.insurerComments = dto.insurerComments;
      claim.decidedAt = now;
      claim.activity.push({
        type: ActivityType.CLAIM_REJECTED,
        message: `Claim rejected. Reason: ${dto.insurerComments}`,
        timestamp: now,
      });
    }

    await claim.save();
    return claim;
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  /**
   * Aggregate claim statistics using MongoDB pipeline.
   * Does not load all claims into application memory.
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRequestedAmount: number;
    totalApprovedAmount: number;
  }> {
    const result = await this.claimModel
      .aggregate<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        totalRequestedAmount: number;
        totalApprovedAmount: number;
      }>([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', ClaimStatus.PENDING] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', ClaimStatus.APPROVED] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', ClaimStatus.REJECTED] }, 1, 0] },
            },
            totalRequestedAmount: { $sum: '$claimAmount' },
            totalApprovedAmount: {
              $sum: { $ifNull: ['$approvedAmount', 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            pending: 1,
            approved: 1,
            rejected: 1,
            totalRequestedAmount: 1,
            totalApprovedAmount: 1,
          },
        },
      ])
      .exec();

    if (result.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalRequestedAmount: 0,
        totalApprovedAmount: 0,
      };
    }

    return result[0];
  }
}
