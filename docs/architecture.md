# Arquitetura do Sistema

## Visão geral

O Barbershop ERP segue uma arquitetura **monolítica modular** no backend (NestJS) com frontend separado (Next.js). A comunicação entre frontend e backend ocorre via REST API com autenticação JWT.

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js 16)"]
        Pages["App Router<br/>37 páginas"]
        Components["Componentes<br/>Reutilizáveis"]
        RQ["TanStack React Query<br/>Cache + Refetch"]
        AuthCtx["AuthContext<br/>JWT Token"]
    end

    subgraph Backend["Backend (NestJS 11)"]
        REST["REST API<br/>/api/*"]
        Guards["Guards<br/>JWT + RBAC + Throttler"]
        Modules["19 Módulos"]
        Cache["CacheService<br/>In-memory"]
        Observability["Observability<br/>Health + Logging"]
    end

    subgraph Database["PostgreSQL + Prisma ORM"]
        DB[(Database<br/>28 modelos)]
        Migrations["Migrations"]
        Seed["Seed Data"]
    end

    Frontend -->|HTTP :3000| REST
    REST --> Guards
    Guards --> Modules
    Modules --> Cache
    Modules --> DB
    Observability --> DB
```

---

## Módulos do backend

```mermaid
graph LR
    subgraph Core["Núcleo"]
        Auth["Auth<br/>JWT + RBAC"]
        Cache["Cache<br/>In-memory"]
        Prisma["Prisma<br/>ORM"]
        Observability["Observability<br/>Health/Logs"]
    end

    subgraph Business["Negócio"]
        Dashboard["Dashboard<br/>Métricas"]
        Appointment["Appointment<br/>Agendamentos"]
        Schedule["Schedule<br/>Horários"]
        Customer["Customer<br/>Clientes"]
        Professional["Professional<br/>Profissionais"]
        Service["Service<br/>Serviços"]
        Product["Product<br/>Produtos"]
    end

    subgraph Financial["Financeiro"]
        FinancialModule["Financial<br/>Contas/Fluxo"]
        Cash["Cash<br/>Caixa"]
    end

    subgraph Support["Suporte"]
        Notification["Notification<br/>Notificações"]
        Audit["Audit<br/>Auditoria"]
        Company["Company<br/>Empresas"]
        User["User<br/>Usuários"]
        Role["Role<br/>Papéis"]
        Unit["Unit<br/>Unidades"]
        Category["Category<br/>Categorias"]
        Settings["Settings<br/>Configs"]
    end

    Business --> Core
    Financial --> Core
    Support --> Core
```

### Lista completa (19 módulos)

| Módulo | Responsabilidade |
|---|---|
| `auth` | Autenticação JWT, refresh token, RBAC |
| `dashboard` | Métricas, gráficos, alertas |
| `appointment` | Agendamentos, status, reagendamento |
| `schedule` | Horários de funcionamento, bloqueios, disponibilidade |
| `customer` | CRUD de clientes |
| `professional` | CRUD de profissionais |
| `service` | CRUD de serviços |
| `category` | CRUD de categorias de produtos |
| `product` | CRUD de produtos, estoque |
| `unit` | CRUD de unidades/filiais |
| `user` | CRUD de usuários, vínculo com papéis |
| `company` | CRUD de empresas |
| `company-settings` | Configurações da empresa (logo, cores) |
| `financial` | Contas a pagar/receber, fluxo de caixa |
| `notifications` | Notificações push/in-app |
| `audit` | Logs de auditoria de todas as ações |
| `observability` | Health checks, request ID, logging |
| `role` | Papéis e permissões |
| `cache` | Cache in-memory com TTL |

---

## Fluxo de autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Email + Senha
    F->>B: POST /auth/login
    B->>DB: Buscar usuário + hash
    B->>B: Verificar argon2
    B->>DB: Criar refresh token (argon2)
    B->>B: Gerar JWT (15min)
    B-->>F: { accessToken, refreshToken, user }
    F->>F: Armazenar tokens
    F->>F: Redirecionar para /dashboard

    Note over F,B: Requisição autenticada

    F->>B: GET /api/recurso (Authorization: Bearer JWT)
    B->>B: Validar JWT (Passport)
    B->>B: Verificar roles/permissões (Guards)
    B-->>F: Resposta do recurso

    Note over F,B: Refresh automático

    F->>B: POST /auth/refresh
    B->>DB: Validar refresh token
    B->>DB: Revogar token antigo
    B->>DB: Criar novo refresh token
    B-->>F: { accessToken, refreshToken }
```

### Componentes da autenticação

- **JwtAuthGuard** — Estende `AuthGuard('jwt')` do Passport. Verifica se o token JWT é válido.
- **RolesGuard** — Lê o decorator `@Roles()` e consulta os papéis do usuário no banco.
- **PermissionsGuard** — Lê o decorator `@Permissions()` e verifica se o usuário possui **todas** as permissões exigidas. Administradores (`admin`) têm acesso total.

---

## RBAC (Role-Based Access Control)

