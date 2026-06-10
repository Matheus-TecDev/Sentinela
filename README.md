# Sentinel

Sentinel é uma plataforma de observabilidade para monitorar serviços, APIs e aplicações internas em um ambiente próximo ao uso corporativo.

O MVP concentra os recursos essenciais para operação: cadastro de serviços monitorados, verificações HTTP automáticas, Dashboard operacional, histórico de verificações, autenticação JWT e controle básico de acesso por perfil. A arquitetura já está preparada para evoluir com Prometheus, Grafana, Loki e Promtail.

## Objetivo técnico

Construir uma base profissional para monitoramento de aplicações, cobrindo backend, DevOps, infraestrutura, cloud e observabilidade:

- Backend FastAPI com responsabilidades bem separadas.
- Persistência em PostgreSQL com SQLAlchemy e migrações Alembic.
- Worker interno para verificações periódicas de disponibilidade.
- Console administrativo em React com interface responsiva para operação.
- Topologia Docker Compose com Nginx como proxy de entrada e banco isolado.
- Caminho claro para integração com ferramentas de observabilidade em produção.

## Arquitetura

```text
Sentinel/
  backend/
    app/
      api/routes/        endpoints REST
      core/              configuração, segurança, enums, erros e logging
      db/                sessão SQLAlchemy e carga inicial
      models/            modelos ORM
      repositories/      acesso ao banco de dados
      schemas/           contratos Pydantic
      services/          regras de negócio
      workers/           agendador de verificações
    alembic/             migrações
  frontend/
    src/
      api/               cliente da API
      auth/              contexto de sessão JWT
      components/        layout, cards, badges e estados
      pages/             login, Dashboard, serviços e usuários
  infra/nginx/           configuração do proxy reverso
  infra/prometheus/      configuração de coleta de métricas
  infra/grafana/         datasource e dashboards provisionados
  infra/loki/            configuração de armazenamento de logs
  infra/promtail/        configuração de coleta de logs dos containers
  docker-compose.yml
```

## Stack

Backend:

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- JWT
- RBAC
- APScheduler
- HTTPX

Frontend:

- React
- TypeScript
- Vite
- CSS moderno
- lucide-react icons

Infra:

- Docker
- Docker Compose
- Nginx
- Prometheus
- Grafana
- Loki
- Promtail
- cAdvisor
- Node Exporter
- Volume persistente para PostgreSQL
- Volume persistente para Prometheus
- Volume persistente para Grafana
- Volume persistente para Loki

## Execução com Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse:

- Frontend: http://localhost
- Health do backend: http://localhost/health
- Métricas do backend: http://localhost/metrics
- API via Nginx: http://localhost/api
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

O container do backend executa `alembic upgrade head` automaticamente antes de iniciar a API.

## Administrador inicial

Credenciais padrão de desenvolvimento em `.env.example`:

```text
Email: admin@sentinel.local
Password: ChangeMe123!
```

Altere `INITIAL_ADMIN_PASSWORD` e `JWT_SECRET_KEY` antes de usar o projeto fora do ambiente local.

## Desenvolvimento local

Backend:

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Ao executar fora do Docker, configure `DATABASE_URL` apontando para uma instância acessível do PostgreSQL.

## Variáveis de ambiente

| Variável | Finalidade |
| --- | --- |
| `POSTGRES_DB` | Nome do banco PostgreSQL |
| `POSTGRES_USER` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `DATABASE_URL` | String de conexão SQLAlchemy do backend |
| `JWT_SECRET_KEY` | Segredo usado para assinar tokens JWT |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de expiração do token |
| `BACKEND_CORS_ORIGINS` | Origens permitidas para CORS, separadas por vírgula |
| `HEALTHCHECK_INTERVAL_SECONDS` | Intervalo entre execuções do monitoramento |
| `HEALTHCHECK_TIMEOUT_SECONDS` | Timeout HTTP por serviço |
| `DEGRADED_RESPONSE_TIME_MS` | Limite de tempo para considerar um serviço degradado |
| `ENABLE_HEALTHCHECK_WORKER` | Ativa ou desativa o agendador interno |
| `INITIAL_ADMIN_EMAIL` | Email do administrador inicial |
| `INITIAL_ADMIN_PASSWORD` | Senha do administrador inicial |
| `NGINX_PORT` | Porta exposta pelo Nginx no host |
| `GRAFANA_ADMIN_USER` | Usuário administrador do Grafana |
| `GRAFANA_ADMIN_PASSWORD` | Senha do administrador do Grafana |

