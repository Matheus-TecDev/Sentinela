import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import type { PageProps } from "../App";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import { SelectField, type SelectOption } from "../components/SelectField";
import type { Responsible, ServiceDetail, ServiceEnvironment, ServicePayload } from "../types";

interface ServiceFormPageProps extends PageProps {
  mode: "create" | "edit";
  serviceId?: number;
}

const initialForm: ServicePayload = {
  name: "",
  description: "",
  environment: "production",
  healthcheck_url: "",
  responsible_id: null,
  owner: null,
  is_active: true
};

const environmentOptions: Array<SelectOption<ServiceEnvironment>> = [
  { value: "dev", label: "Dev" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Produção" }
];

export function ServiceFormPage({ mode, serviceId, navigate }: ServiceFormPageProps) {
  const { token, canManageServices } = useAuth();
  const [form, setForm] = useState<ServicePayload>(initialForm);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setLoading(true);
        setError("");
        const [activeResponsibles, service] = await Promise.all([
          apiRequest<Responsible[]>("/responsibles?is_active=true", {}, token),
          mode === "edit" && serviceId ? apiRequest<ServiceDetail>(`/services/${serviceId}`, {}, token) : Promise.resolve(null)
        ]);
        setResponsibles(activeResponsibles);
        if (service) {
          setForm({
            name: service.name,
            description: service.description ?? "",
            environment: service.environment,
            healthcheck_url: service.healthcheck_url,
            responsible_id: service.responsible_id,
            owner: service.owner,
            is_active: service.is_active
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar formulário");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [mode, serviceId, token]);

  const responsibleOptions = useMemo<Array<SelectOption<number>>>(
    () =>
      responsibles.map((responsible) => ({
        value: responsible.id,
        label: responsible.team ? `${responsible.name} (${responsible.team})` : responsible.name
      })),
    [responsibles]
  );

  function updateField<K extends keyof ServicePayload>(field: K, value: ServicePayload[K]): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError("");
    if (!form.responsible_id) {
      setError("Selecione um responsável pelo serviço.");
      return;
    }
    setSaving(true);
    const payload: ServicePayload = {
      ...form,
      description: form.description?.trim() ? form.description : null
    };

    try {
      const endpoint = mode === "edit" && serviceId ? `/services/${serviceId}` : "/services";
      const method = mode === "edit" ? "PUT" : "POST";
      const saved = await apiRequest<ServiceDetail>(
        endpoint,
        {
          method,
          body: JSON.stringify(payload)
        },
        token
      );
      navigate(`/services/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar serviço");
    } finally {
      setSaving(false);
    }
  }

  if (!canManageServices) {
    return (
      <div className="page-stack">
        <ErrorBanner message="Seu perfil não permite gerenciar serviços." />
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Serviço monitorado</span>
          <h2>{mode === "edit" ? "Editar serviço" : "Novo serviço"}</h2>
        </div>
        <button className="secondary-button" onClick={() => navigate("/services")} type="button">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </button>
      </div>

      <ErrorBanner message={error} />

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Nome
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </label>
        <label>
          Responsável
          <SelectField
            value={responsibleOptions.find((option) => option.value === form.responsible_id) ?? null}
            options={responsibleOptions}
            onChange={(option) => updateField("responsible_id", option?.value ?? null)}
            placeholder="Selecione um responsável"
          />
        </label>
        <label>
          Ambiente
          <SelectField
            value={environmentOptions.find((option) => option.value === form.environment) ?? null}
            options={environmentOptions}
            onChange={(option) => option && updateField("environment", option.value)}
          />
        </label>
        <label>
          URL de verificação
          <input
            value={form.healthcheck_url}
            onChange={(event) => updateField("healthcheck_url", event.target.value)}
            placeholder="https://api.empresa.com.br/health"
            required
          />
        </label>
        <label className="wide">
          Descrição
          <textarea value={form.description ?? ""} onChange={(event) => updateField("description", event.target.value)} />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
          />
          Ativo para verificação automática
        </label>
        <div className="form-actions wide">
          <button className="primary-button fit" disabled={saving}>
            <Save size={16} aria-hidden="true" />
            {saving ? "Salvando..." : "Salvar serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
