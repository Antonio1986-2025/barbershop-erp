# Mapa de Dependências — Barbershop ERP

**Versão:** 1.0.2  
**Data:** 26/07/2026

---

## Legenda

```
A → B  : A depende de B (A precisa de B para funcionar)
A ⇄ B  : Dependência bidirecional
A ─ B  : Sem dependência direta
```

---

## Módulos Core

```
Todas as operações
         │
         ▼
     Company  ←  Subscription  ←  Plan
         │
         ├──→  Unit
         ├──→  User  →  Role  →  Permission
         └──→  CompanySettings
```

---

## Fluxo Operacional Principal

```
                    ┌─────────────────┐
                    │    Customer     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────────┐
              │              │                   │
              ▼              ▼                   ▼
       ┌──────────┐   ┌───────────┐     ┌──────────────┐
       │     Appointment    │   │  Professional  │     │  Service   │
       │  (Agendamento)     │   │  (Profissional)│     │ (Serviço)  │
       └──────────┬─────────┘   └──────┬────────┘     └──────┬───────┘
                  │                    │                      │
                  └────────────────────┼──────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  ServiceOrder  │
                              │   (Comanda)    │  ← Product, Service
                              └────────┬───────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │     Sale       │
                              │   (Venda)      │  ← Coupon (desconto)
                              └────────┬───────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │   Payment      │
                              │  (Pagamento)   │
                              └────────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
                    ▼                  ▼                   ▼
             ┌──────────┐      ┌────────────┐      ┌──────────────┐
             │  Cash    │      │ Financial  │      │  Cashback    │
             │  (Caixa) │      │(Financeiro)│      │  Transaction │
             └──────────┘      └────────────┘      └──────┬───────┘
                                                          │
                                                          ▼
                                                  ┌──────────────┐
                                                  │   Loyalty    │
                                                  │ (Fidelidade) │
                                                  └──────────────┘
```

---

## Estoque

```
Purchase (Compra) ──→ StockMovement (Movimento) ──→ Stock (Saldo)
       │                      │
       │                      ├──→ Kardex
       │                      ├──→ Valuation
       │                      └──→ StockAlert
       │
       └──→ Supplier (Fornecedor)

Transfer (Transferência)
       │
       └──→ StockMovement ←── Inventory (Inventário)

Product (Produto) ──→ Stock
```

---

## CRM

```
Customer (Cliente)
   │
   ├──→ CustomerInteraction (Interação)
   │       │
   │       └──→ InteractionType (CALL, WHATSAPP, VISIT, NOTE, SYSTEM)
   │
   ├──→ CustomerSegment (Segmento)
   │
   ├──→ Task (Tarefa automática)
   │       │
   │       └──→ Automation (Regra de automação)
   │
   ├──→ CashbackTransaction (Cashback: 5% das vendas)
   │
   └──→ LoyaltyPoints (Fidelidade: pontos por valor gasto)
```

---

## Módulo BARBER (v1.1)

```
User (role=barber)
   │
   └──→ Professional (1:1)
           │
           ├──→ Appointment (filtrado por professionalId)
           │
           ├──→ ServiceOrder (filtrado por professionalId)
           │       │
           │       └──→ Sale (via serviceOrderId)
           │
           ├──→ Commission (NOVO - v1.1)
           │
           └──→ BarberDashboard (dashboard do barbeiro)
```

---

## Autenticação e Auditoria

```
Login
  │
  ├──→ JWT (accessToken + refreshToken)
  │       │
  │       ├──→ JwtAuthGuard (proteção básica)
  │       ├──→ RolesGuard (verifica role: admin, operator, barber, viewer)
  │       └──→ PermissionsGuard (verifica permissão específica)
  │
  └──→ AuditLog (toda ação registrada)
          │
          ├──→ user, action, entity, entityId
          └──→ companyId, createdAt
```

---

## Notificações e Integrações

```
Evento (qualquer módulo)
   │
   └──→ Notification (notificação push)
   │       │
   │       └──→ WebSocket (tempo real)
   │
   └──→ Integrations (gateways externos)
           │
           ├──→ Payment Gateway
           └──→ Calendar Sync
```

---

## Matriz de Dependências Cruzadas

| Módulo | Depende de | Usado por |
|--------|------------|-----------|
| Company | Subscription, Plan | Todos os módulos |
| Unit | Company | Appointment, Sale, Stock, Cash |
| User | Company, Role | Todos os módulos |
| Role | — | User, Permissions |
| Permission | — | Role |
| Customer | Company | Appointment, ServiceOrder, Sale, CRM |
| Professional | Company, Unit | Appointment, ServiceOrder |
| Service | Company, Category | Appointment, ServiceOrder |
| Product | Company, Category | ServiceOrder, Sale, Stock |
| Appointment | Company, Unit, Customer, Professional, Service | ServiceOrder, Automation |
| ServiceOrder | Company, Unit, Customer, Professional, Service, Product | Sale |
| Sale | Company, Unit, Customer, ServiceOrder | Payment, Cashback, Loyalty |
| Payment | Company, Unit, Sale, ServiceOrder | Cash, Financial |
| Cash | Company, Unit, Payment | Financial |
| Financial | Company, Unit | — |
| Stock | Company, Product | — |
| CRM | Company, Customer | — |
| Automation | Company | Task |
| Task | Company, Customer | CRM |
| Barber | User, Professional | Appointment, ServiceOrder, Sale |
| Audit | Company, User | Todos os módulos |
| Notification | Company, User | Todos os módulos |

---

## Notas

1. **Company é o módulo raiz** — todo registro pertence a uma empresa
2. **Flow unidirecional:** Customer → Appointment → ServiceOrder → Sale → Payment → Cash/Financial
3. **CRM é transversal:** interage com Customer, Sale e Automation sem depender do fluxo principal
4. **Estoque é independente:** depende apenas de Company e Product
5. **BARBER é um wrapper:** não substitui Appointment/Sale, apenas filtra pelo profissional logado
6. **Pagamento fecha o ciclo financeiro:** Venda → Pagamento → Caixa → Financeiro

---

*Documento gerado em 26/07/2026 — Mapa de Dependências v1.0.2*
