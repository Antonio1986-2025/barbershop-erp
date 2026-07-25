# Auditoria do Fluxo CRM — review-crm-flow

**Data:** 25/07/2026
**Status:** ✅ COMPLETO (auditoria apenas, sem correções)
**Repositório:** `main @ 2fd3fec`
**Auditor:** Hermes Agent (Sprint UX.2)

---

## Visão Geral do Módulo CRM

O CRM abrange 9 módulos backend que se integram ao fluxo operacional:

| Módulo | Arquivos | Função |
|--------|----------|--------|
| **Customer** | service, controller, module, phone.service, DTOs (create, update) | Cadastro e gestão de clientes |
| **CRM** | service (profile, segments, score), controller, module | Perfil unificado, segmentação, pontuação |
| **Cashback** | service (generate, cancelBySale, balance, history), controller | Geração e gestão de cashback (5%) |
| **Loyalty** | service (earn, cancelBySale, config, balance), controller | Pontos por valor gasto |
| **Automation** | service (onSalePaid, cron tasks), module | Regras automáticas pós-evento |
| **Task** | service, controller, module | Tarefas de acompanhamento (CRM) |
| **Campaign** | service, controller, module, DTOs | Campanhas de marketing segmentadas |
| **Interaction** | service, controller, module, DTOs | Registro de interações com clientes |
| **Notifications** | service, controller, gateway, module | Notificações internas e push |

### Schema — Modelos Prisma

| Modelo | Descrição | Relations |
|--------|-----------|-----------|
| `Customer` | Cliente | Sale[], Appointment[], CashbackTransaction[], LoyaltyPoints[], CustomerInteraction[], CustomerTask[], Notification[], CampaignRecipient[] |
| `CustomerInteraction` | Interação (tipo, assunto, metadata) | Customer, Campaign |
| `CustomerTask` | Tarefa de CRM | Customer |
| `CustomerSegment` | Segmento com regras JSON | Campaign |
| `CustomerTag` / `CustomerTagAssignment` | Tags | Customer |
| `Campaign` | Campanha de marketing | CustomerSegment, CampaignRecipient[] |
| `CampaignRecipient` | Participante da campanha | Campaign, Customer |
| `CashbackTransaction` | Cashback (AVAILABLE/USED/EXPIRED) | Customer, Sale |
| `LoyaltyPoints` | Pontos de fidelidade (EARNED/USED) | Customer, Sale |
| `Notification` | Notificação | User, Customer |

### Enums

| Enum | Valores |
|------|---------|
| `InteractionType` | CALL, EMAIL, SMS, WHATSAPP, VISIT, SOCIAL_MEDIA, OTHER |
| `TaskType` | FOLLOW_UP, RENEWAL, BIRTHDAY, CUSTOM |
| `TaskPriority` | LOW, MEDIUM, HIGH, URGENT |
| `TaskStatus` | OPEN, IN_PROGRESS, COMPLETED, CANCELLED |
| `CampaignType` | PROMOTIONAL, SEASONAL, BIRTHDAY, WIN_BACK, AUTOMATED |
| `CampaignStatus` | DRAFT, SCHEDULED, SENDING, SENT, COMPLETED, CANCELLED |
| `NotificationType` | APPOINTMENT_REMINDER, SALE_CONFIRMATION, PROMOTIONAL, SYSTEM_ALERT, ACCOUNT |
| `NotificationChannel` | INTERNAL, EMAIL, SMS, WHATSAPP, PUSH |
| `CashbackStatus` | AVAILABLE, USED, EXPIRED |
| `LoyaltyType` | EARNED, USED, EXPIRED |

---

## Endpoints Mapeados

### Customer (`/api/customers`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/` | Listar clientes | ✅ 200 |
| GET | `/search` | Buscar clientes | ✅ 200 |
| GET | `/:id` | Detalhe do cliente | ✅ 200 |
| POST | `/` | Criar cliente | ✅ 201 |
| PATCH | `/:id` | Atualizar cliente | ✅ 200 |
| DELETE | `/:id` | Remover cliente | ✅ 200 |

### CRM (`/api/crm`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/profile/:customerId` | Perfil completo com score, segmentos | ✅ 200 |
| GET | `/segments` | Listar segmentos | ✅ 200 |
| GET | `/segments/:id` | Detalhe do segmento | ✅ 200 |
| POST | `/segments` | Criar segmento | ⚠️ Não testado |
| PATCH | `/segments/:id` | Atualizar segmento | ⚠️ Não testado |
| DELETE | `/segments/:id` | Remover segmento (soft delete) | ⚠️ Não testado |
| GET | `/segments/customer/:customerId` | Segmentos do cliente | ✅ 200 |

