export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";
export type ServiceEnvironment = "dev" | "staging" | "production";
export type HealthStatus = "online" | "offline" | "degraded";
export type IncidentStatus = "open" | "resolved";
export type MetricsPeriod = "24h" | "7d" | "30d";
export type AlertChannelType = "webhook" | "discord" | "email";
export type NotificationEventType = "incident_opened" | "incident_resolved";
export type NotificationStatus = "sent" | "failed";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitoredService {
  id: number;
  name: string;
  description: string | null;
  environment: ServiceEnvironment;
  healthcheck_url: string;
  owner: string;
  responsible_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_status: HealthStatus | null;
  last_http_status_code: number | null;
  last_response_time_ms: number | null;
  last_checked_at: string | null;
}

export interface HealthCheckResult {
  id: number;
  service_id: number;
  status: HealthStatus;
  http_status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

export interface Incident {
  id: number;
  service_id: number;
  status: IncidentStatus;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  reason: string;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentWithService extends Incident {
  service_name: string;
}

export interface AlertChannel {
  id: number;
  service_id: number;
  type: AlertChannelType;
  masked_target: string;
  is_active: boolean;
  notify_on_offline: boolean;
  notify_on_degraded: boolean;
  notify_on_recovery: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertChannelPayload {
  type?: AlertChannelType;
  target?: string;
  is_active?: boolean;
  notify_on_offline?: boolean;
  notify_on_degraded?: boolean;
  notify_on_recovery?: boolean;
}

export interface NotificationLog {
  id: number;
  service_id: number;
  incident_id: number | null;
  channel_type: AlertChannelType;
  masked_target: string;
  event_type: NotificationEventType;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string;
}

export interface NotificationLogWithService extends NotificationLog {
  service_name: string;
}

export interface ServicePeriodMetrics {
  period: MetricsPeriod;
  uptime_percent: number;
  average_response_time_ms: number | null;
  max_response_time_ms: number | null;
  min_response_time_ms: number | null;
  total_checks: number;
  total_failures: number;
  last_failure: HealthCheckResult | null;
  last_status: HealthStatus | null;
  status_counts: Partial<Record<HealthStatus, number>>;
}

export interface ServiceDetail extends MonitoredService {
  average_response_time_ms: number | null;
  uptime_percent: number;
  recent_checks: HealthCheckResult[];
  recent_failures: HealthCheckResult[];
}

export interface DashboardSummary {
  total_services: number;
  online_services: number;
  offline_services: number;
  degraded_services: number;
  inactive_services: number;
  average_response_time_ms: number | null;
  overall_uptime_percent: number;
  open_incidents: number;
  failures_last_24h: number;
  recent_failures: HealthCheckResult[];
  recent_incidents: IncidentWithService[];
  recent_notifications: NotificationLogWithService[];
  failed_notifications: NotificationLogWithService[];
  unstable_services: ServiceInstabilitySummary[];
  slowest_services: ServiceResponseSummary[];
  services: MonitoredService[];
}

export interface ServiceInstabilitySummary {
  service_id: number;
  service_name: string;
  unhealthy_checks: number;
  failure_checks: number;
  incident_count: number;
}

export interface ServiceResponseSummary {
  service_id: number;
  service_name: string;
  average_response_time_ms: number;
}

export interface ServicePayload {
  name: string;
  description: string | null;
  environment: ServiceEnvironment;
  healthcheck_url: string;
  owner?: string | null;
  responsible_id: number | null;
  is_active: boolean;
}

export interface Responsible {
  id: number;
  name: string;
  email: string | null;
  team: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResponsiblePayload {
  name: string;
  email: string | null;
  team: string | null;
  is_active: boolean;
}
