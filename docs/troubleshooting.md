# Troubleshooting

## Prisma

### Erro: `Can't reach database server`

```
PrismaClientInitializationError: Can't reach database server
```

**Causa:** O PostgreSQL não está rodando ou a `DATABASE_URL` está incorreta.

**Solução:**
```bash
# Verificar se o PostgreSQL está rodando
pg_isready

# Verificar a URL de conexão
echo $DATABASE_URL

# Formato esperado:
# postgresql://usuario:senha@host:5432/nome_banco?schema=public
```

### Erro: `Relation "public.Company" does not exist`

```
InvalidPrismaRequestError: Relation "public.Company" does not exist
```

**Causa:** O schema do banco não foi aplicado.

**Solução:**
```bash
# Aplicar schema
npx prisma db push

# Ou rodar migrations
npx prisma migrate dev
```

### Erro: `TypeError: Do not know how to serialize a BigInt`

**Causa:** O Prisma retorna `BigInt` para campos `Decimal`/`BigInt` e o JSON não serializa.

**Solução:** O backend já possui interceptação global para converter BigInt. Se o erro persistir, verifique se o `GlobalExceptionFilter` está registrado em `main.ts`.

### Erro de geração do Prisma Client

```bash
# Regenerar o cliente
npx prisma generate

# Se persistir, limpar cache
npx prisma generate --no-hints
```

---

## PostgreSQL

### Porta 5432 já em uso

```bash
# Windows
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5432
kill -9 <PID>
```

### Reset do banco de testes

```bash
cd backend
npx prisma db push --accept-data-loss --url="postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public"
npx tsx prisma/seed.ts
```

Ou use o script de teardown existente:
```bash
npx tsx test/teardown.ts
```

---

## Migrations

### Erro: `Migration `...` was not applied to the database`

```bash
# Verificar estado das migrations
npx prisma migrate status

# Se houver divergence, resetar
npx prisma migrate reset

# Ou criar nova migration
npx prisma migrate dev --name fix-issue
```

### Erro: `P3009` — Migration found in database but not in project

```bash
# Resolver com
npx prisma migrate resolve --applied <migration_name>
```

---

## Testes

### Testes unitários falhando

```bash
cd backend
npm run test:unit -- --verbose    # Ver detalhes de cada teste
npm run test:unit -- --no-cache   # Ignorar cache do Jest
```

**Problema comum:** Mocks desatualizados. Se um serviço recebeu uma nova dependência (ex: `CacheService`), o teste precisa ser atualizado:

```typescript
// Adicionar ao mock
cache = { getOrSet: jest.fn((_key, fn) => fn()) };

// Adicionar ao providers
{ provide: CacheService, useValue: cache }
```

### Testes de integração falhando

```bash
cd backend
npm run test:e2e -- --verbose
```

**Verificações:**
1. PostgreSQL está rodando?
2. Banco de testes foi criado? (`barbershop_erp_test`)
3. Seed foi executado?
4. Porta 5432 está disponível?

### Erro: `Nest can't resolve dependencies`

**Causa:** Teste não está provendo todos os mocks necessários.

**Solução:** Verificar o construtor do serviço e adicionar todos os providers faltantes no `TestingModule`:

```typescript
const module = await Test.createTestingModule({
  providers: [
    MeuServico,
    { provide: PrismaService, useValue: prismaMock },
    // Adicionar aqui qualquer dependência faltante
  ],
}).compile();
```

---

## Playwright

### Erro: `Cannot find module '@playwright/test'`

```bash
cd frontend
npm install
npx playwright install chromium
```

### Erro: `Target page, context or browser has been closed`

**Causa:** O servidor Next.js não está rodando ou caiu antes dos testes.

**Solução:**
```bash
# Iniciar servidor em outro terminal
cd frontend
npm start

# Em outro terminal
cd frontend
BASE_URL=http://localhost:3000 npx playwright test
```

### Testes Playwright falham no CI

**Verificações:**
1. O Chromium foi instalado? (`npx playwright install chromium`)
2. O servidor Next.js está rodando e acessível?
3. O healthcheck no workflow (`curl -s http://localhost:3000`) está passando?

---

## GitHub Actions

### Pipeline falhou — como debugar

1. Acesse a aba **Actions** no GitHub
2. Selecione o workflow com falha
3. Clique no job (Backend ou Frontend) para ver os logs
4. Se houver artefatos de falha, faça o download (coverage, logs, Playwright report)

### Erro: `PostgreSQL service not ready`

```yaml
# Verificar healthcheck no workflow
services:
  postgres:
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

Aumentar `--health-retries` se necessário.

### Erro: `npm ci` falha no CI

```bash
# Verificar se o package-lock.json está atualizado
cd backend
npm install           # Atualiza lock
git add package-lock.json
git commit -m "chore: update lock"
```

### Erro: TypeScript check falha (`tsc --noEmit`)

```bash
# Rodar localmente para ver os erros
cd backend
npx tsc --noEmit

cd frontend
npx tsc --noEmit
```

### Erro: Cobertura abaixo de 80%

```bash
# Rodar cobertura localmente
cd backend
npm run test:coverage

# Ver relatório em backend/coverage/index.html
# Adicionar testes para as áreas descobertas
```

---

## Problemas comuns no desenvolvimento

### `ERR_HTTP_HEADERS_SENT`

**Causa:** A resposta foi enviada mais de uma vez em um controller/service.

**Solução:** Verificar se não há `return` duplicado ou chamadas de `res.send()` após já ter retornado.

### `JWT_EXPIRED`

**Causa:** O `accessToken` expirou (15 minutos).

**Solução:** O frontend deve chamar `POST /auth/refresh` automaticamente. Verificar se o interceptor de refresh está configurado no `AuthContext`.

### Cache retornando dados obsoletos

**Causa:** O `CacheService` tem TTL de 5 minutos. Pode estar servindo dados antigos.

**Solução:** Aguardar o TTL ou forçar refresh na interface. Se necessário, ajustar `CACHE_TTL` no `.env`.

### Erro de CORS

```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000'
```

**Solução:** Verificar `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## Logs

### Backend

Os logs são gerados pelo `LoggingInterceptor` global. Em desenvolvimento, aparecem no console:

```
[Nest] 12345  - 21/07/2026 10:00:00     LOG [LoggingInterceptor] POST /api/auth/login 201 45ms
```

Para logs mais detalhados:
```bash
NODE_ENV=development npm run start:dev
```

### Frontend

Logs do navegador (Console + Network) disponíveis no DevTools. O React Query também loga queries/mutations em modo desenvolvimento.