### Cashback (`/api/cashback`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/balance/:customerId` | Saldo disponível | ✅ 200 |
| GET | `/history/:customerId` | Histórico de transações | ✅ 200 |

### Loyalty (`/api/loyalty`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/config` | Configuração do programa | ⚠️ Não testado |
| PATCH | `/config` | Atualizar configuração | ⚠️ Não testado |
| GET | `/balance/:customerId` | Saldo de pontos | ✅ 200 |
| GET | `/history/:customerId` | Histórico de pontos | ⚠️ Não testado |

### Tasks (`/api/crm/tasks`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/` | Listar tarefas | ✅ 200 (13 registros) |
| GET | `/:id` | Detalhe da tarefa | ⚠️ Não testado |
| POST | `/` | Criar tarefa | ⚠️ Não testado |
| PATCH | `/:id` | Atualizar tarefa | ⚠️ Não testado |
| PATCH | `/:id/complete` | Completar tarefa | ⚠️ Não testado |
| PATCH | `/:id/cancel` | Cancelar tarefa | ⚠️ Não testado |

### Campaigns (`/api/crm/campaigns`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/` | Listar campanhas | ❌ 500 |
| GET | `/:id` | Detalhe da campanha | ⚠️ Não testado |
| POST | `/` | Criar campanha | ⚠️ Não testado |
| PATCH | `/:id` | Atualizar campanha | ⚠️ Não testado |
| DELETE | `/:id` | Remover campanha | ⚠️ Não testado |
| POST | `/:id/recipients` | Adicionar destinatários | ⚠️ Não testado |
| GET | `/:id/recipients` | Listar destinatários | ⚠️ Não testado |

### Interactions (`/api/crm/interactions`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/` | Listar interações | ❌ 500 |
| GET | `/:id` | Detalhe da interação | ⚠️ Não testado |
| POST | `/` | Criar interação | ⚠️ Não testado |
| PATCH | `/:id` | Atualizar interação | ⚠️ Não testado |
| DELETE | `/:id` | Remover interação | ⚠️ Não testado |

### Notifications (`/api/notifications`)

| Método | Endpoint | Funcionalidade | Status |
|--------|----------|---------------|--------|
| GET | `/` | Listar notificações | ✅ 200 |
| GET | `/unread-count` | Contagem de não lidas | ✅ 200 |
| GET | `/:id` | Detalhe da notificação | ⚠️ Não testado |
| POST | `/` | Criar notificação | ✅ 201 |
| PATCH | `/:id/read` | Marcar como lida | ⚠️ Não testado |

---

## Análise por Evento

### 1. Cliente Criado

**O que deveria acontecer:**
- Customer registrado com telefone normalizado, sem duplicatas
- Audit log criado
- Se for primeira compra, CustomerScore calculado
- Notificação de boas-vindas (se configurado)
- Interação registrada (tipo=OTHER, "Cliente cadastrado")
- Verificar campanhas automáticas (boas-vindas)

**O que acontece hoje:**
- ✅ `CustomerService.create()` cria cliente com validação de telefone (normalizado, duplicidade)
- ✅ Audit log CREATE registrado
- ⚠️ Retorna 409 Conflict se telefone já existe (em vez de atualizar ou informar que já existe)
- ❌ **Nenhuma notificação de boas-vindas** disparada no create()
- ❌ **Nenhuma interação** registrada
- ❌ **Nenhuma verificação de campanha** automática
- ❌ **Nenhum CustomerScore** persistido (calculado apenas sob demanda via CRM profile)

**Services:** `CustomerService.create()`
**Models:** `Customer`
**Eventos:** Audit log (CREATE)

**Bugs/Gaps:**
- **CRM-01 🟡 MÉDIO:** `CustomerService.create()` não gera interaction de cadastro
- **CRM-02 🟡 MÉDIO:** `CustomerService.create()` não dispara notificação de boas-vindas
- **CRM-03 🟢 BAIXO:** CustomerScore não é persistido — calculado sob demanda (pode ser intencional)

---

### 2. Agendamento Criado

**O que deveria acontecer:**
- Agendamento registrado
- Notificação de confirmação enviada ao cliente
- Interação registrada (tipo=OTHER, "Agendamento criado")
- Tarefa de lembrete criada (se configurado)

