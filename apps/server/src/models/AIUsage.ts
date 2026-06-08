import { Schema, model, Document } from 'mongoose';

export interface IAIUsage extends Document {
  companyId: Schema.Types.ObjectId;
  serviceUsed: 'ResumeScreening' | 'InterviewAgent' | 'CodeReview';
  tokensConsumed: number;
  costUsd: number;
  tokenLimit: number;
  costQuota: number;
  fallbackModel: string;
  timestamp: Date;
}

const AIUsageSchema = new Schema<IAIUsage>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  serviceUsed: {
    type: String,
    enum: ['ResumeScreening', 'InterviewAgent', 'CodeReview'],
    required: true,
    index: true
  },
  tokensConsumed: { type: Number, default: 0 },
  costUsd: { type: Number, default: 0 },
  tokenLimit: { type: Number, default: 1000000 }, // Monthly limit in tokens
  costQuota: { type: Number, default: 50 },       // Monthly limit in USD
  fallbackModel: { type: String, default: 'gpt-4o-mini' },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

AIUsageSchema.index({ companyId: 1, timestamp: -1 });

export const AIUsage = model<IAIUsage>('aiUsage', AIUsageSchema);
export default AIUsage;
