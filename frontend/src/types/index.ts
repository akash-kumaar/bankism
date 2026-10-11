export type Verdict = 'APPROVED' | 'BLOCKED' | 'NEEDS_CLARIFICATION';

export type ThreatCategory =
  | 'NONE'
  | 'PROMPT_INJECTION'
  | 'SYSTEM_OVERRIDE'
  | 'JAILBREAK_ROLEPLAY'
  | 'AUTHORIZATION_BYPASS'
  | 'MALICIOUS_MEMO'
  | 'UNICODE_OBFUSCATION'
  | 'REPEATED_ATTACK'
  | 'AMBIGUOUS_INTENT'
  | 'POLICY_VIOLATION';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PipelineStageName =
  | 'SCHEMA_VALIDATION'
  | 'UNICODE_NORMALIZATION'
  | 'THREAT_DETECTION'
  | 'INTENT_PARSING'
  | 'POLICY_ENFORCEMENT'
  | 'TRANSACTION_EXECUTION'
  | 'AUDIT_LOGGING';

export interface Finding {
  category: ThreatCategory;
  severity: Severity;
  signal: string;
  description: string;
}

export interface PipelineStage {
  stage_name?: string;
  status?: string;
  execution_time_ms?: number;
  details?: string;
  // compatibility
  stage?: PipelineStageName;
  passed?: boolean;
  duration_ms?: number;
  message?: string;
}

export type StageResult = PipelineStage;

export interface ParsedIntent {
  intent_type?: string;
  action?: string;
  recipient: string | null;
  amount: string | number | null;
  currency?: string;
  memo: string | null;
  source_account_id?: string | null;
  source_account?: string | null;
  confidence?: number;
  is_ambiguous?: boolean;
}

export interface InspectResponse {
  request_id: string;
  timestamp: string;
  verdict: Verdict;
  risk_score: number;
  risk_level?: string;
  threat_category: ThreatCategory;
  rationale?: string;
  summary?: string;
  findings: Finding[];
  pipeline?: PipelineStage[];
  stages?: PipelineStage[];
  normalized_text?: string;
  normalized_input?: string;
  raw_input?: string;
  parsed_intent: ParsedIntent | null;
  action_executed: boolean;
  execution_error?: string | null;
  transaction_id?: string | null;
  account_id?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  currency: string;
  status?: string;
  is_verified?: boolean;
  daily_limit?: string | number;
  is_internal?: boolean;
}

export interface Transaction {
  id: string;
  timestamp: string;
  source_account_id: string;
  recipient: string;
  amount: string | number;
  memo?: string | null;
  status: string;
  firewall_verdict?: Verdict;
  verdict?: Verdict;
  threat_category?: ThreatCategory;
  risk_score?: number;
  request_id?: string;
}

export interface RecentEvent {
  request_id: string;
  timestamp: string;
  verdict: Verdict;
  threat_category: ThreatCategory;
  risk_score: number;
  prompt_preview: string;
  action_executed: boolean;
  amount?: string | number | null;
}

export interface MetricsData {
  total_requests: number;
  threats_blocked: number;
  requests_approved: number;
  needs_clarification: number;
  transfers_executed?: number;
  total_volume_transferred: string | number;
  verdict_breakdown: Record<string, number>;
  threat_category_breakdown: Record<string, number>;
  risk_score_distribution: Record<string, number>;
  recent_activity: RecentEvent[];
  is_seeded?: boolean;
  environment?: string;

  // Compatibility aliases
  blocked_count?: number;
  approved_count?: number;
  clarification_count?: number;
  avg_latency_ms?: number;
  avg_risk_score?: number;
  total_volume_processed?: string;
  threat_breakdown?: Record<string, number>;
  risk_distribution?: Record<string, number>;
  recent_events?: RecentEvent[];
}

export interface HealthStatus {
  status: string;
  version: string;
  environment?: string;
  timestamp: string;
  firewall_active?: boolean;
  app_name?: string;
  checks?: Record<string, boolean>;
}
