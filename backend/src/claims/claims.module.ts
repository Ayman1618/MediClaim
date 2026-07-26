import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { Claim, ClaimSchema } from './schemas/claim.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Claim.name, schema: ClaimSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    UploadsModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
