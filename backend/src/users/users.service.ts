import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Find a user by email, selecting the passwordHash field explicitly
   * (excluded from default projection by schema toJSON transform).
   */
  async findByEmailWithHash(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  /**
   * Find a user by their MongoDB ObjectId.
   * The passwordHash is NOT included — use findByEmailWithHash for auth flows.
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Create a new user. Caller must provide a pre-hashed password.
   */
  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  /**
   * Check whether a user with the given email already exists.
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ email: email.toLowerCase() }).exec();
    return count > 0;
  }
}
