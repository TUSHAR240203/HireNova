import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  companyId: Schema.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'SuperAdmin' | 'CompanyAdmin' | 'RecruitmentManager' | 'Recruiter' | 'Interviewer' | 'HiringManager' | 'Auditor';
  department?: string;
  mfaSecret?: string;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['SuperAdmin', 'CompanyAdmin', 'RecruitmentManager', 'Recruiter', 'Interviewer', 'HiringManager', 'Auditor'],
    required: true
  },
  department: { type: String, trim: true },
  mfaSecret: { type: String },
  mfaEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Multi-tenant unique index lock: Email must be unique within each company tenant context.
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const User = model<IUser>('users', UserSchema);
export default User;
