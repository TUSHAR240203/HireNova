import { Schema, model, Document } from 'mongoose';

export interface IJobStage {
  name: string;
  stageType: 'Screening' | 'Assessment' | 'AIInterview' | 'Review' | 'Offer';
}

export interface IJob extends Document {
  companyId: Schema.Types.ObjectId;
  title: string;
  description: string;
  status: 'Draft' | 'Open' | 'Closed';
  department?: string;
  location?: string;
  type: 'Full-Time' | 'Contract' | 'Remote';
  requirements: string[];
  pipelineStages: IJobStage[];
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Open', 'Closed'], default: 'Draft', index: true },
  department: { type: String, trim: true, index: true },
  location: { type: String, trim: true },
  type: { type: String, enum: ['Full-Time', 'Contract', 'Remote'], required: true },
  requirements: { type: [String], default: [] },
  pipelineStages: {
    type: [{
      name: { type: String, required: true },
      stageType: { type: String, enum: ['Screening', 'Assessment', 'AIInterview', 'Review', 'Offer'], required: true }
    }],
    default: [
      { name: 'Applied', stageType: 'Screening' },
      { name: 'Technical Assessment', stageType: 'Assessment' },
      { name: 'AI Interview', stageType: 'AIInterview' },
      { name: 'Panel Review', stageType: 'Review' },
      { name: 'Offer Extended', stageType: 'Offer' }
    ]
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'users' }
}, {
  timestamps: true
});

// Text index for search
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ companyId: 1, status: 1 });

export const Job = model<IJob>('jobs', JobSchema);
export default Job;
