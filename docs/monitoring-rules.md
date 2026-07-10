# Regras de monitoramento

## Agendamento

O `AsyncIOScheduler` executa `execute_healthchecks` em intervalo configurado por `HEALTHCHECK_INTERVAL_SECONDS`.

Configurações do job:

- `max_instances=1`: impede sobreposição dentro do mesmo processo;
- `coalesce=True`: consolida execuções atrasadas;
- primeira execução aproximadamente cinco segundos após a inicialização;
- timezone UTC.

Somente serviços ativos são selecionados.

## Execução do check

Para cada serviço, o worker realiza uma requisição GET com:

- timeout definido por `HEALTHCHECK_TIMEOUT_SECONDS`;
- redirecionamentos habilitados;
- medição do tempo total com contador monotônico.

## Classificação

| Condição | Resultado |
| --- | --- |
| HTTP 200–399 e tempo dentro do limite | `online` |
| HTTP 200–399 acima de `DEGRADED_RESPONSE_TIME_MS` | `degraded` |
| HTTP fora de 200–399 | `offline` |
| Timeout ou erro HTTP/rede | `offline` |

O resultado persiste código HTTP, latência, erro e horário.

## Incidentes

Após cada check:

- `offline` ou `degraded` sem incidente aberto cria um incidente;
- novos resultados problemáticos atualizam o incidente aberto;
- `online` resolve o incidente aberto e calcula sua duração;
- `online` sem incidente aberto não produz transição.

Um serviço mantém, pela regra de sincronização, no máximo um incidente aberto relevante ao fluxo.

## Notificações

Notificações são disparadas somente nas transições:

- abertura de incidente;
- recuperação e resolução.

Cada canal escolhe se deseja receber eventos de indisponibilidade, degradação e recuperação.

Destinos implementados:

- webhook HTTP genérico;
- webhook do Discord.

O tipo e-mail existe no modelo, mas SMTP ainda não está implementado. Todas as tentativas geram `NotificationLog` com status `sent` ou `failed`.

## Considerações operacionais

O scheduler embutido é adequado ao MVP com uma única réplica. Para escalar horizontalmente, o monitoramento deve migrar para um worker coordenado ou sistema de filas, evitando checks duplicados.
