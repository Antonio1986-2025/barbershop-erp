# Sprint 012 — Autenticação e Autorização

## Objetivo

Implementar o sistema completo de autenticação e autorização da plataforma utilizando a estrutura de usuários, perfis e permissões já existente no banco de dados.

Esta Sprint marca o início da Fase 2 do projeto, tornando o ERP seguro e preparado para uso em ambiente real.

---

## Escopo

Implementar:
- Login
- Logout
- Refresh Token
- JWT
- Guards
- RBAC (Role Based Access Control)
- Proteção das rotas da API
- Proteção das páginas do Frontend

---

## Fluxo

```
Usuário
    │
    ▼
Login
    │
    ▼
JWT
    │
    ▼
Auth Guard
    │
    ▼
Role Guard
    │
    ▼
Permission Guard
    │
    ▼
Endpoint
```

---

## Endpoints

### POST /auth/login

Entrada:
```json
{
  "email": "admin@empresa.com",
  "password": "123456"
}
```

Retorno:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {}
}
```

### POST /auth/refresh

Recebe o Refresh Token. Retorna novo Access Token.

### POST /auth/logout

Invalida o Refresh Token.

### GET /auth/me

Retorna: usuário, empresa, unidade, perfis, permissões.

---

## Regras de Negócio

### RN001

Senha armazenada utilizando hash (Argon2 ou bcrypt).

### RN002

Nunca armazenar senha em texto puro.

### RN003

Access Token com expiração curta.

### RN004

Refresh Token renovável.

### RN005

Todas as rotas privadas utilizam JWT.

### RN006

Permissões controladas por Role e Permission.

---

## Frontend

Implementar:
- tela de login;
- logout;
- armazenamento seguro do token;
- interceptação automática de requisições;
- redirecionamento para login quando não autenticado.

---

## Critérios de Aceite

- Login funcionando.
- Logout funcionando.
- JWT válido.
- Refresh Token funcionando.
- Guards protegendo a API.
- Frontend autenticado.
- Dashboard acessível apenas para usuários autenticados.
- Controle de permissões funcionando.

---

## Resultado Esperado

Ao final desta Sprint, o sistema deverá permitir que apenas usuários autenticados acessem os módulos da aplicação, utilizando autenticação baseada em JWT e autorização por papéis e permissões.
