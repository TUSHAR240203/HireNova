import { Schema, model, Document } from 'mongoose';

// 1. Assessment Model
export interface IAssessmentMCQ {
  questionId: Schema.Types.ObjectId;
  weight: number;
}

export interface IAssessmentCoding {
  problemId: Schema.Types.ObjectId;
  weight: number;
}

export interface IAssessment extends Document {
  companyId: Schema.Types.ObjectId;
  title: string;
  durationMinutes: number;
  mcqs: IAssessmentMCQ[];
  codingProblems: IAssessmentCoding[];
  randomizeConfig: {
    enabled: boolean;
    categories: { category: string; count: number }[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  title: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, required: true },
  mcqs: {
    type: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'mcqQuestions', required: true },
      weight: { type: Number, default: 1 }
    }],
    default: []
  },
  codingProblems: {
    type: [{
      problemId: { type: Schema.Types.ObjectId, ref: 'codingProblems', required: true },
      weight: { type: Number, default: 10 }
    }],
    default: []
  },
  randomizeConfig: {
    enabled: { type: Boolean, default: false },
    categories: [{
      category: { type: String, required: true },
      count: { type: Number, required: true }
    }]
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 2. Assessment Attempt Model
export interface ICodeSubmission {
  language: string;
  code: string;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  memoryBytes: number;
  status: 'Accepted' | 'WrongAnswer' | 'RuntimeError' | 'TimeLimitExceeded' | 'CompileError';
}

export interface ICandidateAnswer {
  questionId: Schema.Types.ObjectId;
  mcqAnswer?: string;
  codeSubmissions?: ICodeSubmission[];
}

export interface IAssessmentAttempt extends Document {
  companyId: Schema.Types.ObjectId;
  assessmentId: Schema.Types.ObjectId;
  applicationId: Schema.Types.ObjectId;
  candidateId: Schema.Types.ObjectId;
  status: 'Invited' | 'InProgress' | 'Completed' | 'Evaluated' | 'Expired';
  answers: ICandidateAnswer[];
  score: number;
  plagiarismScore: number;
  cheatingFlags: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', required: true, index: true },
  assessmentId: { type: Schema.Types.ObjectId, ref: 'assessments', required: true, index: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'applications', required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'candidates', required: true, index: true },
  status: {
    type: String,
    enum: ['Invited', 'InProgress', 'Completed', 'Evaluated', 'Expired'],
    default: 'Invited',
    index: true
  },
  answers: [{
    questionId: { type: Schema.Types.ObjectId, required: true },
    mcqAnswer: { type: String },
    codeSubmissions: [{
      language: { type: String, required: true },
      code: { type: String, required: true },
      passedCount: { type: Number, default: 0 },
      totalCount: { type: Number, default: 0 },
      executionTimeMs: { type: Number, default: 0 },
      memoryBytes: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['Accepted', 'WrongAnswer', 'RuntimeError', 'TimeLimitExceeded', 'CompileError'],
        required: true
      }
    }]
  }],
  score: { type: Number, default: 0 },
  plagiarismScore: { type: Number, default: 0 },
  cheatingFlags: { type: [String], default: [] },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

AssessmentAttemptSchema.index({ companyId: 1, status: 1 });
AssessmentAttemptSchema.index({ assessmentId: 1 });
AssessmentAttemptSchema.index({ candidateId: 1 });

export const Assessment = model<IAssessment>('assessments', AssessmentSchema);
export const AssessmentAttempt = model<IAssessmentAttempt>('assessmentAttempts', AssessmentAttemptSchema);
