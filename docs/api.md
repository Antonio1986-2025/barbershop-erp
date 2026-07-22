# API — Documentação

**Base URL:** `http://localhost:3001/api`

**Prefixos:** Todas as rotas são prefixadas com `/api`, exceto os endpoints de health check.

**Formato:** JSON (`Content-Type: application/json`)

---

## Autenticação

### Fluxo

1. **Login** — `POST /auth/login` → recebe `accessToken` (15min) + `refreshToken` (7d)
2. **Requisições autenticadas** — enviar `Authorization: Bearer <accessToken>`
3. **Refresh** — `POST /auth/refresh` quando o access token expirar

### Cabeçalho de autenticação

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Códigos HTTP

| Código | Significado |
|---|---|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Erro de validação (payload inválido) |
| `401` | Não autenticado (token ausente, inválido ou expirado) |
| `403` | Proibido (sem permissão) |
| `404` | Recurso não encontrado |
| `409` | Conflito (recurso já existe ou vinculado) |
| `429` | Muitas requisições (rate limit) |
| `500` | Erro interno do servidor |

---

## Endpoints

### Auth

#### `POST /auth/login`

Autentica o usuário e retorna tokens JWT.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "123456"}'
```

**Request:**
```json
{
  "email": "admin@demo.com",
  "password": "123456"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBh...",
  "user": {
    "id": "uuid",
    "email": "admin@demo.com",
    "name": "Admin",
    "companyId": "uuid",
    "companyName": "Barbearia Demo",
    "roles": ["admin"],
    "permissions": ["dashboard.view", "users.create", ...]
  }
}
```

**Rate limit:** 10 requisições por minuto por IP

---

#### `POST /auth/refresh`

Renova o access token usando um refresh token válido.

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "dGhpcyBpcyBh..."}'
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "bmV3IHJlZnJl..."
}
```

**Rate limit:** 20 requisições por minuto por IP

---

#### `POST /auth/logout`

Revoga todos os refresh tokens do usuário.

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (201):**
```json
{
  "message": "Sessão encerrada"
}
```

---

#### `GET /auth/me`

Retorna dados do usuário autenticado.

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "admin@demo.com",
  "name": "Admin",
  "companyId": "uuid",
  "companyName": "Barbearia Demo",
  "roles": [{"id": "uuid", "name": "Admin", "slug": "admin"}],
  "permissions": ["dashboard.view", "users.create", ...]
}
```

---

### Dashboard

Todas as rotas de dashboard requerem autenticação JWT e permissão `dashboard.view` ou `dashboard.analytics`.

#### `GET /dashboard/summary`

```bash
curl "http://localhost:3001/api/dashboard/summary?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Parâmetros de query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `startDate` | string | sim | Data inicial (YYYY-MM-DD) |
| `endDate` | string | sim | Data final (YYYY-MM-DD) |
| `unitId` | string | não | Filtrar por unidade |

**Response (200):**
```json
{
  "revenue": 5000.00,
  "appointments": 100,
  "completedServices": 80,
  "averageTicket": 62.50,
  "customers": 40
}
```

#### `GET /dashboard/overview`

Análise consolidada com crescimento e taxa de cancelamento.

```bash
curl "http://localhost:3001/api/dashboard/overview?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "revenueTotal": 10000.00,
  "revenueGrowth": 25.0,
  "appointmentsTotal": 100,
  "completedAppointments": 70,
  "cancellationRate": 10.0,
  "averageTicket": 142.86,
  "activeCustomers": 60,
  "newCustomers": 15
}
```

#### `GET /dashboard/revenue-chart`

```bash
curl "http://localhost:3001/api/dashboard/revenue-chart?startDate=2026-06-01&endDate=2026-07-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
[
  {"date": "2026-06-01", "revenue": 300.00, "payments": 3},
  {"date": "2026-06-02", "revenue": 450.00, "payments": 5}
]
```

#### `GET /dashboard/professionals-ranking`

```bash
curl "http://localhost:3001/api/dashboard/professionals-ranking?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
[
  {
    "professionalId": "uuid",
    "name": "Carlos",
    "appointments": 20,
    "completed": 20,
    "revenue": 1000.00,
    "averageTicket": 50.00
  }
]
```

