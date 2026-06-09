import { Schema, model, Document } from 'mongoose';

export interface IMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

export interface IInterview extends Document {
  companyId: Schema.Types.ObjectId;
  candidateId: Schema.Types.ObjectId;
  jobId: Schema.Types.ObjectId;
  status: 'Pending' | 'InProgress' | 'Completed';
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'candidates', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'jobs', required: true, index: true },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Completed'],
    default: 'Pending',
    index: true
  },
  messages: [{
    role: { type: String, enum: ['assistant', 'user', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

InterviewSchema.index({ companyId: 1, status: 1 });

export const Interview = model<IInterview>('interviews', InterviewSchema);
export default Interview;
