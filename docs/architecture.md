# Arquitetura

## Visão geral

O Sentinela é organizado como uma aplicação full stack containerizada. O Nginx é o ponto de entrada, o frontend React fornece a interface operacional e a API FastAPI concentra autenticação, regras de monitoramento, incidentes e persistência.

```text
Cliente -> Nginx -> Frontend React
                 -> API FastAPI -> PostgreSQL
                         |
                         +-> APScheduler -> HTTP checks
                                           |
                                           +-> incidentes
                                           +-> notificações

Prometheus -> API + cAdvisor + Node Exporter
Grafana    -> Prometheus + Loki
Promtail   -> Loki
```

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| Nginx | Ponto único de entrada e proxy reverso |
| Frontend | Dashboard e operação dos serviços monitorados |
| FastAPI | API, autenticação, RBAC e regras de negócio |
| PostgreSQL | Usuários, serviços, checks, incidentes, canais e notificações |
| APScheduler | Disparo periódico das verificações |
| Prometheus | Coleta de métricas HTTP, host e containers |
| Grafana | Consulta e visualização de métricas e logs |
| Loki e Promtail | Armazenamento e coleta de logs dos containers |
| cAdvisor | Métricas dos containers |
| Node Exporter | Métricas do host |

## Organização do backend

```text
app/
  api/routes/     Rotas HTTP
  core/           Configuração, segurança, enums, erros e logging
  db/             Sessão e inicialização do banco
  models/         Entidades SQLAlchemy
  repositories/   Consultas e persistência
  schemas/        Contratos Pydantic
  services/       Regras de negócio
  workers/        Scheduler de verificações
```

As rotas delegam regras aos serviços; os serviços utilizam repositories para acesso ao banco. O worker chama o serviço de health check, sincroniza incidentes e aciona notificações.

## Inicialização

No lifespan da API:

1. o logging é configurado;
2. o administrador inicial é criado quando necessário;
3. o scheduler é iniciado se `ENABLE_HEALTHCHECK_WORKER=true`;
4. no encerramento, o scheduler é finalizado.

O container do backend aplica `alembic upgrade head` antes de iniciar o Uvicorn.

## Persistência

Principais entidades:

- `User`: identidade, perfil e estado de ativação;
- `MonitoredService`: URL, ambiente, responsável e ativação;
- `HealthCheckResult`: resultado individual de cada verificação;
- `Incident`: período de indisponibilidade ou degradação;
- `AlertChannel`: destino e preferências de notificação;
- `NotificationLog`: resultado de cada tentativa de entrega.

Os checks, incidentes, canais e logs de notificação pertencem a um serviço monitorado.

## Limitações atuais

- O scheduler roda dentro do processo da API. Mais de uma réplica pode executar verificações duplicadas sem coordenação externa.
- O processamento percorre os serviços ativos sequencialmente.
- A entrega de alertas ocorre no mesmo fluxo do worker, sem fila persistente.
- O SMTP está modelado, mas o envio de e-mail ainda não foi implementado.
- O ambiente atual é orientado a Docker Compose; não há infraestrutura cloud declarada.
