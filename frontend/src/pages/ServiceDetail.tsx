import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, Power, RadioTower, Timer, TrendingDown, TrendingUp, Wifi } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { PageProps } from "../App";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import type { HealthCheckResult, Incident, MetricsPeriod, ServiceDetail, ServicePeriodMetrics } from "../types";
import {
  environmentLabel,
  formatDate,
  formatDuration,
  formatMs,
  formatPercent,
  healthStatusLabel,
  incidentStatusLabel,
  periodLabel,
  visualStatus
} from "../utils";

interface ServiceDetailPageProps extends PageProps {
  serviceId: number;
}

const periods: MetricsPeriod[] = ["24h", "7d", "30d"];
const statusColors = {
  online: "#15803d",
  degraded: "#b45309",
  offline: "#b42318"
};

export function ServiceDetailPage({ serviceId, navigate }: ServiceDetailPageProps) {
  const { token, canManageServices } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [metrics, setMetrics] = useState<ServicePeriodMetrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [period, setPeriod] = useState<MetricsPeriod>("24h");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    try {
      setLoading(true);
      setError("");
      const [detail, history, periodMetrics, serviceIncidents] = await Promise.all([
        apiRequest<ServiceDetail>(`/services/${serviceId}`, {}, token),
        apiRequest<HealthCheckResult[]>(`/services/${serviceId}/checks?limit=200&period=${period}`, {}, token),
        apiRequest<ServicePeriodMetrics>(`/services/${serviceId}/metrics?period=${period}`, {}, token),
        apiRequest<Incident[]>(`/services/${serviceId}/incidents?limit=20`, {}, token)
      ]);
      setService(detail);
      setChecks(history);
      setMetrics(periodMetrics);
      setIncidents(serviceIncidents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar detalhes do serviço");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [period, serviceId, token]);

  async function toggleActive(): Promise<void> {
    if (!service) return;
    try {
      await apiRequest<ServiceDetail>(
        `/services/${service.id}/activation`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !service.is_active })
        },
        token
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar serviço");
    }
  }

  const chronologicalChecks = useMemo(() => [...checks].reverse(), [checks]);

  const responseData = useMemo(
    () =>
      chronologicalChecks.map((check) => ({
        checkedAt: shortDate(check.checked_at),
        response: check.response_time_ms,
        status: healthStatusLabel(check.status)
      })),
    [chronologicalChecks]
  );

  const statusData = useMemo(() => {
    const counts = metrics?.status_counts ?? {};
    return [
      { name: "Online", value: counts.online ?? 0, color: statusColors.online },
      { name: "Degradado", value: counts.degraded ?? 0, color: statusColors.degraded },
      { name: "Offline", value: counts.offline ?? 0, color: statusColors.offline }
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const failureData = useMemo(() => buildFailureData(chronologicalChecks), [chronologicalChecks]);

  if (loading) return <Loading />;

  if (!service) {
    return (
      <div className="page-stack">
        <ErrorBanner message={error || "Serviço não encontrado"} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Detalhes do serviço</span>
          <h2>{service.name}</h2>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={() => navigate("/services")}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar
          </button>
          {canManageServices && (
            <>
              <button className="secondary-button" onClick={() => navigate(`/services/${service.id}/edit`)}>
                <Edit3 size={16} aria-hidden="true" />
                Editar
              </button>
              <button className="secondary-button" onClick={toggleActive}>
                <Power size={16} aria-hidden="true" />
                {service.is_active ? "Desativar" : "Ativar"}
              </button>
            </>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />

      <section className="period-selector" aria-label="Período das métricas">
        {periods.map((item) => (
          <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>
            {periodLabel(item)}
          </button>
        ))}
      </section>

      <section className="stats-grid">
        <StatCard title="Uptime" value={formatPercent(metrics?.uptime_percent ?? 0)} helper={`período de ${periodLabel(period)}`} icon={RadioTower} tone="good" />
        <StatCard title="Resposta média" value={formatMs(metrics?.average_response_time_ms ?? null)} helper="tempo médio no período" icon={Timer} />
        <StatCard title="Maior resposta" value={formatMs(metrics?.max_response_time_ms ?? null)} helper="pior tempo observado" icon={TrendingUp} tone="warn" />
        <StatCard title="Menor resposta" value={formatMs(metrics?.min_response_time_ms ?? null)} helper="melhor tempo observado" icon={TrendingDown} tone="good" />
        <StatCard title="Verificações" value={metrics?.total_checks ?? 0} helper="total no período" icon={Wifi} />
        <StatCard title="Falhas" value={metrics?.total_failures ?? 0} helper="eventos offline" icon={Power} tone={metrics?.total_failures ? "bad" : "good"} />
      </section>

      <section className="detail-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Dados principais</h3>
              <span>Configuração usada nas verificações automáticas</span>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Status atual</dt>
              <dd>
                <StatusBadge status={visualStatus(service)} />
              </dd>
            </div>
            <div>
              <dt>Último status no período</dt>
              <dd>{healthStatusLabel(metrics?.last_status ?? null)}</dd>
            </div>
            <div>
              <dt>URL monitorada</dt>
              <dd className="break-text">{service.healthcheck_url}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{service.owner}</dd>
            </div>
            <div>
              <dt>Ambiente</dt>
              <dd>{environmentLabel(service.environment)}</dd>
            </div>
            <div>
              <dt>Última verificação</dt>
              <dd>{formatDate(service.last_checked_at)}</dd>
            </div>
            <div>
              <dt>Última falha no período</dt>
              <dd>{metrics?.last_failure ? formatDate(metrics.last_failure.checked_at) : "Sem falhas no período"}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Incidentes</h3>
              <span>Períodos em que o serviço ficou offline ou degradado</span>
            </div>
          </div>
          {incidents.length === 0 ? (
            <EmptyState title="Sem incidentes" message="Nenhum incidente foi registrado para este serviço." />
          ) : (
            <div className="incident-list">
              {incidents.map((incident) => (
                <div className="incident-item" key={incident.id}>
                  <div>
                    <strong>{incident.reason}</strong>
                    <span>{incident.last_error_message ?? "Sem mensagem detalhada"}</span>
                  </div>
                  <div>
                    <span>{incidentStatusLabel(incident.status)}</span>
                    <time>{formatDuration(incident.duration_seconds)}</time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="charts-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Tempo de resposta</h3>
              <span>Linha do tempo das verificações no período</span>
            </div>
          </div>
          {responseData.length === 0 ? (
            <EmptyState title="Sem dados no período" message="Ainda não há verificações para montar o gráfico." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={responseData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="checkedAt" minTickGap={28} />
                <YAxis width={60} />
                <Tooltip formatter={(value) => formatMs(Number(value))} />
                <Line type="monotone" dataKey="response" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Distribuição de status</h3>
              <span>Proporção de resultados no período</span>
            </div>
          </div>
          {statusData.length === 0 ? (
            <EmptyState title="Sem status no período" message="Nenhum resultado encontrado para este intervalo." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {statusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel chart-panel wide-chart">
          <div className="panel-heading">
            <div>
              <h3>Falhas ao longo do tempo</h3>
              <span>Quantidade de verificações offline agrupadas por horário</span>
            </div>
          </div>
          {failureData.length === 0 ? (
            <EmptyState title="Sem falhas no período" message="Nenhuma verificação offline foi registrada neste intervalo." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={failureData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={18} />
                <YAxis allowDecimals={false} width={44} />
                <Tooltip />
                <Bar dataKey="falhas" fill="#b42318" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Verificações do período</h3>
            <span>Histórico operacional persistido no PostgreSQL</span>
          </div>
        </div>
        {checks.length === 0 ? (
          <EmptyState title="Sem histórico" message="Ainda não há verificações registradas neste período." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>HTTP</th>
                  <th>Tempo</th>
                  <th>Erro</th>
                  <th>Verificado em</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.id}>
                    <td>
                      <StatusBadge status={check.status} />
                    </td>
                    <td>{check.http_status_code ?? "Sem registro"}</td>
                    <td>{formatMs(check.response_time_ms)}</td>
                    <td>{check.error_message ?? "-"}</td>
                    <td>{formatDate(check.checked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function buildFailureData(checks: HealthCheckResult[]): Array<{ label: string; falhas: number }> {
  const grouped = new Map<string, number>();
  checks
    .filter((check) => check.status === "offline")
    .forEach((check) => {
      const label = shortDate(check.checked_at);
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });
  return Array.from(grouped.entries()).map(([label, falhas]) => ({ label, falhas }));
}
