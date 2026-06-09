import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Gauge, RadioTower, Server, ShieldAlert, TimerReset, Wifi } from "lucide-react";

import type { PageProps } from "../App";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import type { DashboardSummary, HealthCheckResult } from "../types";
import {
  alertChannelLabel,
  environmentLabel,
  formatDate,
  formatDuration,
  formatMs,
  formatPercent,
  incidentStatusLabel,
  notificationEventLabel,
  notificationStatusLabel,
  visualStatus
} from "../utils";

export function Dashboard({ navigate }: PageProps) {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setLoading(true);
        setData(await apiRequest<DashboardSummary>("/dashboard", {}, token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>();
    data?.services.forEach((service) => map.set(service.id, service.name));
    return map;
  }, [data]);

  if (loading) return <Loading />;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Visão geral dos serviços</span>
          <h2>Dashboard operacional</h2>
        </div>
        <button className="secondary-button" onClick={() => navigate("/services")}>
          <Server size={16} aria-hidden="true" />
          Ver serviços
        </button>
      </div>

      <ErrorBanner message={error} />

      {data ? (
        <>
          <section className="stats-grid">
            <StatCard title="Total" value={data.total_services} helper="serviços cadastrados" icon={Server} />
            <StatCard title="Online" value={data.online_services} helper="Operacional" icon={Wifi} tone="good" />
            <StatCard title="Offline" value={data.offline_services} helper="Requer atenção" icon={AlertTriangle} tone="bad" />
            <StatCard title="Degradados" value={data.degraded_services} helper="acima do limite" icon={TimerReset} tone="warn" />
            <StatCard title="Incidentes abertos" value={data.open_incidents} helper="em acompanhamento" icon={ShieldAlert} tone={data.open_incidents ? "bad" : "good"} />
            <StatCard title="Falhas em 24h" value={data.failures_last_24h} helper="verificações offline" icon={RadioTower} tone={data.failures_last_24h ? "bad" : "good"} />
            <StatCard title="Resposta média" value={formatMs(data.average_response_time_ms)} helper="Histórico geral" icon={Gauge} />
            <StatCard title="Uptime geral" value={formatPercent(data.overall_uptime_percent)} helper="online + degradado" icon={Activity} tone="good" />
            <StatCard
              title="Prometheus"
              value={
                <a className="stat-link" href="http://localhost:9090" target="_blank" rel="noreferrer">
                  Ativo
                </a>
              }
              helper="Métricas HTTP em /metrics"
              icon={BarChart3}
              tone="good"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Incidentes recentes</h3>
                  <span>Eventos abertos ou resolvidos mais recentemente</span>
                </div>
              </div>
              {data.recent_incidents.length === 0 ? (
                <EmptyState title="Sem incidentes" message="Nenhum incidente foi registrado até o momento." />
              ) : (
                <div className="incident-list">
                  {data.recent_incidents.map((incident) => (
                    <div className="incident-item" key={incident.id} onClick={() => navigate(`/services/${incident.service_id}`)}>
                      <div>
                        <strong>{incident.service_name}</strong>
                        <span>{incident.reason}</span>
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

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Serviços mais instáveis</h3>
                  <span>Mais verificações offline ou degradadas nas últimas 24 horas</span>
                </div>
              </div>
              {data.unstable_services.length === 0 ? (
                <EmptyState title="Sem instabilidade recente" message="Nenhum serviço teve falhas ou degradação nas últimas 24 horas." />
              ) : (
                <div className="rank-list">
                  {data.unstable_services.map((item) => (
                    <button key={item.service_id} onClick={() => navigate(`/services/${item.service_id}`)}>
                      <span>{item.service_name}</span>
                      <strong>{item.unhealthy_checks}</strong>
                      <small>{item.failure_checks} offline | {item.incident_count} incidentes</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Piores tempos de resposta</h3>
                  <span>Maiores médias nas últimas 24 horas</span>
                </div>
              </div>
              {data.slowest_services.length === 0 ? (
                <EmptyState title="Sem tempos recentes" message="Nenhuma resposta HTTP foi registrada nas últimas 24 horas." />
              ) : (
                <div className="rank-list">
                  {data.slowest_services.map((item) => (
                    <button key={item.service_id} onClick={() => navigate(`/services/${item.service_id}`)}>
                      <span>{item.service_name}</span>
                      <strong>{formatMs(item.average_response_time_ms)}</strong>
                      <small>tempo médio</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-grid two-columns">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Últimas notificações</h3>
                  <span>Alertas enviados ou tentados recentemente</span>
                </div>
              </div>
              {data.recent_notifications.length === 0 ? (
                <EmptyState title="Sem notificações" message="Nenhuma tentativa de alerta foi registrada." />
              ) : (
                <div className="notification-list">
                  {data.recent_notifications.map((notification) => (
                    <div className="notification-item" key={notification.id}>
                      <div>
                        <strong>{notification.service_name}</strong>
                        <span>{notificationEventLabel(notification.event_type)}</span>
                      </div>
                      <div>
                        <span>{alertChannelLabel(notification.channel_type)}</span>
                        <small>{notificationStatusLabel(notification.status)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Falhas de envio de alerta</h3>
                  <span>Canais que precisam de revisão operacional</span>
                </div>
              </div>
              {data.failed_notifications.length === 0 ? (
                <EmptyState title="Sem falhas de envio" message="Nenhum alerta falhou recentemente." />
              ) : (
                <div className="notification-list">
                  {data.failed_notifications.map((notification) => (
                    <div className="notification-item failed" key={notification.id}>
                      <div>
                        <strong>{notification.service_name}</strong>
                        <span>{notification.masked_target}</span>
                      </div>
                      <div>
                        <span>{notification.error_message ?? "Falha ao enviar alerta"}</span>
                        <small>{formatDate(notification.sent_at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Serviços monitorados</h3>
                <span>Status atual consolidado pela última verificação registrada</span>
              </div>
            </div>
            {data.services.length === 0 ? (
              <EmptyState title="Nenhum serviço cadastrado" message="Cadastre APIs e aplicações para iniciar o monitoramento." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th>Ambiente</th>
                      <th>Status</th>
                      <th>HTTP</th>
                      <th>Tempo</th>
                      <th>Última verificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map((service) => (
                      <tr key={service.id} onClick={() => navigate(`/services/${service.id}`)}>
                        <td>
                          <strong>{service.name}</strong>
                          <span>{service.owner}</span>
                        </td>
                        <td>{environmentLabel(service.environment)}</td>
                        <td>
                          <StatusBadge status={visualStatus(service)} />
                        </td>
                        <td>{service.last_http_status_code ?? "Sem registro"}</td>
                        <td>{formatMs(service.last_response_time_ms)}</td>
                        <td>{formatDate(service.last_checked_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Últimas falhas</h3>
                <span>Eventos offline mais recentes registrados pelo monitoramento</span>
              </div>
            </div>
            {data.recent_failures.length === 0 ? (
              <EmptyState title="Sem falhas recentes" message="Nenhum status offline foi registrado até o momento." />
            ) : (
              <div className="failure-list">
                {data.recent_failures.map((failure: HealthCheckResult) => (
                  <div className="failure-item" key={failure.id}>
                    <StatusBadge status="offline" />
                    <div>
                      <strong>{serviceNameById.get(failure.service_id) ?? `Serviço #${failure.service_id}`}</strong>
                      <span>{failure.error_message ?? "Falha sem mensagem detalhada"}</span>
                    </div>
                    <time>{formatDate(failure.checked_at)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <EmptyState title="Dashboard indisponível" message="A API não retornou dados operacionais." />
      )}
    </div>
  );
}