#### `GET /dashboard/alerts`

```bash
curl "http://localhost:3001/api/dashboard/alerts" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
[
  {
    "type": "STOCK",
    "severity": "warning",
    "message": "Estoque baixo: Shampoo (2)"
  },
  {
    "type": "FINANCIAL",
    "severity": "critical",
    "message": "3 conta(s) vencida(s) a pagar"
  }
]
```

---

### Customers

#### `GET /customers`

```bash
curl "http://localhost:3001/api/customers?page=1&limit=10&search=João" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "phone": "11999999999",
      "email": "joao@email.com",
      "active": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### `POST /customers`

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "phone": "11999999999", "email": "joao@email.com"}'
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "active": true
}
```

---

### Appointments

#### `GET /appointments/calendar`

```bash
curl "http://localhost:3001/api/appointments/calendar?startDate=2026-07-01&endDate=2026-07-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "customer": {"id": "uuid", "name": "João Silva"},
    "professional": {"id": "uuid", "name": "Carlos"},
    "service": {"id": "uuid", "name": "Corte"},
    "startAt": "2026-07-15T14:00:00.000Z",
    "status": "SCHEDULED"
  }
]
```

#### `POST /appointments`

```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid",
    "professionalId": "uuid",
    "serviceId": "uuid",
    "startAt": "2026-07-15T14:00:00.000Z",
    "unitId": "uuid"
  }'
```

#### `POST /appointments/:id/cancel`

```bash
curl -X POST http://localhost:3001/api/appointments/123/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `POST /appointments/:id/reschedule`

```bash
curl -X POST http://localhost:3001/api/appointments/123/reschedule \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"startAt": "2026-07-16T10:00:00.000Z"}'
```

---

### Schedule

#### `GET /schedule/business-hours`

```bash
curl "http://localhost:3001/api/schedule/business-hours" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `GET /schedule/availability`

```bash
curl "http://localhost:3001/api/schedule/availability?date=2026-07-15&professionalId=uuid&unitId=uuid" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Financial

#### `GET /financial/accounts`

```bash
curl "http://localhost:3001/api/financial/accounts?type=PAYABLE&status=OPEN" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `GET /financial/cash-flow`

```bash
curl "http://localhost:3001/api/financial/cash-flow?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Notifications

#### `GET /notifications`

```bash
curl "http://localhost:3001/api/notifications" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `GET /notifications/unread-count`

```bash
curl "http://localhost:3001/api/notifications/unread-count" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `PATCH /notifications/:id/read`

```bash
curl -X PATCH http://localhost:3001/api/notifications/123/read \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Audit Logs

#### `GET /audit-logs`

```bash
curl "http://localhost:3001/api/audit-logs?page=1&limit=10&entity=user&action=CREATE" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {"id": "uuid", "name": "Admin", "email": "admin@demo.com"},
      "action": "CREATE",
      "entity": "user",
      "entityId": "uuid",
      "oldData": null,
      "newData": "{\"name\": \"João\"}",
      "createdAt": "2026-07-21T10:00:00.000Z"
    }
  ],
  "meta": {"page": 1, "limit": 10, "total": 1, "totalPages": 1}
}
```

---

### Health

#### `GET /health`

```bash
curl http://localhost:3001/health
```

**Response (200):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345
}
```

#### `GET /health/ready`

Inclui verificação da conexão com o banco de dados.

```bash
curl http://localhost:3001/health/ready
```

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## Rate limiting

| Rota | Limite | Janela |
|---|---|---|
| Todas as rotas | 120 requisições | 60 segundos |
| `POST /auth/login` | 10 requisições | 60 segundos |
| `POST /auth/refresh` | 20 requisições | 60 segundos |

Quando excedido, retorna `429 Too Many Requests`.

---

## Modelos de dados comuns

### Paginação

Endpoints de listagem seguem o formato:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Parâmetros de query:**

| Parâmetro | Default | Descrição |
|---|---|---|
| `page` | 1 | Número da página |
| `limit` | 10 | Itens por página |
| `search` | — | Busca textual |
| `orderBy` | `createdAt` | Campo de ordenação |
| `orderDir` | `desc` | Direção (`asc` / `desc`) |
| `active` | — | Filtrar por ativo (`true` / `false`) |
