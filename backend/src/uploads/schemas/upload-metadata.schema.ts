import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UploadMetadataDocument = HydratedDocument<UploadMetadata>;

@Schema({ timestamps: true })
export class UploadMetadata {
  @Prop({ required: true, unique: true })
  storedName!: string;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true, default: () => new Date() })
  uploadedAt!: Date;
}

export const UploadMetadataSchema = SchemaFactory.createForClass(UploadMetadata);

