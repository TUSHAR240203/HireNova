import { Schema, model, Document } from 'mongoose';

export interface IAssessmentIntegrityLog extends Document {
  candidateId: Schema.Types.ObjectId;
  attemptId: Schema.Types.ObjectId;
  eventType: 'TabSwitch' | 'CopyPaste' | 'MultipleMonitors' | 'WebcamMismatch' | 'SuspiciousBehavior';
  riskScore: number; // 0 to 100
  details?: string;
  timestamp: Date;
}

const AssessmentIntegrityLogSchema = new Schema<IAssessmentIntegrityLog>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'candidates', required: true, index: true },
  attemptId: { type: Schema.Types.ObjectId, ref: 'assessmentAttempts', required: true, index: true },
  eventType: {
    type: String,
    enum: ['TabSwitch', 'CopyPaste', 'MultipleMonitors', 'WebcamMismatch', 'SuspiciousBehavior'],
    required: true,
    index: true
  },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  details: { type: String },
  timestamp: { type: Date, default: Date.now, index: -1 }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

AssessmentIntegrityLogSchema.index({ attemptId: 1, riskScore: -1 });

export const AssessmentIntegrityLog = model<IAssessmentIntegrityLog>('assessmentIntegrityLogs', AssessmentIntegrityLogSchema);
export default AssessmentIntegrityLog;
