# Sprint 012.4 — Frontend de Autenticação

## Objetivo

Implementar o fluxo completo de autenticação no frontend Next.js utilizando a API já desenvolvida.

---

## Escopo

Implementar:
- Página de Login
- Auth Context
- Armazenamento do Access Token
- Cliente HTTP autenticado
- Middleware de proteção
- Logout
- Redirecionamento automático

---

## Estrutura

```
frontend/src/
├── app/
│   └── login/
│       └── page.tsx
├── contexts/
│   └── auth-context.tsx
├── lib/
│   ├── auth.ts
│   └── api.ts
├── middleware.ts
└── components/
    └── auth/
```

---

## Fluxo

```
Usuário
  ↓
Tela de Login
  ↓
POST /api/auth/login
  ↓
Recebe JWT
  ↓
Salva sessão
  ↓
Redireciona Dashboard
  ↓
Requisições autenticadas
  ↓
401
  ↓
Logout automático
  ↓
Volta para Login
```

---

## Funcionalidades

### Login

Campos: email, senha. Botão: Entrar.

### Logout

Limpar sessão. Redirecionar para /login.

### Auth Context

Responsável por: usuário autenticado, login(), logout(), loading.

### Middleware

Proteger: /dashboard, /clientes, /profissionais, /agenda, /financeiro, /estoque.

### Cliente HTTP

Adicionar automaticamente: `Authorization: Bearer TOKEN`.

---

## Critérios de Aceite

- Login funcionando.
- Logout funcionando.
- Dashboard protegido.
- Token enviado automaticamente.
- Redirecionamento quando não autenticado.
- Sessão restaurada ao recarregar a página.
