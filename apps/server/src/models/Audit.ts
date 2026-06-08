import { Schema, model, Document } from 'mongoose';

// 1. Audit Log Model
export interface IAuditLog extends Document {
  companyId?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  action: string;
  entityName: string;
  entityId: Schema.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'users', index: true },
  action: { type: String, required: true, index: true },
  entityName: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 }
}, {
  timestamps: false
});

AuditLogSchema.index({ companyId: 1, timestamp: -1 });

// 2. AI Audit Log Model
export interface IAIAuditLog extends Document {
  companyId: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  modelUsed: string;
  promptVersionId?: Schema.Types.ObjectId;
  inputPrompt: string;
  retrievedContext: string[];
  outputResponse: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
  };
  estimatedCost: number;
  latencyMs: number;
  confidenceScore?: number;
  safetyScore?: number;
  hallucinationScore?: number;
  timestamp: Date;
}

const AIAuditLogSchema = new Schema<IAIAuditLog>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'users', index: true },
  modelUsed: { type: String, required: true },
  promptVersionId: { type: Schema.Types.ObjectId, ref: 'promptVersions' },
  inputPrompt: { type: String, required: true },
  retrievedContext: { type: [String], default: [] },
  outputResponse: { type: String, required: true },
  tokenUsage: {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 }
  },
  estimatedCost: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  confidenceScore: { type: Number },
  safetyScore: { type: Number },
  hallucinationScore: { type: Number },
  timestamp: { type: Date, default: Date.now, index: -1 }
}, {
  timestamps: false
});

AIAuditLogSchema.index({ companyId: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>('auditLogs', AuditLogSchema);
export const AIAuditLog = model<IAIAuditLog>('aiAuditLogs', AIAuditLogSchema);
