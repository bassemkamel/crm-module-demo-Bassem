// Shared types mirroring the backend API contracts (see backend/src/**).
// Dates are serialized as ISO strings over the wire.

export const PipelineStage = {
  NEW: "NEW",
  QUALIFIED: "QUALIFIED",
  PROPOSAL: "PROPOSAL",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
} as const;
export type PipelineStage = (typeof PipelineStage)[keyof typeof PipelineStage];

export const ClientType = {
  COMPANY: "COMPANY",
  INDIVIDUAL: "INDIVIDUAL",
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

export const OpportunityHealth = {
  OK: "OK",
  LATE: "LATE",
  STAGNANT: "STAGNANT",
} as const;
export type OpportunityHealth =
  (typeof OpportunityHealth)[keyof typeof OpportunityHealth];

export interface Client {
  id: string;
  type: ClientType;
  email: string;
  phone: string | null;
  notes: string | null;
  companyName: string | null;
  registrationNumber: string | null;
  industry: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  amount: number;
  expectedCloseDate: string;
  stage: PipelineStage;
  stageChangedAt: string;
  health: OpportunityHealth;
  isProblematic: boolean;
  clientId: string;
  client: Client;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface StageBreakdown {
  stage: PipelineStage;
  count: number;
  value: number;
}

export interface PipelineSummary {
  totalCount: number;
  totalOpenValue: number;
  weightedOpenValue: number;
  wonValue: number;
  lostValue: number;
  problematic: { count: number; value: number };
  byStage: StageBreakdown[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface OpportunityFilters {
  stage?: PipelineStage;
  clientType?: ClientType;
  problematic?: boolean;
  page?: number;
  limit?: number;
}
