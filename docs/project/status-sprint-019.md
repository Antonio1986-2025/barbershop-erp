# Project Status — Sprint 019

## Resumo das Sprints

| Sprint | Módulo | Status |
|---|---|---|
| 001–009 | Base da plataforma (auth, RBAC, empresas, unidades, usuários, clientes, profissionais, serviços, agenda) | ✅ |
| 010 | Estoque — modelagem + categorias + produtos | ✅ |
| 011 | Estoque — compras + fornecedores | ✅ |
| 012 | Estoque — movimentações + custo médio | ✅ |
| 013 | Estoque — transferências | ✅ |
| 014 | Estoque — inventário | ✅ |
| 015 | Estoque — relatórios (kardex, giro, valuation) | ✅ |
| 016 | Estoque — alertas automáticos | ✅ |
| 017 | Estoque — dashboard executivo | ✅ |
| 018 | PDV — vendas, pagamentos, caixa, cupons, cashback, fidelidade, dashboard | ✅ |
| 019 | CRM — perfil 360°, segmentação, campanhas, interações, tarefas, automações, dashboard | ✅ |

---

## Módulos Existentes

```
backend/src/modules/
├── appointment/     # Agenda
├── audit/           # Auditoria (global)
├── auth/            # Autenticação JWT + RBAC
├── automation/      # Automações (eventos + schedulers)
├── cache/           # Cache
├── campaign/        # Campanhas CRM
├── cash/            # Caixa PDV
├── cashback/        # Cashback
├── category/        # Categorias de produto
├── company/         # Empresas (multitenancy)
├── company-settings/# Configurações
├── coupon/          # Cupons
├── crm/             # CRM (perfil + segmentos + dashboard)
├── customer/        # Clientes
├── dashboard/       # Dashboard geral
├── financial/       # Financeiro (contas, caixa, fechamento)
├── interaction/     # Interações CRM
├── loyalty/         # Fidelidade
├── notifications/   # Notificações (global)
├── observability/   # Observabilidade
├── prisma/          # PrismaService
├── product/         # Produtos
├── professional/    # Profissionais
├── role/            # Papéis e permissões
├── sale/            # PDV (vendas + pagamentos + dashboard)
├── schedule/        # Bloqueios de agenda
├── service/         # Serviços
├── stock/           # Estoque (compras, mov., transferências, inventário, relatórios, alertas, dashboard)
├── task/            # Tarefas CRM
├── unit/            # Unidades
└── user/            # Usuários
```

---

## Banco de Dados

**ORM:** Prisma 7.9.0
**Banco:** PostgreSQL
**Total de tabelas:** 62

### Lista de modelos (por domínio)

**Core (7):**
- Plan, PlanPrice, Feature, PlanFeature, Subscription, Company, CompanySettings

**Identidade (5):**
- User, RefreshToken, Role, Permission, UserRole, RolePermission

**Unidades (3):**
- Unit, BusinessHour, ScheduleBlock

**Clientes (1):**
- Customer

**Agenda (3):**
- Appointment, ServiceOrder, ServiceOrderItem

**Profissionais (2):**
- Professional, ProfessionalUnit

**Serviços (1):**
- Service

**Produtos (2):**
- Category, Product

**Estoque (6):**
- Stock, StockMovement, Supplier, Purchase, PurchaseItem, Transfer

**Inventário (2):**
- InventoryCount, InventoryItem

**Financeiro (4):**
- FinancialCategory, FinancialAccount, CashRegister, CashTransaction, CashClosing

**PDV (3):**
- Sale, SaleItem, Payment

**Notificações (1):**
- Notification

**Auditoria (1):**
- AuditLog

**CRM (8):**
- CustomerSegment, CustomerTag, CustomerTagAssignment, Campaign, CampaignRecipient, CustomerInteraction, CustomerTask

**Fidelização (3):**
- Coupon, CashbackTransaction, LoyaltyProgram, LoyaltyPoints

**Automação (1):**
- AutomationExecution

---

## Testes Automatizados

**Total: 381 testes**

| Suite | Testes |
|---|---|
| Stock — unit | 99 |
| Stock — e2e | 185 |
| Sale — unit | 36 |
| Cash — unit | 13 |
| Coupon/Cashback/Loyalty — unit | 10 |
| Campaign — unit | 10 |
| Interaction — unit | 3 |
| Task — unit | 5 |
| CRM — unit | 10 |
| Outros módulos | 10 |
| **Total** | **381** |

