# Arquitetura — ServiceOrder

## 1. Diagrama de Entidades e Relacionamentos

```
 ┌──────────────────┐          ┌───────────────────┐
 │   Appointment    │    1     │   ServiceOrder    │
 │                  │◄────────►│                   │
 │ id               │   0..1   │ id                │
 │ unitId           │          │ appointmentId @unique
 │ customerId       │          │ unitId            │
 │ professionalId   │          │ customerId        │
 │ serviceId        │          │ professionalId    │
 │ startAt / endAt  │          │                   │
 │ status           │          │ status (OPEN/     │
 └──────────────────┘          │   IN_PROGRESS/    │
                               │   COMPLETED/      │
                               │   CANCELED)       │
                               │                   │
                               │ subtotal          │
                               │ discount          │
                               │ total             │
                               │                   │
                               │ createdBy         │
                               └────────┬──────────┘
                                        │ 1
                                        │
                               ┌────────▼──────────┐
                               │ ServiceOrderItem  │
                               │                   │
                               │ serviceId   (FK)  │
                               │ productId   (FK) ✅
                               │                   │
                               │ quantity          │
                               │ unitPrice         │
                               │ discountAmount ✅
                               │ totalPrice        │
                               │                   │
                               │ productName   ✅  │
                               │ serviceName   ✅  │
                               └────────────────────┘
                                        │
                                        │ 1
                                        │
                               ┌────────▼──────────┐
                               │       Sale        │
                               │                   │
                               │ id                │
                               │ serviceOrderId ✅ │
                               │ unitId            │
                               │ customerId        │
                               │                   │
                               │ status (DRAFT/    │
                               │   OPEN/PAID/      │
                               │   CANCELED/       │
                               │   REFUNDED)       │
                               │                   │
                               │ subtotal          │
                               │ discountAmount    │
                               │ couponId      ✅ │
                               │ total             │
                               └────────┬──────────┘
                                        │ 1
                                        │
                               ┌────────▼──────────┐
                               │     Payment       │
                               │                   │
                               │ serviceOrderId (?)│
                               │ saleId       (?)  │
                               │ amount            │
                               │ paymentMethod     │
                               │ status            │
                               └────────────────────┘
```

## 2. Cardinalidades

| Relação | Origem → Destino | Cardinalidade | Implementado |
|---|---|---|---|
| Appointment → ServiceOrder | `Appointment.serviceOrder` | 1 → 0..1 | ✅ |
| ServiceOrder → Appointment | `ServiceOrder.appointmentId` | 0..1 → 1 | ✅ |
| ServiceOrder → ServiceOrderItem | `ServiceOrder.items` | 1 → * | ✅ |
| ServiceOrder → Sale | `Sale.serviceOrderId` | 1 → 0..1 | ✅ RN002 |
| ServiceOrder → Payment | `Payment.serviceOrderId` | 1 → * | ✅ (existente) |
| Sale → Payment | `Payment.saleId` | 1 → * | ✅ (existente) |
| Sale → Coupon | `Sale.couponId` | * → 0..1 | ✅ |

## 3. Regras de Domínio

### RN001 ✅ — Uma Appointment → no máximo uma ServiceOrder
Validação no `create()`: busca `appointmentId` duplicado antes de criar. Constraint `@unique` no banco.

### RN002 ✅ — Uma ServiceOrder → no máximo uma Sale
Validação no `generateSale()`: verifica `order.sale` existente. Constraint `@unique` em `Sale.serviceOrderId`.

### RN003 ✅ — Sale vinculada bloqueia edição da ServiceOrder
`update()` rejeita com 400 se `order.sale` existir.

### RN004 ✅ — Separação de responsabilidades
OS = documento operacional (itens, descontos). Sale = documento comercial (financeiro).

### RN005 ✅ — Snapshot de valores OS → Sale
`generateSale()` copia valores para Sale como snapshot independente.

### RN006 ✅ — Rastreabilidade bidirecional
Appointment ⇄ ServiceOrder ⇄ Sale ⇄ Payment. Relações nos dois sentidos.

## 4. Endpoints

| Método | Rota | Status |
|---|---|---|
| `GET` | `/api/service-orders` | ✅ Listar com filtros |
| `GET` | `/api/service-orders/:id` | ✅ Detalhes com includes |
| `POST` | `/api/service-orders` | ✅ Criar OS (serviço ou produto) |
| `PATCH` | `/api/service-orders/:id` | ✅ Editar (bloqueado se tiver Sale) |
| `POST` | `/api/service-orders/:id/generate-sale` | ✅ Gerar venda (snapshot) |
| `POST` | `/api/service-orders/:id/cancel` | ✅ Cancelar OS |
| `DELETE` | `/api/service-orders/:id` | ✅ Excluir (soft delete via cancel) |

## 5. Testes

| # | Teste | Resultado |
|---|---|---|
| 1 | Criar OS com serviço | ✅ |
| 2 | Gerar venda a partir da OS | ✅ |
| 3 | RN002 — Bloquear segunda venda | ✅ |
| 4 | RN003 — Bloquear edição pós-venda | ✅ |
| 5 | RN006 — Rastreabilidade OS → Items + Sale | ✅ |
| 6 | Sale → OS bidirecional | ✅ |
| 7 | RN001 — OS duplicada para appointment | ✅ (lógica) / ⚠️ (teste dependente de Appointment) |
| 8 | Cancelar OS | ✅ |
| 9 | Listar OS | ✅ |

**8/9 testes passaram. 1 pendente depende de correção no módulo Appointment (pré-existente).**

## 6. Arquivos Criados/Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Modificado | +7 campos em ServiceOrderItem, ServiceOrder, Sale, Coupon |
| `backend/src/modules/service-order/` | Criado | Módulo completo (controller, service, module, DTOs) |
| `backend/src/app.module.ts` | Modificado | +ServiceOrderModule import |
| `backend/src/modules/dashboard/dashboard.service.ts` | Modificado | Adaptado para serviceId nullable |
| `docs/project/service-order-architecture.md` | Criado | Este documento |
| `docs/project/review-agendamento.md` | Modificado | +Seção Validação Arquitetural |
