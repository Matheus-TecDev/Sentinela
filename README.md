# Sentinela

Sentinela é uma plataforma full stack de observabilidade para monitoramento de APIs, serviços internos e aplicações corporativas.

O projeto simula um ambiente próximo ao uso em produção, com backend FastAPI, banco PostgreSQL, autenticação JWT, controle de acesso por perfil, verificações HTTP automáticas, dashboard operacional, proxy reverso com Nginx e stack local de observabilidade com Prometheus, Grafana, Loki, Promtail, cAdvisor e Node Exporter.

## Objetivo técnico

Construir uma base profissional para monitoramento de aplicações, demonstrando competências práticas em backend, infraestrutura, Docker, observabilidade e operação de sistemas.

O projeto cobre:

- API REST com FastAPI organizada em camadas.
- Persistência relacional com PostgreSQL, SQLAlchemy e Alembic.
- Autenticação JWT e controle de acesso baseado em perfis.
- Worker interno para verificações periódicas de disponibilidade.
- Dashboard web para acompanhamento operacional.
- Deploy local com Docker Compose e Nginx como ponto único de entrada.
- Métricas com Prometheus e dashboards no Grafana.
- Coleta de logs com Loki e Promtail.
- Métricas de host e containers com Node Exporter e cAdvisor.

## Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- JWT
- RBAC
- APScheduler
- HTTPX

### Frontend

- React
- TypeScript
- Vite
- CSS moderno
- lucide-react

### Infraestrutura e observabilidade

- Docker
- Docker Compose
- Nginx
- Prometheus
- Grafana
- Loki
- Promtail
- cAdvisor
- Node Exporter
- Volumes persistentes para PostgreSQL, Prometheus, Grafana e Loki

## Arquitetura

```text
Sentinela/
  backend/
    app/
      api/routes/        Endpoints REST
      core/              Configuração, segurança, enums, erros e logging
      db/                Sessão SQLAlchemy e carga inicial
      models/            Modelos ORM
      repositories/      Acesso ao banco de dados
      schemas/           Contratos Pydantic
      services/          Regras de negócio
      workers/           Agendador de verificações
    alembic/             Migrações de banco
  frontend/
    src/
      api/               Cliente HTTP da API
      auth/              Contexto de autenticação JWT
      components/        Componentes visuais reutilizáveis
      pages/             Login, dashboard, serviços e usuários
  infra/
    nginx/               Proxy reverso
    prometheus/          Configuração de scrape
    grafana/             Datasources e dashboards provisionados
    loki/                Armazenamento de logs
    promtail/            Coleta de logs dos containers
  docker-compose.yml
```

## Fluxo da aplicação

```text
Usuário -> Nginx :80
Nginx /        -> frontend
Nginx /api     -> backend:8000
Nginx /metrics -> backend:8000/metrics
Backend        -> PostgreSQL
Prometheus     -> backend, cAdvisor e Node Exporter
Grafana        -> Prometheus
Promtail       -> logs dos containers
Loki           -> armazenamento e consulta de logs
```

## Funcionalidades implementadas

- Login com JWT.
- Controle de acesso por perfil.
- Cadastro e gerenciamento de serviços monitorados.
- Verificações HTTP periódicas.
- Classificação de serviço como online, offline ou degradado.
- Histórico de verificações persistido no banco.
- Dashboard operacional.
- Métricas Prometheus expostas pelo backend.
- Dashboard Grafana provisionado automaticamente.
- Coleta de logs dos containers.
- Stack completa com Docker Compose.
- Proxy reverso com Nginx.

## Perfis de acesso

- `ADMIN`: gerencia usuários e serviços, além de visualizar dashboard e detalhes operacionais.
- `OPERATOR`: gerencia serviços e visualiza dashboard e detalhes.
- `VIEWER`: visualiza dashboard e detalhes dos serviços.

## Regras de monitoramento

O worker do backend verifica os serviços ativos em intervalo configurável.

Critérios usados:

