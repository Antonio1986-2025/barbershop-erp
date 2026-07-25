# System Flows — Barbershop ERP

> **Data:** 2026-07-25
> **Versão:** 1.0
> **Propósito:** Mapear os principais fluxos ponta a ponta para garantir que o processo inteiro funcione sem interrupções. Objetivo da v1.0: "O básico funcionando 100%."

---

## Fluxo 1 — Cliente Novo

### Módulos
Customer → Phone → CRM

### Controllers
- `CustomerController` (`/api/customers`)
- `PhoneService` (integrante do CustomerModule)

### Services
- `CustomerService` — create, findByPhone, findAll
- `PhoneService` — normalizePhone (E.164)

### Models
- `Customer` — id, name, phone, phoneNormalized, email, birthDate, notes, tags
- `CustomerTag` — id, name, color
- `CustomerTagAssignment` — customerId, tagId

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Usuário digita telefone | Buscar por telefone para evitar duplicidade | `POST /api/customers` com phone → PhoneService.normalizePhone() → busca por `phoneNormalized` | ✅ OK |
| 2 | Cliente não encontrado | Criar cadastro rápido (nome + telefone) | `create()` cria Customer com name, phone, phoneNormalized | ✅ OK |
| 3 | Cliente encontrado | Retornar dados existentes | `findByPhone()` retorna cliente existente | ✅ OK |
| 4 | Cadastro completo (M2) | Adicionar CPF, data nascimento, endereço | `PATCH /api/customers/:id` atualiza campos opcionais | ✅ OK |
| 5 | Tags atribuídas | Vínculo com tags para segmentação | CustomerTagAssignment gerencia tags | ✅ OK |
| 6 | Perfil CRM gerado | Consultar vendas, agendamentos, cashback, fidelidade | `GET /api/crm/profile/:customerId` → CrmService.getProfile() | ✅ OK |

### Bugs / Gaps
Nenhum. Fluxo completo e funcional.

---

## Fluxo 2 — Agendamento

### Módulos
Customer → Appointment → Notifications → Calendar (Integrations)

### Controllers
- `AppointmentController` (`/api/appointments`)
- `CustomerController` (para buscar cliente)
- `ProfessionalController` (para buscar profissional)
- `ServiceController` (para buscar serviço)

### Services
- `AppointmentService` — create, updateStatus, cancel, reschedule, findByDateRange
- `PhoneService` — busca cliente por telefone
- `NotificationsService` — notificações de criação/confirmação/cancelamento
- `IntegrationsService` — syncCalendarEvent

### Models
- `Appointment` — id, companyId, unitId, customerId, professionalId, serviceId, startAt, endAt, status (SCHEDULED/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELED), notes
- `Service` — id, name, durationMinutes, price
- `Professional` — id, name
- `Unit` — id, name

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Busca disponibilidade | `GET /api/schedule/availability` → retorna slots livres | ✅ | ✅ OK |
| 2 | Cria agendamento | `POST /api/appointments` com unitId, professionalId, serviceId, startAt, newCustomerName/phone OU customerId | Cria Appointment com status SCHEDULED, calcula endAt baseado na duração do serviço. Cria cliente se newCustomerName informado. Dispara notificação | ✅ OK |
| 3 | Confirma agendamento | `PATCH /api/appointments/:id/status` → CONFIRMED | Notifica cliente. Valida se não está CANCELED/COMPLETED | ✅ OK |
| 4 | Inicia atendimento | `PATCH /api/appointments/:id/status` → IN_PROGRESS | Apenas muda status | ✅ OK |
| 5 | Conclui atendimento | `PATCH /api/appointments/:id/status` → COMPLETED | Muda status. **NÃO cria ServiceOrder ou Sale automaticamente** (revertido) | ✅ OK |
| 6 | Cancela agendamento | `PATCH /api/appointments/:id/cancel` | Valida regras, notifica. Salva motivo | ✅ OK |
| 7 | Remarca agendamento | `PATCH /api/appointments/:id/reschedule` | Altera startAt, recalcula endAt | ✅ OK |

### Bugs / Gaps
1. **Gap:** Ao concluir (COMPLETED), NÃO cria ServiceOrder automaticamente (revertido conforme política). O operador precisa criar manualmente.
2. **Gap:** Integração com Google Calendar existe no código mas depende de configuração manual (Integration.active = true).

---

## Fluxo 3 — Atendimento (Agendamento → ServiceOrder)

