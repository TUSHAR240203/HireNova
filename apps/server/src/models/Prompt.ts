import { Schema, model, Document } from 'mongoose';

// 1. Prompt Template Model
export interface IPromptTemplate extends Document {
  name: string;
  description?: string;
  activeVersionId?: Schema.Types.ObjectId;
  category: 'ResumeScreening' | 'InterviewAgent' | 'CodeReview';
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromptTemplateSchema = new Schema<IPromptTemplate>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  activeVersionId: { type: Schema.Types.ObjectId, ref: 'promptVersions' },
  category: {
    type: String,
    enum: ['ResumeScreening', 'InterviewAgent', 'CodeReview'],
    required: true,
    index: true
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users' }
}, {
  timestamps: true
});

// 2. Prompt Version Model
export interface IPromptVersion extends Document {
  templateId: Schema.Types.ObjectId;
  version: string; // Semantic version e.g. "1.0.0"
  promptText: string;
  active: boolean;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
}

const PromptVersionSchema = new Schema<IPromptVersion>({
  templateId: { type: Schema.Types.ObjectId, ref: 'promptTemplates', required: true, index: true },
  version: { type: String, required: true, trim: true },
  promptText: { type: String, required: true },
  active: { type: Boolean, default: false, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const PromptTemplate = model<IPromptTemplate>('promptTemplates', PromptTemplateSchema);
export const PromptVersion = model<IPromptVersion>('promptVersions', PromptVersionSchema);