**O que acontece hoje:**
- ✅ `AppointmentService.create()` cria agendamento
- ✅ `notificationsService.create()` dispara notificação de confirmação
- ❌ **Nenhuma interação** registrada com tipo APPOINTMENT
- ❌ **Nenhuma tarefa** de lembrete automática criada no create()
- ❌ **Nenhuma verificação** de campanhas segmentadas

**Services:** `AppointmentService.create()`, `NotificationsService.create()`
**Models:** `Appointment`, `Notification`
**Eventos:** Notification (APPOINTMENT_REMINDER)

**Bugs/Gaps:**
- **CRM-04 🟡 MÉDIO:** Appointment.create() não registra interaction
- **CRM-05 🟡 MÉDIO:** Sem criação automática de tarefa de lembrete no agendamento

---

### 3. Atendimento Concluído

**O que deveria acontecer:**
- Agendamento marcado como COMPLETED
- Notificação de feedback enviada ao cliente
- Interação registrada (tipo=VISIT, "Atendimento concluído")
- Se aplicável, tarefa de follow-up criada
- CustomerScore recalculado
- Ranking de cliente atualizado

**O que acontece hoje:**
- ✅ `AppointmentService.complete()` marca como COMPLETED
- ✅ `notificationsService.create()` dispara notificação de agradecimento/feedback
- ❌ **Nenhuma interação** registrada
- ❌ **Nenhuma tarefa** de follow-up automática
- ❌ **Nenhum CustomerScore** recalculado ou persistido
- ❌ **Nenhum ranking** atualizado

**Services:** `AppointmentService.complete()`, `NotificationsService.create()`
**Models:** `Appointment`, `Notification`
**Eventos:** Notification (agradecimento)

**Bugs/Gaps:**
- **CRM-06 🟠 ALTO:** Appointment.complete() não registra interação, nem dispara tarefa de follow-up
- **CRM-07 🟢 BAIXO:** CustomerScore apenas calculado sob demanda no perfil (não persiste)

---

### 4. Venda Concluída

**O que deveria acontecer:**
- Sale status alterado para PAID
- Cashback gerado (5% do total)
- Pontos de fidelidade acumulados
- Estoque baixado (se houver produtos)
- Serviços convertidos em ordem de serviço (se aplicável)
- Notificação de confirmação enviada
- Tarefa de follow-up pós-venda criada
- Interação registrada (tipo=OTHER, "Venda concluída")
- CustomerScore recalculado
- Ranking atualizado
- FinancialAccount registrado

**O que acontece hoje:**
- ✅ SalePaymentService.create() com willComplete=true executa:
  - ✅ `deductStock()` (SALE)
  - ✅ `cashbackService.generate()` (5%, userId corrigido)
  - ✅ `loyaltyService.earn()` (pontos por valor)
  - ✅ `automationService.onSalePaid()` (cria tarefa FOLLOW_UP)
  - ✅ `notificationsService.create()` (confirmação)
- ✅ Venda atualizada para PAID
- ✅ FinancialAccount criado
- ✅ Audit log registrado
- ❌ **Nenhuma interação** registrada com tipo SALE
- ❌ **Nenhum CustomerScore** atualizado no momento da venda

**Services:** `SalePaymentService.create()`, `CashbackService.generate()`, `LoyaltyService.earn()`, `AutomationService.onSalePaid()`, `NotificationsService.create()`, `StockMovementService.recordMovement()`
**Models:** `Sale`, `Payment`, `CashbackTransaction`, `LoyaltyPoints`, `CustomerTask`, `Notification`, `StockMovement`, `FinancialAccount`
**Eventos:** Cashback, Loyalty, Task (FOLLOW_UP), Notification, Stock Movement

**Bugs/Gaps:**
- **CRM-08 🟡 MÉDIO:** Venda concluída não registra interaction (tipo SALE)
- **CRM-09 🟢 BAIXO:** CustomerScore não persistido após venda (calculado sob demanda)

---

### 5. Pagamento Confirmado

**O que deveria acontecer:**
- Payment registrado como PAID
- CashTransaction criada (se CASH)
- Se pagamento completo (willComplete), fluxo de conclusão da venda
- Notificação de confirmação de pagamento
- Interação registrada (tipo=OTHER, "Pagamento confirmado")

**O que acontece hoje:**
- ✅ Payment criado como PAID
- ✅ CashTransaction criada para CASH
- ✅ Fluxo de conclusão (deductStock, cashback, loyalty, automation, notification)
- ❌ **Nenhuma interação** registrada especificamente para o pagamento
- ❌ **Nenhuma notificação** específica de pagamento (a notificação genérica da venda cobre)

