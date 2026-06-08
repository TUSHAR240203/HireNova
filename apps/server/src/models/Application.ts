import { Schema, model, Document } from 'mongoose';

export interface IApplicationTimeline {
  stage: string;
  status: string;
  updatedAt: Date;
  updatedBy?: Schema.Types.ObjectId;
}

export interface IApplication extends Document {
  companyId: Schema.Types.ObjectId;
  jobId: Schema.Types.ObjectId;
  candidateId: Schema.Types.ObjectId;
  currentStage: string;
  status: 'Applied' | 'Screening' | 'Interviewing' | 'Selected' | 'Rejected';
  resumeMatchScore: number;
  evaluationNotes?: string;
  timeline: IApplicationTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'jobs', required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'candidates', required: true, index: true },
  currentStage: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Interviewing', 'Selected', 'Rejected'],
    default: 'Applied',
    index: true
  },
  resumeMatchScore: { type: Number, default: 0 },
  evaluationNotes: { type: String },
  timeline: {
    type: [{
      stage: { type: String, required: true },
      status: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'users' }
    }],
    default: []
  }
}, {
  timestamps: true
});

ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ companyId: 1, currentStage: 1 });

export const Application = model<IApplication>('applications', ApplicationSchema);
export default Application;