### Módulos
Appointment → ServiceOrder → Customer → Professional

### Controllers
- `ServiceOrderController` (`/api/service-orders`)
- `AppointmentController`

### Services
- `ServiceOrderService` — create, update, findOne, findAll, generateSale
- `AppointmentService` — findOne

### Models
- `ServiceOrder` — id, companyId, unitId, customerId, professionalId, appointmentId (opcional), status (OPEN/IN_PROGRESS/COMPLETED/CANCELED), subtotal, discountAmount, total, notes
- `ServiceOrderItem` — id, serviceOrderId, serviceId?, productId?, serviceName, productName, quantity, unitPrice, discountAmount, totalPrice

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Operador cria ServiceOrder manualmente | `POST /api/service-orders` com customerId, professionalId, items[{serviceId, quantity, unitPrice}] | Cria SO com status OPEN. RN001: valida que não existe SO duplicada para o mesmo appointmentId | ✅ OK |
| 2 | Adiciona itens de serviço | items[{serviceId, quantity, unitPrice}] | `buildItemsData()` busca preço atual do serviço, calcula totalPrice | ✅ OK |
| 3 | Adiciona itens de produto | items[{productId, quantity, unitPrice}] | `buildItemsData()` busca preço atual do produto | ✅ OK |
| 4 | Aplica desconto geral | `update()` com discountAmount | Desconto é calculado sobre o subtotal | ✅ OK |
| 5 | Finaliza SO | `update()` → COMPLETED | Apenas muda status | ✅ OK |

### Bugs / Gaps
Nenhum. Fluxo manual completo e funcional.

---

## Fluxo 4 — Comanda (ServiceOrder completo)

### Módulos
ServiceOrder → Sale (quando gera venda)

### Controllers
- `ServiceOrderController`

### Services
- `ServiceOrderService`
- `SaleService` (via generateSale)

### Models
- `ServiceOrder`, `ServiceOrderItem`

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Adicionar serviço na comanda | Item com serviceId, quantity, unitPrice | Cria ServiceOrderItem com serviceId, serviceName, unitPrice = preço do serviço | ✅ OK |
| 2 | Adicionar produto na comanda | Item com productId, quantity, unitPrice | Cria ServiceOrderItem com productId, productName, unitPrice = preço do produto | ✅ OK |
| 3 | Aplicar desconto por item | discountAmount no item | Cada item pode ter discountAmount próprio. Desconto geral é descontado do total | ✅ OK |
| 4 | Aplicar cupom | CouponId na Sale (quando gerar venda) | Coupon module existe mas NÃO está integrado no fluxo de ServiceOrder → Sale | ⚠️ PARCIAL |
| 5 | Gerar venda a partir da comanda | `POST /api/service-orders/:id/generate-sale` | Cria Sale com os itens da SO, fecha SO (COMPLETED). RN003: valida que SO não pode ser editada após gerar venda | ✅ OK |

### Bugs / Gaps
1. **Cupom não integrado** — O módulo Coupon existe mas não está linkado no fluxo de ServiceOrder → generateSale. `generateSale()` cria Sale sem considerar couponId.

---

## Fluxo 5 — Venda (ServiceOrder → Sale)

### Módulos
ServiceOrder → Sale

### Controllers
- `SaleController` (`/api/sales`)
- `SaleDashboardController`
- `ServiceOrderController` (generateSale)

### Services
- `SaleService` — create, findAll, findOne, update, cancel, refund
- `ServiceOrderService` — generateSale

### Models
- `Sale` — id, unitId, customerId, serviceOrderId (único), status (DRAFT/OPEN/PAID/CANCELED/REFUNDED), subtotal, discountAmount, total
- `SaleItem` — id, saleId, serviceId?, productId?, serviceName, productName, quantity, unitPrice

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Criar venda manual | `POST /api/sales` com items + customerId | Cria Sale DRAFT/OPEN | ✅ OK |
| 2 | Criar venda da comanda | `POST /api/service-orders/:id/generate-sale` | Cria Sale, copia itens da SO, atualiza SO para COMPLETED | ✅ OK |
| 3 | Adicionar itens na venda | `POST /api/sales/:id/items` | Adiciona SaleItem na venda | ✅ OK |
| 4 | Aplicar desconto na venda | `PATCH /api/sales/:id` com discountAmount | Atualiza Sale.discountAmount, recalcula total | ✅ OK |
| 5 | Aplicar cupom | couponId na venda | Coupon module existe. Falta integração no fluxo de criação de venda | ⚠️ PARCIAL |
| 6 | Cancelar venda | `POST /api/sales/:id/cancel` | Valida status, cancela, estorna fidelidade | ✅ OK |

