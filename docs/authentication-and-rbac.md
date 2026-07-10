# Autenticação e RBAC

## Fluxo de autenticação

1. O cliente envia credenciais para `POST /api/auth/login`.
2. O serviço valida o usuário e a senha.
3. A API emite um JWT assinado com HS256.
4. O cliente envia `Authorization: Bearer <token>`.
5. A dependência `get_current_user` decodifica o token e carrega o usuário do banco.
6. Usuários inexistentes ou inativos recebem `401`.

O token contém:

- `sub`: ID do usuário;
- `role`: perfil no momento da emissão;
- `exp`: expiração.

A autorização efetiva utiliza o usuário carregado do banco, evitando depender apenas do perfil presente no token.

## Senhas

As senhas são armazenadas com PBKDF2-HMAC-SHA256, salt aleatório de 16 bytes e 260.000 iterações. A comparação utiliza `hmac.compare_digest`.

## Perfis

| Operação | ADMIN | OPERATOR | VIEWER |
| --- | :---: | :---: | :---: |
| Consultar dashboard | Sim | Sim | Sim |
| Consultar serviços, checks e incidentes | Sim | Sim | Sim |
| Criar ou alterar serviços | Sim | Sim | Não |
| Configurar canais de alerta | Sim | Sim | Não |
| Gerenciar usuários | Sim | Não | Não |

As dependências reutilizáveis são:

- `viewer_access`: todos os perfis;
- `operator_access`: `ADMIN` e `OPERATOR`;
- `admin_access`: somente `ADMIN`.

## Configuração

Variáveis relevantes:

- `JWT_SECRET_KEY`;
- `JWT_ALGORITHM`, padrão `HS256`;
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`;
- credenciais do administrador inicial.

Segredos e credenciais padrão são destinados apenas ao desenvolvimento e devem ser substituídos fora do ambiente local.

## Limitações atuais

- Não há refresh token.
- Não há revogação individual de tokens.
- Não há MFA.
- A segurança de transporte depende de TLS no ambiente de implantação.
