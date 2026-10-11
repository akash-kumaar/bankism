export type Verdict = 'APPROVED' | 'BLOCKED' | 'NEEDS_CLARIFICATION';

export type ThreatCategory =
  | 'NONE'
  | 'DIRECT_PROMPT_INJECTION'
  | 'JAILBREAK_ROLEPLAY'
  | 'POLICY_OVERRIDE'
  | 'MALICIOUS_TRANSACTION_MEMO'
  | 'SUSPICIOUS_UNICODE'
  | 'AMBIGUOUS_INTENT'
  | 'INVALID_TRANSACTION_INPUT';

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
  rule_id: string;
  description: string;
  matched_pattern?: string;
}

export interface ParsedIntent {
  action: string;
  recipient: string | null;
  amount: string | number | null;
  source_account: string | null;
  memo: string | null;
  confidence: number;
}

export interface StageResult {
  stage: PipelineStageName;
  passed: boolean;
  duration_ms: number;
  message: string;
  details?: Record<string, any>;
}

export interface InspectResponse {
  request_id: string;
  timestamp: string;
  raw_input: string;
  normalized_input: string;
  verdict: Verdict;
  risk_score: number;
  threat_category: ThreatCategory;
  summary: string;
  findings: Finding[];
  stages: StageResult[];
  parsed_intent: ParsedIntent | null;
  action_executed: boolean;
  execution_error?: string | null;
  transaction_id?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: string;
  currency: string;
  is_verified: boolean;
  daily_limit: string;
  is_internal: boolean;
}

export interface Transaction {
  id: string;
  timestamp: string;
  source_account_id: string;
  recipient: string;
  amount: string;
  memo?: string | null;
  verdict: Verdict;
  threat_category: ThreatCategory;
  risk_score: number;
  request_id: string;
  status: string;
}

export interface MetricsData {
  total_requests: number;
  approved_count: number;
  blocked_count: number;
  clarification_count: number;
  avg_latency_ms: number;
  avg_risk_score: number;
  total_volume_processed: string;
  verdict_breakdown: Record<string, number>;
  threat_breakdown: Record<string, number>;
  risk_distribution: Record<string, number>;
  recent_events: Array<{
    request_id: string;
    timestamp: string;
    verdict: Verdict;
    threat_category: ThreatCategory;
    risk_score: number;
    prompt_preview: string;
    action_executed: boolean;
    amount?: string | number | null;
  }>;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  timestamp: string;
  checks: Record<string, boolean>;
}