### Bugs / Gaps
1. **Cupom não integrado ao fluxo de Sale.** O módulo Coupon existe e tem CRUD completo (coupon.controller.ts, coupon.service.ts), mas `SaleService.create()` não processa couponId.

---

## Fluxo 6 — Pagamento (Sale → Payment)

### Módulos
Sale → Payment → CashRegister (se CASH) → Financial → Stock → Notifications

### Controllers
- `PaymentController` (`/api/sales/:saleId/payments`)
- `SalePaymentService`

### Services
- `SalePaymentService` — create, cancel, refund
- `StockMovementService` — recordMovement (se willComplete)
- `FinancialService` — createAccount (RECEIVABLE)
- `CashbackService` — generate
- `LoyaltyService` — earn
- `AutomationService` — onSalePaid
- `NotificationsService`

### Models
- `Payment` — id, saleId, amount, paymentMethod (CASH/CREDIT_CARD/PIX/etc), status (PAID/CANCELED/REFUNDED)
- `CashRegister` — validação se método CASH
- `CashTransaction` — criada se willComplete + método CASH

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Receber pagamento | `POST /api/sales/:saleId/payments` com amount, paymentMethod | Valida sale status, calcula saldo restante, valida se excede | ✅ OK |
| 2 | Pagamento em dinheiro | method = CASH | Verifica se existe CashRegister OPEN na unidade. Se não, bloqueia | ✅ OK |
| 3 | Pagamento parcial | amount < remaining | Cria Payment PAID. **NÃO cria CashTransaction** (só quando willComplete) | ⚠️ PARCIAL |
| 4 | Pagamento completo | amount >= remaining (willComplete) | Cria Payment PAID + CashTransaction (se CASH) + FinancialAccount + baixa estoque + cashback + fidelidade + automação + notificação + Sale → PAID | ✅ OK |
| 5 | Cancelar pagamento | `POST /api/sales/payments/:id/cancel` | Muda Payment → CANCELED, recalcula Sale status | ✅ OK |

### Bugs / Gaps
1. **ALTO: Pagamento parcial CASH não gera CashTransaction.** Se o cliente paga R$ 50 de R$ 150 em dinheiro, o valor some do caixa. Só aparece quando o pagamento completa a venda.
2. **MÉDIO: Sem validação de troco.** Se pagamento em dinheiro > saldo devedor, o sistema aceita (não calcula troco automaticamente).

---

## Fluxo 7 — Caixa (Payment → CashRegister)

### Módulos
Cash → Sale/Payment → Financial

### Controllers
- `CashController` (`/api/cash`)
- `SalePaymentService` (integração via createFinancialRecords)

### Services
- `CashService` — current, open, close, reopen, supply, withdraw, summary, history
- `FinancialService` — createCashClosing

### Models
- `CashRegister` — id, unitId, status (OPEN/CLOSED), openingAmount, closingAmount
- `CashTransaction` — id, cashRegisterId, paymentId?, type (ENTRY/EXIT), amount, description
- `CashClosing` — id, expectedAmount, closingAmount, difference

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Abrir caixa | `POST /api/cash/open` com unitId, openingAmount | Valida duplicidade. Cria CashRegister OPEN + CashTransaction ENTRY se openingAmount > 0 | ✅ OK |
| 2 | Suprimento | `POST /api/cash/:id/supply` com amount, description | Cria CashTransaction ENTRY | ✅ OK |
| 3 | Sangria | `POST /api/cash/:id/withdraw` com amount, description | Cria CashTransaction EXIT | ✅ OK |
| 4 | Pagamento CASH completo | via SalePaymentService | Cria CashTransaction ENTRY com paymentId vinculado | ✅ OK |
| 5 | Pagamento CASH parcial | via SalePaymentService | **NÃO cria CashTransaction** (willComplete = false → createFinancialRecords não executa) | ⚠️ PARCIAL |
| 6 | Fechar caixa | `POST /api/cash/:id/close` com closingAmount, expectedAmount | Calcula diferença. Cria CashClosing. CashRegister → CLOSED | ✅ OK |
| 7 | Reabrir caixa | `POST /api/cash/:id/reopen` | Valida duplicidade. CashRegister → OPEN | ✅ OK |
| 8 | Resumo | `GET /api/cash/:id/summary` | Retorna saldo, transações, último fechamento | ✅ OK |
| 9 | Histórico | `GET /api/cash/history` | Lista todos registros (abertos/fechados) | ✅ OK |