- Status HTTP entre `200` e `399`: serviço online.
- Status HTTP fora dessa faixa ou erro de rede: serviço offline.
- Resposta bem-sucedida acima do limite configurado: serviço degradado.
- Timeout controlado por variável de ambiente.

Cada verificação salva:

- serviço monitorado;
- status calculado;
- código HTTP;
- tempo de resposta;
- mensagem de erro, quando existir;
- data e hora da execução.

## Como executar com Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse:

- Frontend: `http://localhost`
- API via Nginx: `http://localhost/api`
- Healthcheck: `http://localhost/health`
- Métricas: `http://localhost/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

O backend executa `alembic upgrade head` automaticamente antes de iniciar a API.

## Variáveis de ambiente

| Variável | Finalidade |
| --- | --- |
| `POSTGRES_DB` | Nome do banco PostgreSQL |
| `POSTGRES_USER` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `DATABASE_URL` | String de conexão SQLAlchemy do backend |
| `JWT_SECRET_KEY` | Segredo usado para assinar tokens JWT |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de expiração do token |
| `BACKEND_CORS_ORIGINS` | Origens permitidas para CORS |
| `HEALTHCHECK_INTERVAL_SECONDS` | Intervalo entre verificações |
| `HEALTHCHECK_TIMEOUT_SECONDS` | Timeout HTTP por serviço |
| `DEGRADED_RESPONSE_TIME_MS` | Limite para considerar resposta degradada |
| `ENABLE_HEALTHCHECK_WORKER` | Ativa ou desativa o worker interno |
| `INITIAL_ADMIN_EMAIL` | Email do administrador inicial |
| `INITIAL_ADMIN_PASSWORD` | Senha do administrador inicial |
| `NGINX_PORT` | Porta exposta pelo Nginx |
| `GRAFANA_ADMIN_USER` | Usuário administrador do Grafana |
| `GRAFANA_ADMIN_PASSWORD` | Senha administrador do Grafana |

Antes de usar fora de ambiente local, altere os segredos, senhas e configurações sensíveis do `.env`.

## Desenvolvimento local

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

No Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ao executar fora do Docker, configure `DATABASE_URL` apontando para uma instância acessível do PostgreSQL.

## Endpoints principais

### Autenticação

- `POST /api/auth/login`
- `GET /api/auth/me`

### Usuários

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PATCH /api/users/{id}/activation`

### Serviços monitorados

- `GET /api/services`
- `POST /api/services`
- `GET /api/services/{id}`
- `PUT /api/services/{id}`
- `PATCH /api/services/{id}/activation`
- `GET /api/services/{id}/checks`
- `GET /api/services/checks/history`
- `GET /api/services/checks/failures`

### Dashboard, health e métricas

- `GET /api/dashboard`
- `GET /health`
- `GET /metrics`

## Observabilidade

O backend expõe métricas HTTP em `/metrics` usando instrumentação Prometheus.

O Prometheus coleta métricas dos seguintes targets internos:

- backend FastAPI;
- cAdvisor;
- Node Exporter.

O Grafana sobe com datasource e dashboard provisionados para acompanhamento de:

- disponibilidade do backend;
- quantidade de requisições;
- throughput por rota;
- status HTTP;
- erros por endpoint;
- latência média;
- latência P95;
- uso de CPU e memória;
- métricas de host;
- métricas de containers;
- logs recentes.

## Validação

```bash
cd backend
python -m compileall app
pytest -q

cd ../frontend
npm install
npm run build
```

## Roadmap

- Alertas automáticos para falhas e degradação.
- Notificações por e-mail, webhook ou Discord.
- Tracing distribuído com OpenTelemetry.
- Exportação de relatórios de disponibilidade.
- Deploy em cloud com banco gerenciado.
- Pipeline CI/CD completo.
- Autenticação mais robusta com refresh token.
- Hardening de segurança para ambiente público.

## Status

Projeto em evolução, com foco em demonstrar arquitetura full stack, práticas de infraestrutura e fundamentos de observabilidade aplicados a um cenário corporativo realista.
