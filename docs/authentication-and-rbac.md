# Authentication and RBAC

## Authentication Flow

1. The client submits credentials to `POST /api/auth/login`.
2. The service validates the user and password.
3. The API issues an HS256-signed JWT.
4. The client sends `Authorization: Bearer <token>`.
5. The `get_current_user` dependency decodes the token and loads the user from the database.
6. Missing or inactive users receive `401`.

The token contains:

- `sub`: user ID;
- `role`: role at issuance time;
- `exp`: expiration.

Effective authorization uses the user loaded from the database instead of relying only on the role embedded in the token.

## Passwords

Passwords are stored with PBKDF2-HMAC-SHA256, a random 16-byte salt, and 260,000 iterations. Comparisons use `hmac.compare_digest`.

## Roles

| Operation | ADMIN | OPERATOR | VIEWER |
| --- | :---: | :---: | :---: |
| View dashboard | Yes | Yes | Yes |
| View services, checks, and incidents | Yes | Yes | Yes |
| Create or update services | Yes | Yes | No |
| Configure alert channels | Yes | Yes | No |
| Manage users | Yes | No | No |

Reusable authorization dependencies:

- `viewer_access`: all roles;
- `operator_access`: `ADMIN` and `OPERATOR`;
- `admin_access`: `ADMIN` only.

## Configuration

Relevant environment variables:

- `JWT_SECRET_KEY`;
- `JWT_ALGORITHM`, default `HS256`;
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`;
- initial administrator credentials.

Default secrets and credentials are intended for development only and must be replaced outside the local environment.

## Current Limitations

- Refresh tokens are not implemented.
- Tokens cannot be individually revoked.
- MFA is not implemented.
- Transport security depends on TLS in the deployment environment.
