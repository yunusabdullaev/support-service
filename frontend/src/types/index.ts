export type Role = 'ADMIN' | 'TEAM_LEADER' | 'OPERATOR' | 'DEVELOPER';
export type BugPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BugStatus = 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'WAITING' | 'FIXED' | 'CLOSED' | 'REJECTED';
export type ServiceStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type ImprovementStatus = 'NEW' | 'UNDER_REVIEW' | 'PLANNED' | 'IN_DEVELOPMENT' | 'DONE' | 'REJECTED';
export type DialogReviewStatus = 'DRAFT' | 'REVIEWED' | 'NEEDS_TRAINING';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ArticleCategory = 'CRM' | 'SIPUNI' | 'SARKOR' | 'MODERATOR' | 'COMMON_QUESTIONS' | 'TROUBLESHOOTING' | 'INTERNAL_RULES';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Bug {
  id: string;
  title: string;
  product?: Product;
  productId: string;
  module?: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  priority: BugPriority;
  status: BugStatus;
  reportedByClientsCount: number;
  assignedTo?: { id: string; fullName: string };
  createdBy?: { id: string; fullName: string };
  deadline?: string;
  attachments?: BugAttachment[];
  comments?: BugComment[];
  _count?: { comments: number; attachments: number };
  createdAt: string;
  updatedAt: string;
}

export interface BugAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

export interface BugComment {
  id: string;
  comment: string;
  user: { id: string; fullName: string; role: Role };
  createdAt: string;
}

export interface DialogReview {
  id: string;
  operator?: { id: string; fullName: string };
  product?: Product;
  clientName: string;
  dialogText: string;
  reviewDate: string;
  firstResponseScore: number;
  understandingScore: number;
  solutionScore: number;
  communicationScore: number;
  closingScore: number;
  totalScore: number;
  mistakes?: string;
  comment?: string;
  status: DialogReviewStatus;
  reviewedBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface ImprovementRequest {
  id: string;
  title: string;
  product?: Product;
  description: string;
  requestedByClientsCount: number;
  source?: string;
  businessValue?: string;
  status: ImprovementStatus;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface ServiceMonitor {
  id: string;
  name: string;
  product?: Product;
  url: string;
  method: string;
  expectedStatusCode: number;
  checkIntervalSeconds: number;
  currentStatus: ServiceStatus;
  responseTimeMs?: number;
  isActive: boolean;
  lastCheckedAt?: string;
}

export interface Incident {
  id: string;
  serviceMonitor?: { id: string; name: string };
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt?: string;
  durationMinutes?: number;
  rootCause?: string;
  responsibleUser?: { id: string; fullName: string };
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  product?: Product;
  category: ArticleCategory;
  content: string;
  status: ArticleStatus;
  createdBy?: { id: string; fullName: string };
  updatedBy?: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  openBugs: number;
  criticalBugs: number;
  closedBugsThisWeek: number;
  newImprovements: number;
  averageQaScore: number;
  reviewedDialogs: number;
  services: ServiceMonitor[];
  servicesOnline: number;
  totalServices: number;
  activeIncidents: number;
  weekIncidents: number;
}

export type DifficultyStatus = 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface Difficulty {
  id: string;
  title: string;
  product?: { id: string; name: string };
  productId?: string;
  description: string;
  status: DifficultyStatus;
  createdBy?: { id: string; fullName: string; role: string };
  createdAt: string;
  updatedAt: string;
}

