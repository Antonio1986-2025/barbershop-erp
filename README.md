# Barbershop ERP

![CI/CD](https://github.com/Antonio1986-2025/barbershop-erp/actions/workflows/ci.yml/badge.svg?branch=main)
![Testes](https://github.com/Antonio1986-2025/barbershop-erp/actions/workflows/ci.yml/badge.svg?branch=main&label=testes)
![Cobertura](https://img.shields.io/badge/cobertura-%3E%3D80%25-brightgreen)

Sistema de gestão para barbearias — agendamentos, financeiro, estoque, notificações e mais.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS 4 |
| Backend | NestJS 11 + TypeScript |
| Banco | PostgreSQL |
| ORM | Prisma 7 |
| Autenticação | JWT + Passport + Argon2 |
| Cache | In-memory (Map, TTL configurável) |
| Gráficos | Recharts |
| Gerenciamento de estado | TanStack React Query |
| Testes backend | Jest 30 |
| Testes frontend | Playwright |
| CI/CD | GitHub Actions |

---

## Estrutura de diretórios

```
.
├── .github/workflows/   # Pipeline CI/CD
├── backend/
│   ├── prisma/          # Schema + migrations + seed
│   ├── src/
│   │   ├── modules/     # 19 módulos (auth, dashboard, appointment, ...)
│   │   ├── prisma/      # PrismaModule + PrismaService
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── test/            # 185 unit + 112 integration tests
├── docs/                # Documentação técnica
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router (37 páginas)
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── contexts/    # AuthContext
│   │   ├── hooks/       # React Query hooks
│   │   └── lib/         # API client libraries
│   └── tests/           # Playwright E2E
└── docker-compose.yml
```

---

## Requisitos

- **Node.js** 20+
- **PostgreSQL** 16+
- **npm** 10+

---

## Configuração (.env)

Crie `backend/.env`:

```env
DATABASE_URL=postgresql://postgres@localhost:5432/barbershop_erp_dev
JWT_SECRET=sua-chave-secreta-aqui
APP_VERSION=1.0.0
```

Para testes, `backend/.env.test`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public
JWT_SECRET=test-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Instalação e execução local

```bash
# Backend
cd backend
npm install
# Crie backend/.env com base na seção "Configuração (.env)" acima
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run start:dev            # http://localhost:3001

# Frontend (outro terminal)
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

---

## Execução via Docker

> **Nota:** A configuração Docker está pendente. Veja `docs/deployment.md` para detalhes.

---

## Scripts úteis

### Backend

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Iniciar em modo desenvolvimento |
| `npm run build` | Compilar TypeScript |
| `npm run test:unit` | Testes unitários (185) |
| `npm run test:e2e` | Testes de integração (112) |
| `npm run test:coverage` | Cobertura de testes |
| `npm run lint` | Verificar ESLint |

### Frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Iniciar em modo desenvolvimento |
| `npm run build` | Compilar Next.js |
| `npm run lint` | Verificar ESLint |
| `npm test` | Testes Playwright |

---

## Como executar testes

```bash
# Todos os testes do backend
cd backend
npm run test:unit            # 185 testes unitários
npm run test:e2e             # 112 testes de integração
npm run test:coverage        # Com cobertura (mínimo 80%)

# Testes do frontend
cd frontend
npx playwright install       # Primeira vez apenas
npm test                     # Testes E2E Playwright
```

---

## Como executar a pipeline localmente

Instale [act](https://github.com/nektos/act) para rodar GitHub Actions localmente:

```bash
act -j backend               # Job do backend
act -j frontend              # Job do frontend
act                          # Workflow completo
```

---

## Badges

| Badge | Descrição |
|---|---|
| ![CI/CD](https://github.com/Antonio1986-2025/barbershop-erp/actions/workflows/ci.yml/badge.svg?branch=main) | Status do pipeline na branch `main` |
| ![Cobertura](https://img.shields.io/badge/cobertura-%3E%3D80%25-brightgreen) | Cobertura mínima de 80% |

---

Para documentação detalhada, veja a pasta [`docs/`](docs/).
