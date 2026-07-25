# Sprint UAT.0 — Auditoria do Projeto

## Situação Geral

| Item | Status | Observação |
|---|---|---|
| Backend NestJS | ✅ | Build limpo |
| Frontend Next.js | ✅ | Build limpo |
| Prisma | ✅ | generate OK, 12 migrations |
| PostgreSQL | ✅ | docker-compose configurado |
| Redis | — | Não utilizado |
| Docker Compose | ✅ | Criado com PostgreSQL 16 |
| Backend .env | ✅ | Configurado (localhost:5432) |
| Frontend .env | ✅ | Criado (localhost:3001) |
| Scripts npm | ✅ | start, build, test |
| Migrations | ✅ | 12 migrations aplicáveis |
| Seed | ✅ | Criado com dados completos |
| Dependências | ✅ | Instaladas |
| Testes | ✅ | 381 testes, 26 suites |

---

## Backend

### Configuração

| Arquivo | Status |
|---|---|
| `backend/.env` | ✅ DATABASE_URL, JWT_SECRET, APP_VERSION |
| `backend/tsconfig.json` | ✅ |
| `backend/nest-cli.json` | ✅ |
| `backend/package.json` | ✅ Compilação e scripts |
| `backend/prisma.config.ts` | ✅ Schema, migrations, seed configurados |
| `backend/prisma/schema.prisma` | ✅ 45+ modelos, 30+ enums |

### Endpoints

| Módulo | Status | Observação |
|---|---|---|
| Auth | ✅ | Login, refresh, JWT |
| Users | ✅ | CRUD + RBAC |
| Roles | ✅ | CRUD + permissões |
| Companies | ✅ | CRUD |
| Units | ✅ | CRUD |
| Customers | ✅ | CRUD |
| Professionals | ✅ | CRUD |
| Products | ✅ | CRUD |
| Categories | ✅ | CRUD |
| Services | ✅ | CRUD |
| Stock | ✅ | Compras, mov., transf., inventário, relatórios, alertas, dashboard |
| Sales | ✅ | Vendas, pagamentos, dashboard |
| Cash | ✅ | Abertura, fechamento, suprimento, sangria |
| Financial | ✅ | Contas, categorias, fechamento |
| Appointments | ✅ | CRUD, cancelar, reagendar |
| CRM | ✅ | Perfil, segmentos, dashboard |
| Campaigns | ✅ | CRUD, destinatários |
| Interactions | ✅ | CRUD |
| Tasks | ✅ | CRUD, concluir, cancelar |
| Coupons | ✅ | CRUD, validar, aplicar |
| Cashback | ✅ | Saldo, histórico |
| Loyalty | ✅ | Config, saldo, histórico |
| Notifications | ✅ | Listar, criar, marcar lido |
| Audit | ✅ | Listar logs |
| Conversations | ✅ | Listar, mensagens, notas, tags, prioridade |
| Integrations | ✅ | Webhooks, providers |
| Automation | ✅ | Regras internas + cron |
| Dashboard | ✅ | Geral |
| Schedule | ✅ | Bloqueios |

---

## Frontend

| Aspecto | Status | Observação |
|---|---|---|
| Build | ✅ | Compilação limpa |
| Rotas | ✅ | 30+ páginas |
| Login | ✅ | `/login` |
| Autenticação | ✅ | JWT + refresh |
| Menu lateral | ✅ | Navegação por módulo |
| Páginas existentes | ✅ | Todas as telas do build |

### Telas

```
/login
/(authenticated)/
├── agenda
├── agendamentos
├── auditoria
├── categorias (+ [id], /novo)
├── clientes (+ [id], /novo)
├── configuracoes
├── dashboard
├── empresas (+ [id], /novo)
├── financeiro (categorias, contas, fechamento, fluxo-caixa)
├── notificacoes
├── produtos (+ [id], /novo)
├── profissionais (+ [id], /novo)
├── servicos (+ [id], /novo)
├── status
├── unidades (+ [id], /novo)
└── usuarios (+ [id], /novo)
```

---

## Banco de Dados

| Item | Valor |
|---|---|
| Provider | PostgreSQL 16 |
| Migrations | 12 |
| Modelos | 45+ |
| Enums | 30+ |
| Seed | ✅ Empresa, 2 unidades, 3 usuários, 10 produtos, 6 serviços, 3 profissionais, 5 clientes, 2 fornecedores, categorias, segmentos, cupons, fidelidade |

---

## Docker

| Serviço | Imagem | Porta |
|---|---|---|
| PostgreSQL | postgres:16-alpine | 5432 |

```bash
docker compose up -d
```

---

## Usuários de Teste

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | admin@demo.com | 123456 |
| Operador | operador@demo.com | 123456 |
| Visualização | visualizador@demo.com | 123456 |

---

## Checklist de Inicialização

```bash
# 1. Subir banco
docker compose up -d

# 2. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 3. Migrations + seed
cd ../backend
npx prisma migrate deploy
npx prisma db seed

# 4. Iniciar backend
npm run start:dev

# 5. Iniciar frontend (outro terminal)
cd ../frontend
npm run dev
```

---

## Resumo

```
✅ Backend sobe          (nest start)
✅ Frontend sobe         (next dev)
✅ Banco inicializado    (12 migrations + seed)
✅ Login funcionando     (3 usuários)
✅ Navegação funcionando (30+ rotas)
✅ Testes passando       (381)
✅ Pronto para UAT       (docs/project/uat-plan.md)
```