```mermaid
graph TB
    subgraph Users["Usuários"]
        U1["Usuário"]
    end

    subgraph Roles["Papéis"]
        R1["Admin"]
        R2["Visualizador"]
        R3["Atendente"]
    end

    subgraph Permissions["Permissões"]
        P1["dashboard.view"]
        P2["dashboard.analytics"]
        P3["users.view"]
        P4["users.create"]
        P5["schedule.view"]
        P6["schedule.create"]
        P7["financial.view"]
        P8["financial.create"]
    end

    subgraph Resources["Recursos"]
        Res1["GET /dashboard/*"]
        Res2["POST /users"]
        Res3["GET /appointments"]
        Res4["POST /financial/accounts"]
    end

    U1 -->|possui| R1
    U1 -->|possui| R2
    R1 -->|contém| P1
    R1 -->|contém| P3
    R2 -->|contém| P1
    R2 -->|contém| P5
    P1 -->|acessa| Res1
    P3 -->|acessa| Res2
    P5 -->|acessa| Res3
```

---

## Fluxo de agendamento

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as Atendente
    participant B as Backend
    participant DB as Database

    A->>B: GET /schedule/business-hours
    B-->>A: Horários de funcionamento

    A->>B: GET /schedule/availability?date=...&professional=...
    B->>DB: Buscar agendamentos existentes
    B->>DB: Buscar bloqueios
    B-->>A: Slots disponíveis

    A->>B: POST /appointments
    B->>DB: Criar agendamento
    B->>DB: Registrar auditoria
    B->>DB: Criar notificação
    B-->>A: Appointment created

    Note over A,B: Ciclo de vida do status

    A->>B: POST /appointments/:id/cancel
    B->>DB: Atualizar status → CANCELED
    B-->>A: Appointment cancelled

    A->>B: POST /appointments/:id/reschedule
    B->>DB: Atualizar data/hora
    B-->>A: Appointment rescheduled

    A->>B: PATCH /appointments/:id/status
    B->>DB: Atualizar status (CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW)
    B-->>A: Status updated
```

### Ciclo de vida do agendamento

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED
    SCHEDULED --> CONFIRMED
    SCHEDULED --> CANCELED
    CONFIRMED --> IN_PROGRESS
    CONFIRMED --> CANCELED
    CONFIRMED --> NO_SHOW
    IN_PROGRESS --> COMPLETED
    COMPLETED --> [*]
    NO_SHOW --> [*]
    CANCELED --> [*]
```

---

## Fluxo financeiro

```mermaid
flowchart TD
    subgraph Entradas["Contas a Receber"]
        ER["Criar conta receivable"]
        ER --> ER_PAGO["Pagamento confirmado"]
        ER_PAGO --> ER_CAIXA["Transação de caixa ENTRY"]
        ER_CAIXA --> FECHAMENTO["Fechamento de caixa"]
    end

    subgraph Saidas["Contas a Pagar"]
        SP["Criar conta payable"]
        SP --> SP_PAGO["Pagamento realizado"]
        SP_PAGO --> SP_CAIXA["Transação de caixa EXIT"]
        SP_CAIXA --> FECHAMENTO
    end

    subgraph Vendas["Vendas (Appointment)"]
        VENDA["Agendamento CONCLUÍDO"]
        VENDA --> OS["Ordem de Serviço"]
        OS --> PAGAMENTO["Pagamento (dinheiro, cartão, PIX)"]
        PAGAMENTO --> VENDA_CAIXA["Transação de caixa ENTRY"]
        VENDA_CAIXA --> FECHAMENTO
    end

    subgraph Relatorios["Relatórios"]
        FECHAMENTO --> FLUXO["Fluxo de Caixa"]
        FECHAMENTO --> DRE["Dashboard Financeiro"]
        FECHAMENTO --> EXTRATO["Extrato por período"]
    end
```

---

## Notificações

O módulo de notificações segue o padrão **Observer**: serviços disparam eventos e o módulo persiste as notificações no banco.

**Tipos de notificação:**
- `APPOINTMENT_REMINDER` — Lembrete de agendamento
- `APPOINTMENT_CANCELLED` — Cancelamento
- `FINANCIAL_OVERDUE` — Conta vencida
- `STOCK_LOW` — Estoque baixo
- `SYSTEM_ALERT` — Alerta do sistema

---

## Auditoria

O módulo de auditoria registra **todas as operações** de escrita (CREATE, UPDATE, DELETE, LOGIN, LOGOUT) em uma tabela separada (`audit_logs`).

**Dados registrados:**
- Usuário que executou a ação
- Tipo de ação
- Entidade afetada
- ID da entidade
- Dados anteriores e novos (JSON)
- Timestamp

---

## Cache

O `CacheService` é um cache **in-memory** baseado em `Map` do JavaScript, com TTL configurável via `CACHE_TTL` (default: 300s).

**Estratégias de invalidação:**
- **Leitura:** `getOrSet(key, fn)` — busca do cache ou executa a função
- **Escrita:** `del(key)` / `delByPrefix(prefix)` — invalida entradas específicas ou por prefixo
- **Reset:** `reset()` — limpa todo o cache

**Módulos com cache:**
- Dashboard (summary, financial, operations)
- Unit (findAllSimple, findOne)
- CompanySettings (findOne)
- Service (findAll, findOne)
- Category (findAll, findOne)
