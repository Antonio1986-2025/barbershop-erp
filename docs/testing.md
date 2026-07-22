# Testes

## Stack

| Ferramenta | Versão | Uso |
|---|---|---|
| Jest | ^30 | Runner de testes |
| Supertest | ^7 | Testes HTTP (E2E) |
| ts-jest | ^29 | Transpilação TypeScript |
| PostgreSQL 18 | — | Banco de dados dos testes E2E |

---

## Como executar

```bash
# Testes unitários
npm test
npm run test:unit          # mesma coisa

# Testes de integração (E2E)
npm run test:integration
npm run test:e2e           # mesma coisa

# Todos os testes (unit + integração)
npx jest --config ./test/jest-e2e.json

# Com cobertura
npm run test:cov
npm run test:coverage      # mesma coisa

# Modo watch
npm run test:watch

# Debug
npm run test:debug
```

---

## Como recriar o banco de testes

```bash
# 1. Sincroniza o schema (cria tabelas e colunas faltantes)
npx prisma db push --accept-data-loss \
  --url="postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public"

# 2. Popula os dados mínimos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public" \
  npx tsx prisma/seed.ts
```

Isso é feito automaticamente pelo `global-setup.ts` na primeira execução dos testes E2E. O `teardown.ts` limpa o banco ao final (`DROP SCHEMA public CASCADE`).

**Credencial padrão:** `admin@demo.com` / `123456`

---

## Estrutura de diretórios

```
test/
  jest-e2e.json              Configuração Jest para testes E2E
  setup.ts                   Seta variáveis de ambiente nos workers
  global-setup.ts            Cria banco + seed (uma vez antes dos testes)
  teardown.ts                Limpa banco (uma vez depois dos testes)
  sanity.spec.ts             Teste "sanity check" (1+1=2)

  helpers/
    test-app.ts              createTestApp() — aplicação NestJS real
    auth.ts                  Helpers de login (getAuthToken, loginAsUser, etc.)
    authenticated-request.ts Requisição autenticada com Supertest

  factories/
    index.ts                 Factories para criar entidades no banco

  unit/                      Testes unitários (mocks, sem banco)
    auth/         auth.service.spec.ts
    users/        user.service.spec.ts
    services/     service.service.spec.ts
    customers/    customer.service.spec.ts
    professionals/ professional.service.spec.ts
    appointments/ appointment.service.spec.ts

  integration/               Testes de integração (banco real, HTTP)
    auth/         auth.e2e-spec.ts
    users/        users.e2e-spec.ts
    services/     services.e2e-spec.ts
    customers/    customers.e2e-spec.ts
    professionals/ professionals.e2e-spec.ts
    appointments/ appointments.e2e-spec.ts
```

---

## Helpers

### `test/helpers/test-app.ts`

```typescript
import { createTestApp, cleanupDatabase } from '../../helpers/test-app';
```

| Função | Descrição |
|---|---|
| `createTestApp()` | Cria a aplicação NestJS real com `ValidationPipe` (transform + whitelist). Conecta no banco de testes. |
| `cleanupDatabase(prisma)` | Dá TRUNCATE em todas as tabelas (na ordem correta de chaves estrangeiras). Útil para `afterEach`. |

### `test/helpers/auth.ts`

```typescript
import { getAuthToken, loginAsUser, loginAsAdmin, getAdminCredentials } from '../../helpers/auth';
```

| Função | Descrição |
|---|---|
| `getAuthToken(app, email?, password?)` | Faz login e retorna o `accessToken`. Default: `admin@demo.com` / `123456`. |
| `loginAsUser(app, email, password)` | Login com credenciais específicas. |
| `loginAsAdmin(app)` | Login automático como admin (busca o primeiro admin no banco). |
| `getAdminCredentials(app)` | Retorna `{ companyId, userId, email }` do admin. |

### `test/helpers/authenticated-request.ts`

```typescript
import { authenticatedRequest, withAuth } from '../../helpers/authenticated-request';
```

