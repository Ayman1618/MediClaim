import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  // Exclude passwordHash from toJSON output so it never leaks through
  // serialisation — the service layer must explicitly select it when needed.
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete ret['passwordHash'];
      delete ret['__v'];
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  /**
   * bcrypt hash of the user's password.
   * Excluded from all queries by default (select: false).
   * Use UsersService.findByEmailWithHash() to retrieve it for auth flows.
   * Also stripped from toJSON output as a defence-in-depth measure.
   */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, enum: Role })
  role!: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index: email lookups are frequent
UserSchema.index({ email: 1 });