### Bugs / Gaps
1. **MÉDIO: `closingAmount` opcional.** CloseCashDto não exige o valor real. Fechamento sem valor real perde a conferência de diferença.
2. **BAIXO: `current()` sem unitId retorna qualquer caixa.** Se o frontend não enviar unitId, o Prisma ignora o filtro.
3. **MÉDIO: <h1 quebrado na página Caixa** — título não renderiza como heading.

---

## Fluxo 8 — Estoque (Venda → Baixa de Estoque)

### Módulos
Sale → Stock

### Controllers
- `StockMovementController` (`/api/stock/movements`)
- `InventoryController` (`/api/stock/inventory`)
- `StockReportController`
- `StockAlertController`
- `PurchaseController` (`/api/stock/purchases`)
- `SupplierController` (`/api/stock/suppliers`)
- `TransferController` (`/api/stock/transfers`)

### Services
- `StockMovementService` — recordMovement (incrementa/decrementa saldo)
- `StockAlertService` — verifica mínimo
- `InventoryService` — inventário
- `PurchaseService` — compras

### Models
- `Stock` — companyId, unitId, productId, quantity, avgCost, minStock
- `StockMovement` — id, type (SALE/PURCHASE/etc), quantity, balanceBefore, balanceAfter
- `Product` — id, name, salePrice, costPrice, unit

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Pagamento completa venda | willComplete = true | `SalePaymentService.deductStock()` é chamado | ✅ OK |
| 2 | Deduz estoque | `StockMovementService.recordMovement({ type: SALE })` | Verifica saldo atual, registra movimento, atualiza saldo (upsert). Se saldo < 0 → erro | ✅ OK |
| 3 | Compra reposição | `POST /api/stock/purchases` | Cria Purchase + StockMovement PURCHASE + atualiza estoque (incrementa) + atualiza avgCost | ✅ OK |
| 4 | Estoque insuficiente | quantity > available | `recordMovement()` com `skipNegativeCheck: false` → BadRequestException + mensagem clara | ✅ OK |
| 5 | Alerta estoque mínimo | Após movimento | `StockAlertService` verifica se `quantity <= minStock` e cria alerta | ✅ OK |

### Bugs / Gaps
Nenhum. Fluxo completo e funcional.

---

## Fluxo 9 — Financeiro (Venda → Contas → Caixa)

### Módulos
Sale → Financial → Cash

### Controllers
- `FinancialController` (`/api/financial`)
- `CashController` (`/api/cash`)
- `SalePaymentService` (cria FinancialAccount)

### Services
- `FinancialService` — findAccounts, createAccount, payAccount, getCashFlow, createCashClosing
- `CashService` — operações de caixa

### Models
- `FinancialAccount` — id, categoryId, description, type (RECEIVABLE/PAYABLE), amount, status (OPEN/PAID/CANCELLED), dueDate, paidAt
- `FinancialCategory` — id, name, type (INCOME/EXPENSE)
- `CashRegister`, `CashTransaction`, `CashClosing`

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Venda concluída (PAID) | `SalePaymentService.createFinancialRecords()` | Cria FinancialAccount tipo RECEIVABLE, categoria "Vendas" (auto-criada se não existir), status PAID. Amount = sale.total | ✅ OK |
| 2 | Pagamento em dinheiro | `CASH_METHODS.includes()` | Cria CashTransaction ENTRY vinculada ao Payment + FinancialAccount | ✅ OK |
| 3 | Fluxo de caixa | `GET /api/financial/cash-flow` | Consulta FinancialAccount (income/expense) + CashTransaction (cash in/out) | ✅ OK |
| 4 | Fechamento de caixa | `CashService.close()` → `FinancialService.createCashClosing()` | Cria CashClosing com diferença, atualiza CashRegister | ✅ OK |
| 5 | Contas a pagar/receber | `GET /api/financial/accounts` | CRUD completo de FinancialAccount | ✅ OK |

### Bugs / Gaps
1. **MÉDIO:** `createFinancialRecords` é chamado APENAS em `willComplete` (pagamentos que completam a venda). Pagamentos parciais não geram FinancialAccount nem CashTransaction.