**Framework:** Jest
**Cobertura:** Serviços (unit), Fluxos completos (e2e)

---

## Fluxos Principais

### Compra → Estoque

```
Purchase (CONFIRMED)
    │
    ├── StockMovementService.recordMovement(PURCHASE)
    │       ├── Stock.upsert (quantidade + custo médio)
    │       ├── StockAlert.checkAfterMovement
    │       └── AuditService.create
    │
    └── Notificação
```

### Estoque → PDV (venda)

```
Sale (PAID)
    │
    ├── StockMovementService.recordMovement(SALE)
    │       ├── Stock.upsert (decremento)
    │       ├── StockAlert.checkAfterMovement
    │       └── AuditService.create
    │
    ├── FinancialService.createAccount (RECEIVABLE)
    ├── CashTransaction (ENTRY) — se pagamento em dinheiro
    │
    ├── CashbackService.generate (5% do total)
    ├── LoyaltyService.earn (pontos)
    ├── AutomationService.onSalePaid (follow-up)
    │
    └── Notificação (SALE_COMPLETED)
```

### PDV → Financeiro

```
Payment (PAID)
    │
    ├── Sale.status → PAID (se quitado)
    ├── FinancialAccount.create (RECEIVABLE)
    └── CashTransaction.create (ENTRY) — apenas CASH

Sale (CANCELLED / REFUNDED)
    │
    ├── StockMovementService.recordMovement(RETURN)
    ├── FinancialService.cancelAccount
    ├── CashTransaction.create (EXIT) — reversão
    ├── CashbackService.cancelBySale
    ├── LoyaltyService.cancelBySale
    └── Notificação
```

### Cliente → CRM

```
Customer
    │
    ├── CustomerProfile (computado)
    │       ├── totalSpent, averageTicket, LTV
    │       ├── frequência, recência
    │       ├── customerScore (0–100)
    │       └── relationshipStatus
    │
    ├── CustomerSegment (regras JSON)
    │       └── recalculável a qualquer momento
    │
    ├── CustomerInteraction (histórico)
    ├── CustomerTask (tarefas)
    └── Campaign + CampaignRecipient
```

### Evento → Automação

```
Evento (ex: SalePaid)
    │
    └── AutomationService.execute()
            │
            ├── Registra AutomationExecution (SUCCESS/FAILED)
            ├── Cria tarefa (follow-up)
            ├── Cria notificação
            └── Auditoria

Eventos temporais (@Cron)
    │
    ├── CustomerBirthday → notificação
    ├── CustomerInactive → tarefa para admin
    ├── TaskOverdue → notificação ao responsável
    └── CouponExpiring → notificação
```

---

## Arquitetura Cross-Cutting

### Serviços globais (injetáveis sem import)
- `PrismaService` — acesso ao banco
- `AuditService` — auditoria por ação
- `NotificationsService` — notificações internas

### Padrão de módulo
```
Module
├── Controller  (rotas + guards)
├── Service     (lógica + prisma + auditoria)
├── DTOs        (validação class-validator)
└── Module      (registro + imports)
```

### Separação por domínio
- Cada módulo tem seu próprio service e controller
- Integrações entre módulos via injeção de dependência
- Nenhum módulo acessa o Prisma de outro módulo diretamente — sempre via service

### Integrações via serviço (não via Prisma direto)
- `SalePaymentService` → `StockMovementService.recordMovement`
- `SalePaymentService` → `FinancialService.createAccount`
- `SalePaymentService` → `CashbackService.generate`
- `SalePaymentService` → `AutomationService.onSalePaid`
- `SaleService.cancel` → `StockMovementService.recordMovement` (RETURN)
- `SaleService.cancel` → `FinancialService.cancelAccount`

---

## Próximos Passos

### Sprint 020 — Integrações
- Evolution API (WhatsApp)
- Envio real de e-mail
- Webhooks
- Fila distribuída (BullMQ / RabbitMQ)

### Futuro
- BI e relatórios avançados
- IA / recomendações
- Multitenancy avançado
- Onboarding SaaS
- Marketplace de integrações

---

## Estatísticas Rápidas

| Item | Valor |
|---|---|
| Sprints concluídas | 19 |
| Módulos | 30+ |
| Tabelas | 45 |
| Testes | 361 |
| Migrações | 15 |
| Serviços globais | 3 (Prisma, Audit, Notifications) |
| Eventos de domínio | 45 (catalogados) |
| Automações | 7 regras ativas |
