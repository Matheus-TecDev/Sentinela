import type {
  AlertChannelType,
  HealthStatus,
  IncidentStatus,
  MetricsPeriod,
  MonitoredService,
  NotificationEventType,
  NotificationStatus
} from "./types";

export function formatDate(value: string | null): string {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatMs(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "Sem registro";
  return `${Math.round(value)} ms`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Em andamento";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function healthStatusLabel(status: HealthStatus | null): string {
  const labels: Record<HealthStatus, string> = {
    online: "Online",
    offline: "Offline",
    degraded: "Degradado"
  };
  return status ? labels[status] : "Sem registro";
}

export function userRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    OPERATOR: "Operador",
    VIEWER: "Visualizador"
  };
  return labels[role] ?? role;
}

export function incidentStatusLabel(status: IncidentStatus): string {
  return status === "open" ? "Aberto" : "Resolvido";
}

export function alertChannelLabel(type: AlertChannelType): string {
  const labels: Record<AlertChannelType, string> = {
    webhook: "Webhook",
    discord: "Discord",
    email: "E-mail"
  };
  return labels[type];
}

export function notificationEventLabel(type: NotificationEventType): string {
  const labels: Record<NotificationEventType, string> = {
    incident_opened: "Incidente aberto",
    incident_resolved: "Serviço recuperado"
  };
  return labels[type];
}

export function notificationStatusLabel(status: NotificationStatus): string {
  return status === "sent" ? "Alerta enviado" : "Falha ao enviar alerta";
}

export function periodLabel(period: MetricsPeriod): string {
  const labels: Record<MetricsPeriod, string> = {
    "24h": "24 horas",
    "7d": "7 dias",
    "30d": "30 dias"
  };
  return labels[period];
}

export function visualStatus(service: MonitoredService): HealthStatus | "inactive" | "unknown" {
  if (!service.is_active) return "inactive";
  return service.current_status ?? "unknown";
}

export function environmentLabel(value: string): string {
  const labels: Record<string, string> = {
    dev: "Dev",
    staging: "Staging",
    production: "Produção"
  };
  return labels[value] ?? value;
}
