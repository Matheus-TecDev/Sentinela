import { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, Power, Save, Search, Users } from "lucide-react";

import type { PageProps } from "../App";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import type { Responsible, ResponsiblePayload } from "../types";
import { formatDate } from "../utils";

const initialForm: ResponsiblePayload = {
  name: "",
  email: "",
  team: "",
  is_active: true
};

export function ResponsiblesPage({ navigate }: PageProps) {
  const { token, canManageServices } = useAuth();
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [form, setForm] = useState<ResponsiblePayload>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    try {
      setLoading(true);
      setError("");
      const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      setResponsibles(await apiRequest<Responsible[]>(`/responsibles${query}`, {}, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar responsáveis");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, token]);

  async function saveResponsible(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canManageServices) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        email: form.email?.trim() ? form.email : null,
        team: form.team?.trim() ? form.team : null
      };
      const endpoint = editingId ? `/responsibles/${editingId}` : "/responsibles";
      const method = editingId ? "PUT" : "POST";
      await apiRequest<Responsible>(
        endpoint,
        {
          method,
          body: JSON.stringify(payload)
        },
        token
      );
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar responsável");
    } finally {
      setSaving(false);
    }
  }

  async function toggleResponsible(responsible: Responsible): Promise<void> {
    try {
      await apiRequest<Responsible>(
        `/responsibles/${responsible.id}/activation`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !responsible.is_active })
        },
        token
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar responsável");
    }
  }

  function editResponsible(responsible: Responsible): void {
    setEditingId(responsible.id);
    setForm({
      name: responsible.name,
      email: responsible.email ?? "",
      team: responsible.team ?? "",
      is_active: responsible.is_active
    });
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Dados operacionais</span>
          <h2>Responsáveis</h2>
        </div>
        <button className="secondary-button" onClick={() => navigate("/services")} type="button">
          Ver serviços
        </button>
      </div>

      <ErrorBanner message={error} />

      {canManageServices && (
        <form className="panel form-grid" onSubmit={saveResponsible}>
          <div className="panel-heading wide">
            <div>
              <h3>{editingId ? "Editar responsável" : "Novo responsável"}</h3>
              <span>Mantenha contatos e equipes usados pelos serviços monitorados.</span>
            </div>
          </div>
          <label>
            Nome
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            E-mail
            <input value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Equipe
            <input value={form.team ?? ""} onChange={(event) => setForm({ ...form, team: event.target.value })} />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            Responsável ativo
          </label>
          <div className="form-actions wide">
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancelar
              </button>
            )}
            <button className="primary-button fit" disabled={saving}>
              {editingId ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar responsável"}
            </button>
          </div>
        </form>
      )}

      <section className="toolbar compact-toolbar">
        <label className="search-input">
          <Search size={16} aria-hidden="true" />
          <input placeholder="Buscar por nome ou e-mail" value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Responsáveis cadastrados</h3>
            <span>Pessoas ou equipes associadas aos serviços.</span>
          </div>
          <Users size={20} aria-hidden="true" />
        </div>
        {loading ? (
          <Loading />
        ) : responsibles.length === 0 ? (
          <EmptyState title="Nenhum responsável encontrado" message="Cadastre responsáveis para vincular aos serviços." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Equipe</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {responsibles.map((responsible) => (
                  <tr key={responsible.id}>
                    <td>
                      <strong>{responsible.name}</strong>
                      <span>#{responsible.id}</span>
                    </td>
                    <td>{responsible.email ?? "Sem e-mail"}</td>
                    <td>{responsible.team ?? "Sem equipe"}</td>
                    <td>{responsible.is_active ? "Ativo" : "Inativo"}</td>
                    <td>{formatDate(responsible.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" onClick={() => editResponsible(responsible)} title="Editar" type="button">
                          <Edit3 size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => toggleResponsible(responsible)}
                          title="Ativar ou desativar"
                          type="button"
                        >
                          <Power size={16} aria-hidden="true" />
                        </button>
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