---

## Fluxo 10 — CRM (Venda → Cashback / Fidelidade / Score / Automações)

### Módulos
Sale → Cashback → Loyalty → Automation → Notifications → Task

### Controllers
- `CrmController` (`/api/crm`)
- `CashbackController` (`/api/cashback`)
- `LoyaltyController` (`/api/loyalty`)

### Services
- `CrmService` — getProfile, getSegments, computeCustomerSegments
- `CashbackService` — generate (5% do total), getBalance, history, use
- `LoyaltyService` — earn (1 ponto a cada R$ configurado), redeem, getBalance
- `AutomationService` — onSalePaid (cria task follow-up), onAppointmentCompleted (cria task lembrete), checkBirthdays (cron diário)
- `NotificationsService`
- `TaskService`

### Models
- `CashbackTransaction` — id, saleId, customerId, amount (5%), rate, status (AVAILABLE/USED/EXPIRED)
- `LoyaltyPoints` — id, customerId, saleId, points, type (EARNED/REDEEMED/CANCELLED)
- `LoyaltyProgram` — id, companyId, pointsPerAmount, minAmount, active
- `CustomerTask` — id, customerId, type, title, description, priority, dueDate
- `CustomerTag`, `CustomerTagAssignment`

### Etapas

| # | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|---------------|------------------------|-------------------------|--------|
| 1 | Venda concluída (PAID) | Cashback + Fidelidade + Automação | `SalePaymentService.create()` → `cashbackService.generate()` + `loyaltyService.earn()` + `automationService.onSalePaid()` | ✅ OK |
| 2 | Cashback gerado | 5% do total da venda | `CashbackService.generate()` → calcula amount = total * 0.05, cria CashbackTransaction AVAILABLE | ✅ OK |
| 3 | Pontos de fidelidade | 1 ponto a cada R$ configurado | `LoyaltyService.earn()` → points = floor(total / pointsPerAmount). Cria LoyaltyPoints EARNED | ✅ OK |
| 4 | Tarefa follow-up criada | 7 dias após venda | `AutomationService.onSalePaid()` → TaskService.create() com tipo FOLLOW_UP, dueDate +7 dias | ✅ OK |
| 5 | Score do cliente | Computado no perfil CRM | `CrmService.getProfile()` → calcula totalPurchases, totalSpent, averageTicket, lastVisit, customerSince. Segmentos automáticos (gold/silver/bronze, novo/recorrente/inativo) | ✅ OK |
| 6 | Perfil CRM | `GET /api/crm/profile/:customerId` | Retorna vendas, agendamentos, cashback, fidelidade, tags, segmentos | ✅ OK |
| 7 | Cashback utilizado | `POST /api/cashback/use` | Aplica cashback como desconto em venda. Atualiza status → USED | ✅ OK |
| 8 | Pontos resgatados | `POST /api/loyalty/redeem` | Cria LoyaltyPoints REDEEMED (negativo) | ✅ OK |
| 9 | Aniversariantes do dia | Cron diário 8h | `AutomationService.checkBirthdays()` → cria notificações | ✅ OK |
| 10 | Agendamento concluído | Tarefa lembrete retorno | `AutomationService.onAppointmentCompleted()` → TaskService.create() tipo REMINDER, dueDate +15 dias | ✅ OK |

### Bugs / Gaps
Nenhum. Fluxo completo e funcional. Todos os eventos são disparados automaticamente.

---

## Fluxo 11 — Integrações

### Módulos
Integrations → WhatsApp (Evolution) → Google Calendar → Mercado Pago / Stripe / Asaas

### Controllers
- `IntegrationsController` (no IntegrationsService)
- `WebhookController` (`/api/webhooks/:provider`)
- `PaymentProviderFactory`

### Services
- `IntegrationsService` — CRUD de integrações, syncCalendarEvent, sendMessage
- `EvolutionProvider` — WhatsApp Business API via Evolution API
- `GoogleProvider` — Google Calendar API
- `MercadoPagoProvider` — Pagamentos via Mercado Pago
- `StripeProvider` — Pagamentos via Stripe
- `AsaasProvider` — Pagamentos via Asaas
- `PaymentProviderFactory` — seleciona provider baseado no tipo

### Models
- `Integration` — id, companyId, type (whatsapp/google_calendar/mercadopago/stripe/asaas), provider, name, active, credentials (JSON), webhookSecret
- `IntegrationLog` — id, integrationId, event, status, request, response

