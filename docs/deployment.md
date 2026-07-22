# Deployment

## Requisitos

- **Node.js** 20+
- **PostgreSQL** 16+
- **npm** 10+

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Obrigatório | Default | Descrição |
|---|---|---|---|
| `DATABASE_URL` | sim | — | URL de conexão PostgreSQL |
| `JWT_SECRET` | sim | — | Chave secreta para assinar JWTs |
| `JWT_EXPIRES_IN` | não | `15m` | Tempo de expiração do access token |
| `JWT_REFRESH_EXPIRES_IN` | não | `7d` | Tempo de expiração do refresh token |
| `APP_VERSION` | não | `1.0.0` | Versão da aplicação (exibida no health check) |
| `CACHE_TTL` | não | `300` | TTL do cache em segundos (5 minutos) |
| `PORT` | não | `3001` | Porta do servidor |
| `NODE_ENV` | não | `development` | Ambiente (`development`, `production`, `test`) |

### Frontend (`frontend/.env`)

| Variável | Obrigatório | Default | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | não | `http://localhost:3001` | URL base da API |
| `BASE_URL` | não | `http://localhost:3000` | URL base para testes Playwright |

---

## Build

```bash
# Backend
cd backend
npm ci
npx prisma generate
npm run build            # Gera dist/

# Frontend
cd frontend
npm ci
npm run build            # Gera .next/
```

---

## Migrações e seed

### Desenvolvimento

```bash
cd backend

# Aplicar schema ao banco (sem migrations)
npx prisma db push

# Ou usar migrations
npx prisma migrate dev --name init

# Popular com dados iniciais
npx tsx prisma/seed.ts
```

### Produção

```bash
cd backend

# Aplicar migrations existentes
npx prisma migrate deploy

# Seed (apenas se necessário)
npx tsx prisma/seed.ts
```

---

## Execução em produção

```bash
# Backend
cd backend
NODE_ENV=production npm run start:prod

# Frontend
cd frontend
NEXT_PUBLIC_API_URL=https://api.exemplo.com npm start
```

---

## Docker

> **Nota:** A configuração Docker está pendente. Abaixo está o esboço recomendado.

### `docker-compose.yml` (planejado)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: barbershop_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/barbershop_erp
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### Dockerfile (planejado)

**Backend:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3001
CMD ["node", "dist/main"]
```

**Frontend:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
```

---

## CI/CD

O pipeline está definido em `.github/workflows/ci.yml` e executa automaticamente em:

- **Push** para `main` e `develop`
- **Pull request** para `main` e `develop`

### Jobs

| Job | Descrição |
|---|---|
| `backend` | Instala dependências, gera Prisma, type check, lint, build, testes unitários (185), testes de integração (112), cobertura mínima 80% |
| `frontend` | Instala dependências, type check, lint, build, testes Playwright |

### Banco de testes

O job `backend` provisiona um container PostgreSQL 16 automaticamente via `services:` do GitHub Actions:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: barbershop_erp_test
```

### Artefatos

| Artefato | Condição | Retenção |
|---|---|---|
| Relatório de cobertura (HTML) | Sempre | 30 dias |
| Logs de falha | Apenas em falha | 7 dias |
| Relatório Playwright | Apenas em falha | 7 dias |

---

## Railway (deploy atual)

O deploy atual é feito via [Railway](https://railway.app):

1. Conecte o repositório GitHub ao Railway
2. Configure as variáveis de ambiente no painel do Railway
3. Railway detecta automaticamente o `package.json` e executa `npm ci` + `npm run build`
4. Para o Prisma, adicione o script `postinstall`: `"postinstall": "prisma generate"`
5. Configure o banco PostgreSQL como serviço no Railway e use a `DATABASE_URL` fornecida
