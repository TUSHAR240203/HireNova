import { Schema, model, Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  responseStatus: number;
  responseBody: any;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true, index: true },
  responseStatus: { type: Number, required: true },
  responseBody: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// Configure TTL index: documents expire automatically when current time is past 'expiresAt'
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = model<IIdempotencyKey>('idempotencyKeys', IdempotencyKeySchema);
export default IdempotencyKey;
