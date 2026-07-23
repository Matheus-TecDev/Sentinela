# API

The API uses the `/api` prefix. Except for login and the health endpoint, routes require a valid Bearer token.

## Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Authenticates and returns a JWT |
| GET | `/api/auth/me` | Authenticated | Returns the current user |

## Users

All operations require `ADMIN`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/users` | Lists users |
| POST | `/api/users` | Creates a user |
| PUT | `/api/users/{user_id}` | Updates a user |
| PATCH | `/api/users/{user_id}/activation` | Activates or deactivates a user |

## Services and Checks

Read operations require `VIEWER`, `OPERATOR`, or `ADMIN`. Creation and updates require `OPERATOR` or `ADMIN`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/services` | Lists and filters services |
| POST | `/api/services` | Registers a service |
| GET | `/api/services/{service_id}` | Returns service details |
| PUT | `/api/services/{service_id}` | Updates a service |
| PATCH | `/api/services/{service_id}/activation` | Changes activation state |
| GET | `/api/services/checks/history` | Returns global check history |
| GET | `/api/services/checks/failures` | Returns recent failures |
| GET | `/api/services/{service_id}/checks` | Returns service checks |
| GET | `/api/services/{service_id}/metrics` | Returns metrics for a time range |
| GET | `/api/services/{service_id}/incidents` | Returns service incidents |

Service lists support text, environment, status, and activation filters. History endpoints accept limits from 1 through 500 records.

## Alerts and Notifications

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/services/{service_id}/alerts` | Read | Lists channels |
| POST | `/api/services/{service_id}/alerts` | Operate | Creates a channel |
| PUT | `/api/services/{service_id}/alerts/{alert_id}` | Operate | Updates a channel |
| PATCH | `/api/services/{service_id}/alerts/{alert_id}/activation` | Operate | Changes activation state |
| GET | `/api/services/{service_id}/notifications` | Read | Lists delivery attempts |

Modeled channel types are `webhook`, `discord`, and `email`. This version sends webhook and Discord notifications; email attempts are logged as failed because SMTP has not been implemented.

## Dashboard and Operations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | Authenticated | Returns an operational summary |
| GET | `/api/incidents` | Read | Lists incidents, optionally filtered by status and service |
| GET | `/api/responsibles` | Read | Lists responsible contacts |
| POST | `/api/responsibles` | Operate | Creates a responsible contact |
| PUT | `/api/responsibles/{responsible_id}` | Operate | Updates a responsible contact |
| PATCH | `/api/responsibles/{responsible_id}/activation` | Operate | Changes responsible-contact activation |
| GET | `/health` | Public | Checks API health |
| GET | `/metrics` | Infrastructure | Exposes Prometheus metrics |

The health endpoint confirms that the API process responds; it does not query PostgreSQL. The metrics endpoint includes received HTTP metrics and Sentinel's outbound monitoring metrics.

## Errors

- `401`: missing, invalid, or expired token, or inactive user;
- `403`: insufficient role;
- `404`: resource not found;
- `422`: invalid input contract.

The application registers custom handlers for HTTP and validation errors.