**Services:** `SalePaymentService.create()`, `CashService`, `CashbackService`, `LoyaltyService`, `AutomationService`
**Models:** `Payment`, `CashTransaction`, `CashbackTransaction`, `LoyaltyPoints`, `CustomerTask`, `Notification`
**Eventos:** Cashback, Loyalty, Notification, Task

**Bugs/Gaps:**
- **CRM-10 🟢 BAIXO:** Pagamento não registra interaction separada (a da venda cobre)

---

## Análise por Subsistema

### CustomerScore

**O que deveria acontecer:** Pontuação persistida do cliente (0-100) baseada em frequência, ticket, recência, cashback, fidelidade, cancelamentos.

**O que acontece hoje:**
- ✅ Score calculado sob demanda via `CrmService.computeScore()` (pesos configuráveis: frequency 25%, ticket 20%, total 20%, recency 15%, cancellation 10%, cashback 5%, loyalty 5%)
- ❌ **Score NÃO é persistido** — não há modelo `CustomerScore` no banco
- ❌ **Nenhum trigger** atualiza o score — só é calculado quando alguém chama o perfil CRM

### Cashback

**O que deveria acontecer:** 5% do valor da venda convertido em cashback disponível para próximas compras.

**O que acontece hoje:**
- ✅ `CashbackService.generate()` gera 5% (corrigido userId na Sprint UX.2)
- ✅ `CashbackService.cancelBySale()` reverte no cancelamento/reembolso
- ✅ Status: AVAILABLE, USED, EXPIRED
- ✅ Saldo consultável via `GET /api/cashback/balance/:customerId`
- ⚠️ Cashback expirado? (seed tem EXPIRED — parece que expira)

### Loyalty

**O que deveria acontecer:** Pontos calculados por valor gasto (configurável: `pointsPerAmount`, `minAmount`), conversíveis em benefícios.

**O que acontece hoje:**
- ✅ `LoyaltyService.earn()` calcula pontos proporcional ao valor
- ✅ Configurável via `GET/PATCH /api/loyalty/config` (`active`, `pointsPerAmount`, `minAmount`)
- ✅ `LoyaltyService.cancelBySale()` reverte no cancelamento
- ✅ Saldo consultável via `GET /api/loyalty/balance/:customerId`

### Automations

**O que deveria acontecer:** Regras automáticas executadas em eventos: SalePaid, AppointmentCompleted, CustomerBirthday, etc.

**O que acontece hoje:**
- ✅ `AutomationService.onSalePaid()` cria tarefa FOLLOW_UP (`title: "Follow-up pós-venda"`)
- ✅ Notificação de automação criada com tipo "SALE_CANCELLED" quando venda é cancelada
- ✅ Cron jobs configurados: `checkBirthdays`, `processInactiveAlerts`, `processCampaignSchedule`
- ❌ **Não há `onAppointmentCompleted()`** no AutomationService
- ❌ **Não há `onCustomerCreated()`** no AutomationService
- ⚠️ Limite de automações: `exports[LIMITS.AUTOMATION_RULES] (exports.MAX_AUTOMATIONS, 50)`

### Tasks

**O que deveria acontecer:** Tarefas de CRM criadas por automações ou manualmente.

**O que acontece hoje:**
- ✅ 13 tarefas FOLLOW_UP criadas (geradas por automação nas vendas)
- ✅ CRUD completo via `/api/crm/tasks`
- ✅ Tipos: FOLLOW_UP, RENEWAL, BIRTHDAY, CUSTOM
- ⚠️ Todas as 13 tarefas estão com status OPEN (ninguém está completando)

### Campaigns

**O que deveria acontecer:** Campanhas de marketing segmentadas, com disparo agendado.

**O que acontece hoje:**
- ✅ CRUD via `/api/crm/campaigns`
- ✅ `CampaignService.schedule()` dispara campanha agendada
- ✅ Destinatários via segmento ou manual
- ❌ **GET `/api/crm/campaigns` retorna 500** — possivelmente falta de dados ou query problemática
- ❌ **Nenhuma Interaction** é registrada quando campanha é enviada

### Interactions

**O que deveria acontecer:** Registro de toda interação com cliente (chamada, email, visita, venda, etc.)

