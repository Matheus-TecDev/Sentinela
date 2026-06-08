import { FormEvent, useEffect, useState } from "react";
import { Plus, Power, Save, Users as UsersIcon } from "lucide-react";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { Loading } from "../components/Loading";
import { SelectField, type SelectOption } from "../components/SelectField";
import type { User, UserRole } from "../types";
import { formatDate } from "../utils";

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const initialForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER"
};

const roleOptions: Array<SelectOption<UserRole>> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "OPERATOR", label: "Operador" },
  { value: "VIEWER", label: "Visualizador" }
];

export function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserForm>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadUsers(): Promise<void> {
    try {
      setLoading(true);
      setError("");
      setUsers(await apiRequest<User[]>("/users", {}, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [token]);

  async function createUser(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<User>(
        "/users",
        {
          method: "POST",
          body: JSON.stringify({ ...form, is_active: true })
        },
        token
      );
      setForm(initialForm);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(user: User, role: UserRole): Promise<void> {
    try {
      await apiRequest<User>(
        `/users/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ role })
        },
        token
      );
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao editar usuário");
    }
  }

  async function toggleUser(user: User): Promise<void> {
    try {
      await apiRequest<User>(
        `/users/${user.id}/activation`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !user.is_active })
        },
        token
      );
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar usuário");
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Controle de acesso</span>
          <h2>Usuários</h2>
        </div>
      </div>

      <ErrorBanner message={error} />

      <form className="panel form-grid" onSubmit={createUser}>
        <div className="panel-heading wide">
          <div>
            <h3>Novo usuário</h3>
            <span>Defina o perfil de acesso antes de liberar a conta.</span>
          </div>
        </div>
        <label>
          Nome
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          E-mail
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Senha
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            type="password"
            minLength={8}
            required
          />
        </label>
        <label>
          Perfil
          <SelectField
            value={roleOptions.find((option) => option.value === form.role)}
            options={roleOptions}
            onChange={(option) => option && setForm({ ...form, role: option.value })}
          />
        </label>
        <div className="form-actions wide">
          <button className="primary-button fit" disabled={saving}>
            <Plus size={16} aria-hidden="true" />
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Contas cadastradas</h3>
            <span>Perfis aplicados nas permissões da API.</span>
          </div>
          <UsersIcon size={20} aria-hidden="true" />
        </div>
        {loading ? (
          <Loading />
        ) : users.length === 0 ? (
          <EmptyState title="Nenhum usuário" message="Crie o primeiro usuário para operar a plataforma." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span>#{user.id}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <SelectField
                        value={roleOptions.find((option) => option.value === user.role)}
                        options={roleOptions}
                        onChange={(option) => option && updateRole(user, option.value)}
                      />
                    </td>
                    <td>{user.is_active ? "Ativo" : "Inativo"}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <button className="icon-button" onClick={() => toggleUser(user)} title="Ativar ou desativar" type="button">
                        {user.is_active ? <Power size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                      </button>
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
