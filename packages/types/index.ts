export type TenantTier = 'Starter' | 'Pro' | 'Enterprise';
export type UserRole = 'SuperAdmin' | 'CompanyAdmin' | 'RecruitmentManager' | 'Recruiter' | 'Interviewer' | 'HiringManager' | 'Auditor' | 'Candidate';
export type JobStatus = 'Draft' | 'Open' | 'Closed';
export type JobType = 'Full-Time' | 'Contract' | 'Remote';
export type ApplicationStatus = 'Applied' | 'Screening' | 'Interviewing' | 'Selected' | 'Rejected';

export interface ITenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tier: TenantTier;
  ssoConfig?: {
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    enabled: boolean;
  };
  dataRetentionMonths: number;
  featureFlags: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidate {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  parsedData?: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
    }[];
    education: {
      degree: string;
      institution: string;
    }[];
  };
  skillGraph: Record<string, number>;
  talentPool: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: JobStatus;
  department?: string;
  location?: string;
  type: JobType;
  requirements: string[];
  pipelineStages: {
    name: string;
    stageType: 'Screening' | 'Assessment' | 'AIInterview' | 'Review' | 'Offer';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplication {
  id: string;
  companyId: string;
  jobId: string;
  candidateId: string;
  currentStage: string;
  status: ApplicationStatus;
  resumeMatchScore: number;
  createdAt: Date;
  updatedAt: Date;
}