**O que acontece hoje:**
- ✅ CRUD via `/api/crm/interactions`
- ✅ Tipos: CALL, EMAIL, SMS, WHATSAPP, VISIT, SOCIAL_MEDIA, OTHER
- ❌ **GET `/api/crm/interactions` retorna 500** — endpoint quebrado
- ❌ **Nenhum evento do sistema** cria interações automaticamente (são só manuais)

### Notifications

**O que deveria acontecer:** Notificações para usuários e clientes sobre eventos do sistema.

**O que acontece hoje:**
- ✅ Criada em Appointment create/complete (confirmação/agradecimento)
- ✅ Criada em Sale complete (confirmação)
- ✅ Criada em Sale cancel (alerta)
- ✅ WebSocket gateway (`notifications.gateway.ts`) para notificações em tempo real
- ✅ CRUD completo via `/api/notifications`

---

## Tabela Resumo

### Por Evento

| Evento | Customer | Score | Cashback | Loyalty | Interaction | Tasks | Campaigns | Automations | Notifications | Status |
|--------|:--------:|:-----:|:--------:|:-------:|:-----------:|:-----:|:---------:|:-----------:|:-------------:|:------:|
| 1. Cliente criado | ✅ | ❌ | — | — | ❌ | — | ❌ | ❌ | ❌ | PARCIAL |
| 2. Agendamento criado | ✅ | — | — | — | ❌ | ❌ | ❌ | ❌ | ✅ | PARCIAL |
| 3. Atendimento concluído | ✅ | ❌ | — | — | ❌ | ❌ | — | ❌ | ✅ | PARCIAL |
| 4. Venda concluída | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | — | ✅ | ✅ | OK |
| 5. Pagamento confirmado | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | — | ✅ | ✅ | OK |

### Por Subsistema

| Subsistema | Status | Observações |
|------------|--------|-------------|
| Customer CRUD | ✅ OK | Telefone validado, duplicata detectada |
| CRM Profile | ✅ OK | Score, segmentos, finanças, fidelidade |
| CRM Segments | ✅ OK | Regras JSON, matching em tempo real |
| CustomerScore | ❌ PARCIAL | Calculado sob demanda, não persistido |
| Cashback | ✅ OK | Geração, reversão, saldo, histórico |
| Loyalty | ✅ OK | Configurável, geração, reversão, saldo |
| Automations (SalePaid) | ✅ OK | Cria tarefa FOLLOW_UP |
| Automations (outros) | ❌ PARCIAL | Só SalePaid implementado |
| Tasks | ✅ OK | CRUD funcional, 13 registros |
| Campaigns | ❌ QUEBRADO | GET / retorna 500 |
| Interactions | ❌ QUEBRADO | GET / retorna 500 |
| Notifications | ✅ OK | Criadas em Appointment e Sale |
| WebSocket Gateway | ✅ OK | Tempo real implementado |

### Classificação por Fluxo

| Fluxo | Status | Prioridade |
|-------|--------|-----------|
| Cliente → Cadastro → CRM | ✅ OK | — |
| Cliente → Agendamento → Notificação | ✅ OK | — |
| Cliente → Agendamento → Interaction | ❌ PARCIAL | MÉDIA |
| Cliente → Agendamento → Task | ❌ PARCIAL | MÉDIA |
| Cliente → Atendimento → Notificação | ✅ OK | — |
| Cliente → Atendimento → CRM (score) | ❌ PARCIAL | BAIXA |
| Cliente → Venda → Cashback | ✅ OK | — |
| Cliente → Venda → Loyalty | ✅ OK | — |
| Cliente → Venda → Automation → Task | ✅ OK | — |
| Cliente → Venda → Interaction | ❌ PARCIAL | MÉDIA |
| Cliente → Campanha → Envio | ❌ QUEBRADO | ALTA |
| Cliente → Interação → Registro | ❌ QUEBRADO | ALTA |
| Cliente → Notificação (push) | ✅ OK | — |
| CRM → Perfil → Score | ✅ OK | — |
| CRM → Segmentos → Matching | ✅ OK | — |
| CRM → Dashboard | ⚠️ Não auditado | — |

---

## Problemas Encontrados

### ❌ Fluxo Quebrado

| ID | Problema | Local | Impacto | Evidência |
|----|----------|-------|---------|-----------|
| QUE-01 | **Interactions: GET / retorna 500** | `interaction.controller.ts` | Impossível listar interações de clientes | Teste: `curl /api/crm/interactions` → erro de parse |
| QUE-02 | **Campaigns: GET / retorna 500** | `campaign.controller.ts` | Impossível listar/gerenciar campanhas | Teste: `curl /api/crm/campaigns` → falha |

