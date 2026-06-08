import { Schema, model, Document } from 'mongoose';

export interface ICandidateExperience {
  title: string;
  company: string;
  duration: string;
}

export interface ICandidateEducation {
  degree: string;
  institution: string;
}

export interface ICandidate extends Document {
  companyId: Schema.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  parsedData: {
    skills: string[];
    experience: ICandidateExperience[];
    education: ICandidateEducation[];
  };
  skillGraph: Map<string, number>;
  talentPool: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  resumeUrl: { type: String },
  parsedData: {
    skills: { type: [String], default: [], index: true },
    experience: {
      type: [{
        title: { type: String, required: true },
        company: { type: String, required: true },
        duration: { type: String }
      }],
      default: []
    },
    education: {
      type: [{
        degree: { type: String, required: true },
        institution: { type: String, required: true }
      }],
      default: []
    }
  },
  skillGraph: { type: Map, of: Number, default: new Map() },
  talentPool: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Multi-tenant unique index lock: Email must be unique within each company tenant context.
CandidateSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const Candidate = model<ICandidate>('candidates', CandidateSchema);
export default Candidate;