## Principais endpoints

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`

Users:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PATCH /api/users/{id}/activation`

Services:

- `GET /api/services`
- `POST /api/services`
- `GET /api/services/{id}`
- `PUT /api/services/{id}`
- `PATCH /api/services/{id}/activation`
- `GET /api/services/{id}/checks`
- `GET /api/services/checks/history`
- `GET /api/services/checks/failures`

Dashboard:

- `GET /api/dashboard`

Health:

- `GET /health`

Metrics:

- `GET /metrics`

## RBAC

- `ADMIN`: gerencia usuários e serviços, além de visualizar Dashboard e detalhes.
- `OPERATOR`: gerencia serviços e visualiza Dashboard e detalhes.
- `VIEWER`: visualiza Dashboard e detalhes dos serviços.

## Regras de verificação

O worker do backend verifica serviços ativos em um intervalo configurável:

- Status HTTP de `200` a `399`: `online`.
- Status HTTP fora dessa faixa ou falha de rede: `offline`.
- Resposta bem-sucedida acima de `DEGRADED_RESPONSE_TIME_MS`: `degraded`.
- Timeout controlado por `HEALTHCHECK_TIMEOUT_SECONDS`.

Cada verificação é persistida com id do serviço, status, código HTTP, tempo de resposta, mensagem de erro e data da execução.

## Métricas e Prometheus

O backend expõe métricas HTTP no endpoint `/metrics` usando `prometheus-fastapi-instrumentator`.

O Prometheus está configurado em `infra/prometheus/prometheus.yml` para coletar métricas dos targets internos:

- `sentinel-backend`: métricas HTTP e de processo do FastAPI em `backend:8000/metrics`.
- `cadvisor`: métricas de containers Docker em `cadvisor:8080/metrics`.
- `node-exporter`: métricas do host em `node-exporter:9100/metrics`.

Acesse:

- Prometheus: http://localhost:9090
- Targets: http://localhost:9090/targets
- Métricas diretas do backend via Nginx: http://localhost/metrics

Para verificar se a coleta está ativa:

1. Abra http://localhost:9090/targets.
2. Confirme que os jobs `sentinel-backend`, `cadvisor` e `node-exporter` estão com estado `UP`.
3. Gere tráfego acessando o frontend ou chamando endpoints da API.

Queries básicas no Prometheus:

```promql
http_requests_total
```

Total de requests HTTP coletadas pelo FastAPI.

```promql
sum by (handler, method, status) (increase(http_requests_total{job="sentinel-backend"}[5m]))
```

Contagem real de requests por rota, método e status code nos últimos 5 minutos.

```promql
sum by (handler, method) (rate(http_requests_total{job="sentinel-backend"}[5m]))
```

Throughput de requests por segundo. Use `rate()` quando o painel ou consulta tiver semântica de taxa.

```promql
histogram_quantile(0.95, sum by (le, handler) (rate(http_request_duration_seconds_bucket[5m])))
```

Latência p95 por rota.

```promql
sum by (status) (rate(http_requests_total[5m]))
```

Taxa de requests agrupada por status code.

```promql
topk(10, sum by (handler) (increase(http_requests_total{job="sentinel-backend"}[1h])))
```

Top rotas mais acessadas na última hora.

```promql
sum by (status) (increase(http_requests_total{job="sentinel-backend", status!~"2.."}[1h]))
```

Erros HTTP agrupados por status na última hora.

```promql
100 * (1 - avg(rate(node_cpu_seconds_total{job="node-exporter", mode="idle"}[5m])))
```

Uso de CPU do host.

