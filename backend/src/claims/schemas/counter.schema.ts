import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Atomic counter collection for generating sequential claim identifiers.
 *
 * Each document represents a named counter (e.g. "CLM-2026").
 * The sequence is incremented atomically using findOneAndUpdate + $inc,
 * which is safe for single-node MongoDB without requiring distributed locks.
 */
@Schema({ timestamps: false })
export class Counter {
  /** Counter name, e.g. "CLM-2026" */
  @Prop({ required: true, unique: true })
  name!: string;

  /** Current sequence value */
  @Prop({ required: true, default: 0 })
  seq!: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
