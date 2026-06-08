import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Power, Search, Server } from "lucide-react";

import type { PageProps } from "../App";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import { SelectField, type SelectOption } from "../components/SelectField";
import { StatusBadge } from "../components/StatusBadge";
import type { HealthStatus, MonitoredService, ServiceEnvironment } from "../types";
import { environmentLabel, formatDate, formatMs, visualStatus } from "../utils";

type ActiveFilter = "" | "true" | "false";

const environmentOptions: Array<SelectOption<ServiceEnvironment | "">> = [
  { value: "", label: "Todos os ambientes" },
  { value: "dev", label: "Dev" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Produção" }
];

const statusOptions: Array<SelectOption<HealthStatus | "">> = [
  { value: "", label: "Todos os status" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "degraded", label: "Degradado" }
];

const activeOptions: Array<SelectOption<ActiveFilter>> = [
  { value: "", label: "Ativos e inativos" },
  { value: "true", label: "Somente ativos" },
  { value: "false", label: "Somente inativos" }
];

export function ServicesPage({ navigate }: PageProps) {
  const { token, canManageServices } = useAuth();
  const [services, setServices] = useState<MonitoredService[]>([]);
  const [q, setQ] = useState("");
  const [environment, setEnvironment] = useState<ServiceEnvironment | "">("");
  const [status, setStatus] = useState<HealthStatus | "">("");
  const [active, setActive] = useState<ActiveFilter>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (environment) params.set("environment", environment);
    if (status) params.set("status", status);
    if (active) params.set("is_active", active);
    const serialized = params.toString();
    return serialized ? `?${serialized}` : "";
  }, [active, environment, q, status]);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setServices(await apiRequest<MonitoredService[]>(`/services${query}`, {}, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar serviços");
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  async function toggleService(service: MonitoredService): Promise<void> {
    try {
      await apiRequest<MonitoredService>(
        `/services/${service.id}/activation`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !service.is_active })
        },
        token
      );
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar serviço");
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Serviços</span>
          <h2>Serviços monitorados</h2>
        </div>
        {canManageServices && (
          <button className="primary-button fit" onClick={() => navigate("/services/new")} type="button">
            <Plus size={16} aria-hidden="true" />
            Novo serviço
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      <section className="toolbar">
        <label className="search-input">
          <Search size={16} aria-hidden="true" />
          <input placeholder="Pesquisar por nome" value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
        <SelectField
          value={environmentOptions.find((option) => option.value === environment)}
          options={environmentOptions}
          onChange={(option) => setEnvironment(option?.value ?? "")}
        />
        <SelectField
          value={statusOptions.find((option) => option.value === status)}
          options={statusOptions}
          onChange={(option) => setStatus(option?.value ?? "")}
        />
        <SelectField
          value={activeOptions.find((option) => option.value === active)}
          options={activeOptions}
          onChange={(option) => setActive(option?.value ?? "")}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Inventário</h3>
            <span>Serviços, responsáveis e status de monitoramento.</span>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : services.length === 0 ? (
          <EmptyState title="Nenhum serviço encontrado" message="Ajuste os filtros ou cadastre um serviço." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Responsável</th>
                  <th>Ambiente</th>
                  <th>Status</th>
                  <th>HTTP</th>
                  <th>Tempo</th>
                  <th>Última verificação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="clickable-cell" onClick={() => navigate(`/services/${service.id}`)}>
                      <strong>{service.name}</strong>
                      <span>{service.healthcheck_url}</span>
                    </td>
                    <td>{service.owner}</td>
                    <td>{environmentLabel(service.environment)}</td>
                    <td>
                      <StatusBadge status={visualStatus(service)} />
                    </td>
                    <td>{service.last_http_status_code ?? "Sem registro"}</td>
                    <td>{formatMs(service.last_response_time_ms)}</td>
                    <td>{formatDate(service.last_checked_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" onClick={() => navigate(`/services/${service.id}`)} title="Detalhes" type="button">
                          <Server size={16} aria-hidden="true" />
                        </button>
                        {canManageServices && (
                          <>
                            <button
                              className="icon-button"
                              onClick={() => navigate(`/services/${service.id}/edit`)}
                              title="Editar"
                              type="button"
                            >
                              <Edit3 size={16} aria-hidden="true" />
                            </button>
                            <button
                              className="icon-button"
                              onClick={() => toggleService(service)}
                              title="Ativar ou desativar"
                              type="button"
                            >
                              <Power size={16} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