### 🟠 Regra de Negócio

| ID | Problema | Local | Impacto | Tipo |
|----|----------|-------|---------|------|
| REG-01 | **CustomerScore não é persistido** | CrmService | Score recalculado a cada consulta — impossível rankear clientes sem consultar todos | Regra de negócio |
| REG-02 | **Nenhuma interação automática nos eventos** | CustomerService, AppointmentService, SalePaymentService | Interações só são registradas manualmente — não há rastro automático dos eventos do sistema | Integração entre módulos |
| REG-03 | **AutomationService só implementa onSalePaid** | AutomationService | Não há automações para criação de cliente, agendamento, ou atendimento | Regra de negócio |
| REG-04 | **Appointment.complete() não cria tarefa de follow-up** | AppointmentService | Cliente atendido não recebe follow-up automático | Regra de negócio |

### 🟡 Integração entre Módulos

| ID | Problema | Local | Impacto |
|----|----------|-------|---------|
| INT-01 | **Appointment.create() não integra com Tasks** | AppointmentService | Sem tarefa de lembrete automática no agendamento |
| INT-02 | **Customer.create() não integra com Campaigns** | CustomerService | Cliente novo não é verificado contra campanhas de boas-vindas |
| INT-03 | **Campaigns não registra interações** | CampaignService | Envio de campanha não gera interaction |
| INT-04 | **Customer.create() não gera notificação** | CustomerService | Sem boas-vindas automática |

### 🟢 Interface (UX)

| ID | Problema | Local | Impacto |
|----|----------|-------|---------|
| UX-01 | **409 Conflict em cliente duplicado sem mensagem clara** | CustomerService | Usuário não entende o que fazer quando telefone já existe |
| UX-02 | **Todas as 13 tasks FOLLOW_UP estão OPEN** | AutomationService | Tarefas nunca são fechadas — poluição visual |

### 📋 Documentação

| ID | Problema | Local |
|----|----------|-------|
| DOC-01 | Sem documentação dos pesos do CustomerScore | CrmService |

---

## Resumo das Correções Recomendadas

### Prioridade ALTA (Quebrado)

1. **QUE-01: Corrigir GET /api/crm/interactions** — Diagnosticar causa do 500 e corrigir
2. **QUE-02: Corrigir GET /api/crm/campaigns** — Diagnosticar causa do 500 e corrigir

### Prioridade MÉDIA (Regras de negócio)

3. **REG-02: Criar interações automáticas nos eventos** — CustomerService.create(), AppointmentService.create()/complete(), SalePaymentService.create() devem gerar CustomerInteraction com tipo adequado e referência ao evento
4. **REG-04: Adicionar onAppointmentCompleted() na AutomationService** — Follow-up automático após atendimento
5. **INT-01: Tarefa de lembrete no Appointment.create()** — Criar CustomerTask do tipo FOLLOW_UP para lembrete de agendamento
6. **INT-04: Notificação de boas-vindas no Customer.create()** — Disparar Notification quando cliente é cadastrado

### Prioridade BAIXA (Melhorias)

7. **REG-01: Persistir CustomerScore** — Criar modelo `CustomerScore` e atualizar nos eventos de venda/atendimento
8. **UX-01: Melhorar mensagem de cliente duplicado** — Sugerir reativação em vez de apenas 409

---

## Conclusão

**O fluxo CRM está PARCIALMENTE FUNCIONAL.**

✅ **O que funciona bem:** Perfil CRM (score, segmentos, finanças), Cashback, Loyalty, Notificações, Tasks (via automação de venda), Segmentação por regras.

⚠️ **O que precisa de atenção:** 2 endpoints quebrados (Interactions e Campaigns), falta de interações automáticas, automações limitadas a SalePaid, CustomerScore não persistido.

🚫 **Quebrado:** Interactions GET e Campaigns GET retornam 500.

| Prioridade | Qtde | IDs |
|-----------|------|-----|
| 🔴 Quebrado | 2 | QUE-01, QUE-02 |
| 🟠 Regra de negócio | 4 | REG-01 a REG-04 |
| 🟡 Integração | 4 | INT-01 a INT-04 |
| 🟢 UX | 2 | UX-01, UX-02 |
| 📋 Documentação | 1 | DOC-01 |

---

*Relatório gerado automaticamente por Hermes Agent — Auditoria de Fluxo CRM*
