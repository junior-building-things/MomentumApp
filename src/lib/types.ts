export type FeatureStatus = "planned" | "in_progress" | "launched" | "at_risk";

export type FeaturePriority = "low" | "medium" | "high";

export type FeatureViewMode = "grid" | "list";

export type FeatureSort = "due" | "priority" | "title";

export type FeatureFilter = "all" | FeatureStatus;

export interface FeatureTask {
  id: string;
  label: string;
  done: boolean;
}

export interface FeatureSeed {
  id: string;
  priority: FeaturePriority;
  defaultStatus: FeatureStatus;
  meegoIssueId?: string;
  meegoUrl?: string | null;
}

export interface DashboardFeature {
  id: string;
  title: string;
  description: string;
  team: string;
  owner: string;
  dueDate: string;
  priority: FeaturePriority;
  tasks: FeatureTask[];
  status: FeatureStatus;
  currentStatusLabel: string;
  meegoState: string | null;
  meegoUrl: string | null;
  lastSyncedAt: string | null;
  isLive: boolean;
}

export interface DashboardSummaryCard {
  id: string;
  label: string;
  value: number;
}

export interface DashboardData {
  features: DashboardFeature[];
  summary: DashboardSummaryCard[];
  lastSyncedAt: string | null;
  isLive: boolean;
  loadError: string | null;
}