```promql
sum by (id) (rate(container_cpu_usage_seconds_total{job="cadvisor"}[5m]))
```

Uso de CPU por container/escopo exposto pelo cAdvisor. Em Linux nativo, labels adicionais do Docker Compose podem aparecer e permitir agrupamentos por serviço.

## Grafana

O Grafana está disponível em http://localhost:3000.

Credenciais padrão de desenvolvimento:

```text
User: admin
Password: admin
```

O datasource `Sentinel Prometheus` é provisionado automaticamente em `infra/grafana/provisioning/datasources/prometheus.yml` e aponta para:

```text
http://prometheus:9090
```

O dashboard `Sentinel Overview` é provisionado automaticamente em `infra/grafana/dashboards/sentinel-overview.json`, dentro da pasta `Sentinel`.

O dashboard inicial mostra:

- Status do backend via `up{job="sentinel-backend"}`.
- Requests por quantidade usando `increase()` em janelas de 5, 15 e 60 minutos.
- Throughput por rota e status usando `rate()` com títulos em `req/s`.
- Top rotas mais acessadas.
- Top status HTTP.
- Erros HTTP por status.
- Top endpoints com erro.
- Latência média por rota.
- Latência P95 por rota.
- Uso de CPU do processo.
- Memória residente do processo.
- CPU, memória, filesystem, rede e load average do host.
- CPU, memória, rede, filesystem e contagem de containers ativos.
- Volume de logs por serviço.
- Logs recentes do backend.

Queries principais usadas no dashboard:

```promql
up{job="sentinel-backend"}
```

```promql
sum(increase(http_requests_total{job="sentinel-backend"}[5m]))
```

```promql
sum(increase(http_requests_total{job="sentinel-backend"}[15m]))
```

```promql
sum(increase(http_requests_total{job="sentinel-backend"}[1h]))
```

```promql
sum by (handler, method) (rate(http_requests_total{job="sentinel-backend"}[5m]))
```

```promql
topk(10, sum by (handler) (increase(http_requests_total{job="sentinel-backend"}[1h])))
```

```promql
sum by (status) (increase(http_requests_total{job="sentinel-backend", status!~"2.."}[1h]))
```

```promql
sum by (handler) (rate(http_request_duration_seconds_sum{job="sentinel-backend"}[5m])) / sum by (handler) (rate(http_request_duration_seconds_count{job="sentinel-backend"}[5m]))
```

```promql
histogram_quantile(0.95, sum by (le, handler) (rate(http_request_duration_seconds_bucket{job="sentinel-backend"}[5m])))
```

```promql
rate(process_cpu_seconds_total{job="sentinel-backend"}[5m])
```

```promql
process_resident_memory_bytes{job="sentinel-backend"}
```

```promql
100 * (1 - (node_memory_MemAvailable_bytes{job="node-exporter"} / node_memory_MemTotal_bytes{job="node-exporter"}))
```

```promql
sum by (id) (container_memory_working_set_bytes{job="cadvisor"})
```

## Infraestrutura com cAdvisor e Node Exporter

O cAdvisor coleta métricas dos containers Docker, incluindo CPU, memória, rede, filesystem e presença dos containers. Ele não é exposto diretamente no host; o Prometheus acessa o serviço pela rede interna em:

```text
http://cadvisor:8080/metrics
```

O Node Exporter coleta métricas do host, incluindo CPU, memória, filesystem, rede e load average. Ele também fica acessível apenas pela rede interna do Docker Compose em:

```text
http://node-exporter:9100/metrics
```

Para validar:

1. Abra http://localhost:9090/targets.
2. Confirme `cadvisor` e `node-exporter` como `UP`.
3. No Grafana, abra o dashboard `Sentinel Overview`.
4. Confira as seções `Infraestrutura - host` e `Infraestrutura - containers`.

