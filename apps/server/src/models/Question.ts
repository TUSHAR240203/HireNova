import { Schema, model, Document } from 'mongoose';

// 1. Coding Problem Model
export interface IStarterCode {
  language: string;
  code: string;
}

export interface ITestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

export interface ICodingProblem extends Document {
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  starterCode: IStarterCode[];
  testCases: ITestCase[];
  timeLimitMs: number;
  memoryLimitKb: number;
  isGlobal: boolean;
  companyId?: Schema.Types.ObjectId;
}

const CodingProblemSchema = new Schema<ICodingProblem>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
  tags: { type: [String], default: [], index: true },
  starterCode: [{
    language: { type: String, required: true },
    code: { type: String, required: true }
  }],
  testCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }],
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitKb: { type: Number, default: 51200 },
  isGlobal: { type: Boolean, default: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', index: true }
});

// 2. MCQ Question Model
export interface IMCQQuestion extends Document {
  companyId?: Schema.Types.ObjectId;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
}

const MCQQuestionSchema = new Schema<IMCQQuestion>({
  companyId: { type: Schema.Types.ObjectId, ref: 'companies', index: true },
  questionText: { type: String, required: true, trim: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
  category: { type: String, required: true, index: true },
  tags: { type: [String], default: [], index: true }
});

export const CodingProblem = model<ICodingProblem>('codingProblems', CodingProblemSchema);
export const MCQQuestion = model<IMCQQuestion>('mcqQuestions', MCQQuestionSchema);
