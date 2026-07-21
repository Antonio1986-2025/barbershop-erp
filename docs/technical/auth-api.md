# Auth — Especificação Técnica

## Objetivo

Implementar a camada de autenticação da aplicação utilizando JWT e a estrutura de usuários já existente.

Não serão criadas novas tabelas nesta Sprint.

Estrutura reutilizada: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`.

---

## Módulos

```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── jwt.strategy.ts
├── jwt-auth.guard.ts
├── roles.guard.ts
├── permissions.guard.ts
├── decorators/
│   ├── roles.decorator.ts
│   └── permissions.decorator.ts
└── dto/
    ├── login.dto.ts
    └── refresh-token.dto.ts
```

---

## DTOs

### LoginDto

```typescript
class LoginDto {
  email: string;
  password: string;
}
```

### RefreshTokenDto

```typescript
class RefreshTokenDto {
  refreshToken: string;
}
```

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Autentica usuário |
| POST | /auth/refresh | Renova Access Token |
| POST | /auth/logout | Invalida Refresh Token |
| GET | /auth/me | Retorna dados do usuário autenticado |

---

## JWT

- **Access Token**: expiração curta (15–30 minutos)
- **Refresh Token**: expiração longa (7–30 dias)

Payload do Access Token:

```json
{
  "sub": "user-id",
  "email": "user@email.com",
  "companyId": "company-id"
}
```

---

## Segurança

- Hash de senha utilizando Argon2 (fallback bcrypt).
- Nunca retornar hash na API.

---

## Guards

| Guard | Responsabilidade |
|-------|-----------------|
| JwtAuthGuard | Validar JWT |
| RolesGuard | Validar perfis |
| PermissionsGuard | Validar permissões |

---

## Decorators

- `@Roles(...)` — define perfis necessários
- `@Permissions(...)` — define permissões necessárias

---

## Fluxo

```
Login
  ↓
valida usuário
  ↓
valida senha
  ↓
gera Access Token
  ↓
gera Refresh Token
  ↓
retorna usuário autenticado
```

---

## Frontend (posterior)

- `/login`
- middleware
- Auth Context
- interceptor HTTP
- logout automático

---

## Critérios Técnicos

- Reutilizar User, Role e Permission existentes.
- Não criar novas migrations.
- Separar autenticação da autorização.
- Preparar estrutura para futuras integrações OAuth.