No Docker Desktop para Windows, algumas métricas podem representar a VM Linux usada pelo Docker Desktop, e não todos os recursos físicos do Windows diretamente. Mounts como `/`, `/sys`, `/var/lib/docker` e `/dev/disk` também podem variar conforme a versão do Docker Desktop, WSL2 e permissões do ambiente. Em alguns ambientes, o cAdvisor expõe métricas agregadas com `id="/"` em vez de labels detalhados por serviço do Docker Compose; por isso o dashboard usa `id` como fallback. Em Linux nativo, os labels por container/serviço tendem a ser mais completos. A configuração atual privilegia o melhor funcionamento local possível sem exigir instalação nativa no host.

## Logs com Loki e Promtail

O Loki armazena logs dos containers Docker em um volume persistente local. Ele fica disponível apenas na rede interna do Docker Compose e é acessado pelo Grafana pelo endereço:

```text
http://loki:3100
```

O Promtail coleta os logs dos containers via Docker socket e envia para o Loki. Os logs recebem labels úteis para consulta:

- `container`: nome do container.
- `compose_service`: serviço do Docker Compose.
- `compose_project`: projeto do Docker Compose.
- `stream`: origem do fluxo coletado pelo Promtail.

O datasource `Sentinel Loki` é provisionado automaticamente no Grafana em `infra/grafana/provisioning/datasources/prometheus.yml`.

Para acessar os logs:

1. Abra http://localhost:3000.
2. Acesse Explore.
3. Selecione o datasource `Sentinel Loki`.
4. Execute uma query LogQL.

Queries LogQL básicas:

```logql
{compose_service="backend"}
```

Logs do backend.

```logql
{compose_project="sentinel"}
```

Todos os logs do projeto Sentinel.

```logql
{compose_service="backend", stream="docker"}
```

Logs do backend coletados via Docker.

```logql
{compose_project="sentinel"} |~ "(?i)error|exception|traceback|failed"
```

Logs com termos comuns de erro.

```logql
sum by (compose_service) (rate({compose_project="sentinel"}[5m]))
```

Volume de logs por serviço.

## Comandos Docker

```bash
docker compose config
docker compose up -d --build
docker compose logs -f backend
docker compose logs -f prometheus
docker compose logs -f grafana
docker compose logs -f loki
docker compose logs -f promtail
docker compose logs -f cadvisor
docker compose logs -f node-exporter
docker compose ps
docker compose down
docker compose down -v
```

Use `docker compose down -v` somente quando quiser remover volumes persistentes e apagar os dados locais.

## MVP atual

Implementado:

- Login com JWT.
- Usuário administrador inicial.
- Dependências de RBAC nas rotas do backend.
- Cadastro e gestão de serviços monitorados.
- Ativação e desativação de serviços.
- Worker interno com verificações persistidas.
- Dashboard com totais, contagens online/offline/degradado, tempo médio de resposta, falhas recentes e uptime.
- Detalhes do serviço com últimas verificações e falhas recentes.
- Administração de usuários.
- Nginx como proxy reverso.
- Docker Compose com PostgreSQL persistente.
- Métricas FastAPI em `/metrics`.
- Prometheus com scrape do backend e volume persistente.
- Grafana com datasource Prometheus e dashboard Sentinel provisionados.
- Loki com armazenamento persistente de logs.
- Promtail coletando logs dos containers Docker.
- Grafana com datasource Loki e painéis de logs no dashboard Sentinel.
- cAdvisor coletando métricas dos containers.
- Node Exporter coletando métricas do host.
- Grafana com painéis de aplicação, containers e host.

Limitações atuais:

- Ainda não há tracing distribuído.
- Ainda não há fluxo de redefinição de senha.
- Ainda não há trilha granular de auditoria.
- As verificações atuais são apenas HTTP.

## Roadmap

Fase 2 de observabilidade:

- Criar dashboards adicionais para duração do worker, distribuição de status das verificações e uptime dos serviços.
- Adicionar regras de alerta para serviços offline e tempo de resposta degradado.

Fase 3 de maturidade da plataforma:

- Adicionar refresh tokens.
- Adicionar logs de auditoria.
- Adicionar tags de serviço e grupos responsáveis.
- Adicionar integrações de notificação.
- Adicionar verificações sintéticas por região.
- Adicionar instrumentação com OpenTelemetry.