### Etapas

| # | Integração | O que acontece | O que deveria acontecer | O que realmente acontece | Status |
|---|-----------|---------------|------------------------|-------------------------|--------|
| 1 | WhatsApp | Notificações de agendamento | `NotificationsService.createFromAppointment()` → EvolutionProvider.sendMessage() | 🟡 Provider existe, depende de configuração (Integration.active) | ⚠️ PARCIAL |
| 2 | Google Calendar | Sincronizar agendamentos | `AppointmentService.create()` → `syncCalendarEvent()` | 🟡 Código existe mas comentado/não executado (visto no diff anterior) | ⚠️ PARCIAL |
| 3 | Mercado Pago | Processar pagamentos online | `PaymentProviderFactory.getProvider('mercadopago')` → MercadoPagoProvider.createPayment() | 🟡 Provider existe, depende de configuração (Integration.active) | ⚠️ PARCIAL |
| 4 | Stripe | Processar pagamentos online | StripeProvider.createPayment() | 🟡 Provider existe, depende de configuração | ⚠️ PARCIAL |
| 5 | Asaas | Processar pagamentos online (boletos/PIX) | AsaasProvider.createPayment() | 🟡 Provider existe, depende de configuração | ⚠️ PARCIAL |
| 6 | Webhook | Receber confirmações de pagamento | `WebhookController.handle()` → roteia por provider | 🟡 Rota existe, depende do provider | ⚠️ PARCIAL |

### Bugs / Gaps
1. **Todas as integrações são PARCIAIS porque dependem de setup externo** — o usuário precisa criar a conta no provider, configurar as credenciais no painel do sistema, e ativar a integração.
2. **Integrações não testadas** — Os providers existem como código mas não foram testados ponta a ponta.
3. **Google Calendar:** O código de sincronização (`syncCalendarEvent`) estava comentado no appointment.service.ts em versões anteriores.

---

## Tabela Resumo

| # | Fluxo | Status | Próximo Bug a Corrigir | Prioridade |
|---|-------|--------|----------------------|-----------|
| 1 | Cliente Novo | ✅ OK | — | — |
| 2 | Agendamento | ✅ OK | — | — |
| 3 | Atendimento → ServiceOrder | ✅ OK | — | — |
| 4 | Comanda | ⚠️ PARCIAL | Cupom não integrado ao generateSale | 🟡 MÉDIA |
| 5 | Venda (SO → Sale) | ⚠️ PARCIAL | Cupom não integrado ao Sale.create() | 🟡 MÉDIA |
| 6 | Pagamento (Sale → Payment) | ⚠️ PARCIAL | Pagamento parcial CASH sem CashTransaction | 🔴 ALTA |
| 7 | Caixa (Payment → CashRegister) | ⚠️ PARCIAL | `closingAmount` opcional / `<h1` quebrado | 🟡 MÉDIA |
| 8 | Estoque (Venda → Baixa) | ✅ OK | — | — |
| 9 | Financeiro (Venda → Contas → Caixa) | ⚠️ PARCIAL | Pagamento parcial sem FinancialAccount | 🔴 ALTA |
| 10 | CRM (Cashback / Fidelidade / Score) | ✅ OK | — | — |
| 11 | Integrações | ⚠️ PARCIAL | Dependente de setup externo | 🟡 MÉDIA |

### Legenda

| Status | Significado |
|--------|-------------|
| ✅ OK | Fluxo completo, funcional, sem bugs conhecidos |
| ⚠️ PARCIAL | Fluxo funcional mas com gaps ou bugs não bloqueantes |
| ❌ QUEBRADO | Fluxo interrompido, não é possível completar |

### Prioridades de Correção (Recomendadas)

1. **🔴 ALTA** — Pagamento parcial CASH sem CashTransaction + sem FinancialAccount (fluxos 6, 7, 9)
2. **🟡 MÉDIA** — Cupom não integrado ao fluxo de venda (fluxos 4, 5)
3. **🟡 MÉDIA** — `closingAmount` obrigatório no fechamento de caixa (fluxo 7)
4. **🟡 MÉDIA** — `<h1` quebrado na página Caixa (fluxo 7, UX)

---

**Próximo passo:** Validar com Antonio qual fluxo corrigir primeiro. Cada correção deve fazer UM FLUXO COMPLETO funcionar do início ao fim.
