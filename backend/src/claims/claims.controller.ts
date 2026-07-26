import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { CreateClaimDto } from './dto/create-claim.dto';
import { QueryClaimsDto } from './dto/query-claims.dto';
import { ClaimDecisionDto } from './dto/decision.dto';

@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ─── Patient Endpoints ─────────────────────────────────────────────────────

  /**
   * POST /claims
   * Submit a new claim. Patient role required.
   * Patient identity is derived from the JWT — not from the request body.
   */
  @Post()
  @Roles(Role.PATIENT)
  @HttpCode(HttpStatus.CREATED)
  async createClaim(
    @Body() dto: CreateClaimDto,
    @CurrentUser() user: UserDocument,
  ) {
    const claim = await this.claimsService.createClaim(dto, user);
    return claim.toJSON();
  }

  /**
   * GET /claims/my
   * Returns all claims for the authenticated patient, newest first.
   * Must be declared before /:claimId to avoid route shadowing.
   */
  @Get('my')
  @Roles(Role.PATIENT)
  async getMyClaimsHandler(@CurrentUser() user: UserDocument) {
    const claims = await this.claimsService.getPatientClaims(
      (user._id as { toString(): string }).toString(),
    );
    return claims.map((c) => c.toJSON());
  }

  /**
   * GET /claims/stats
   * Aggregated statistics for the insurer dashboard.
   * Must be declared before /:claimId to avoid route shadowing.
   */
  @Get('stats')
  @Roles(Role.INSURER)
  async getStats() {
    return this.claimsService.getStats();
  }

  // ─── Shared Endpoint (role-based access enforced in service) ───────────────

  /**
   * GET /claims/:claimId
   * Patients can only access their own claims (enforced in service).
   * Insurers can access any claim.
   */
  @Get(':claimId')
  async getClaimById(
    @Param('claimId') claimId: string,
    @CurrentUser() user: UserDocument,
  ) {
    const claim = await this.claimsService.getClaimByClaimId(claimId, user);
    return claim.toJSON();
  }

  // ─── Insurer Endpoints ─────────────────────────────────────────────────────

  /**
   * GET /claims
   * All claims with optional filtering and pagination. Insurer only.
   */
  @Get()
  @Roles(Role.INSURER)
  async getAllClaims(@Query() query: QueryClaimsDto) {
    const result = await this.claimsService.getAllClaims(query);
    return {
      ...result,
      data: result.data.map((c) => c.toJSON()),
    };
  }

  /**
   * PATCH /claims/:claimId/decision
   * Approve or reject a pending claim. Insurer only.
   */
  @Patch(':claimId/decision')
  @Roles(Role.INSURER)
  async makeDecision(
    @Param('claimId') claimId: string,
    @Body() dto: ClaimDecisionDto,
  ) {
    const claim = await this.claimsService.makeDecision(claimId, dto);
    return claim.toJSON();
  }
}
