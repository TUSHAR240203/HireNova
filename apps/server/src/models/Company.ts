import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  slug: string;
  logo?: string;
  tier: 'Starter' | 'Pro' | 'Enterprise';
  ssoConfig: {
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    enabled: boolean;
  };
  dataRetentionMonths: number;
  featureFlags: Map<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  logo: { type: String },
  tier: { type: String, enum: ['Starter', 'Pro', 'Enterprise'], default: 'Starter' },
  ssoConfig: {
    entityId: { type: String },
    ssoUrl: { type: String },
    certificate: { type: String },
    enabled: { type: Boolean, default: false }
  },
  dataRetentionMonths: { type: Number, default: 12 },
  featureFlags: { type: Map, of: Boolean, default: new Map() },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Company = model<ICompany>('companies', CompanySchema);
export default Company;