| Função | Descrição |
|---|---|
| `authenticatedRequest(app)` | Retorna agente Supertest já com `Authorization: Bearer <token>`. |

---

## Factories

Arquivo: `test/factories/index.ts`

Todas as factories recebem `(prisma, companyId, overrides?)` e usam `Date.now()` em campos únicos.

```typescript
import { createCompany, createUser, createUnit, createCustomer,
         createProfessional, createService, createAppointment,
         createFinancialCategory, createFinancialAccount } from '../../factories';
```

| Factory | Campos com override |
|---|---|
| `createCompany(prisma, overrides?)` | corporateName, tradeName, document, email, phone |
| `createUser(prisma, companyId, overrides?)` | name, email, passwordHash |
| `createUnit(prisma, companyId, overrides?)` | name, code |
| `createCustomer(prisma, companyId, overrides?)` | name, email, phone |
| `createProfessional(prisma, companyId, overrides?)` | name, email, phone |
| `createService(prisma, companyId, overrides?)` | name, description, durationMinutes, price |
| `createAppointment(prisma, companyId, overrides?)` | unit, customer, professional, service, startAt |
| `createFinancialCategory(prisma, companyId, overrides?)` | name, type |
| `createFinancialAccount(prisma, companyId, overrides?)` | category, description, type, amount, dueDate |

---

## Convenções para novos testes

### Unitários (`test/unit/`)

- Mock do `PrismaService` com `jest.fn()` para cada método usado.
- Mock do `AuditService` com `{ create: jest.fn() }`.
- Mock do `NotificationsService` com `{ createFromAppointment: jest.fn() }` (appointment).
- Usar `Test.createTestingModule` com `{ provide: X, useValue: mock }`.
- `afterEach` com `jest.clearAllMocks()`.
- Testar pelo menos: sucesso, não encontrado, conflito, validação, auditoria.

### Integração (`test/integration/`)

- `beforeAll`: criar app com `createTestApp()`, obter token com `getAuthToken(app)`, buscar referências (companyId etc.).
- `afterEach`: deletar registros criados no teste.
- `afterAll`: `app.close()`.
- Usar Supertest (`request(httpServer)`) para chamadas HTTP.
- Usar `Date.now()` em emails para garantir unicidade.
- Testar status code e corpo da resposta.
- Testar validação (400), autenticação (401), RBAC (403), não encontrado (404), conflito (409).

### Nomenclatura

| Tipo | Padrão | Localização |
|---|---|---|
| Unitário | `nome.service.spec.ts` | `test/unit/<modulo>/` |
| Integração | `nome.e2e-spec.ts` | `test/integration/<modulo>/` |

---

## Configuração Jest

### Unitários (embutida no `package.json`)

```json
{
  "testMatch": ["<rootDir>/src/**/*.spec.ts", "<rootDir>/test/**/*.spec.ts"],
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["src/**/*.(t|j)s"],
  "coverageDirectory": "./coverage",
  "testEnvironment": "node"
}
```

### Integração (`test/jest-e2e.json`)

```json
{
  "rootDir": "..",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": { "^@/(.*)$": "<rootDir>/src/$1" },
  "setupFiles": ["<rootDir>/test/setup.ts"],
  "globalSetup": "<rootDir>/test/global-setup.ts",
  "globalTeardown": "<rootDir>/test/teardown.ts"
}
```

---

## Observações

- **Isolamento:** Testes unitários usam mocks e não tocam no banco. Testes E2E usam banco real `barbershop_erp_test` e dependem do seed.
- **Paralelismo:** Jest roda testes em workers paralelos. O `setup.ts` garante que cada worker use o banco de testes.
- **Limpeza:** O `teardown.ts` destrói o schema `public` ao final. Cada suite E2E faz sua própria limpeza no `afterEach`.
- **Seed:** Recria dados toda vez que o `global-setup.ts` executa. As factories garantem unicidade com `Date.now()`.
