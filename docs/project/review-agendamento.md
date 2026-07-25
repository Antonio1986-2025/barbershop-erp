# Auditoria — Módulo Agendamento

## 1. Fluxo Atual Completo

### Criação de Agendamento
```
Usuário → /agendamentos/novo → Formulário:
  1. Seleciona Unidade
  2. Seleciona ou cria Cliente (telefone-primeiro)
  3. Seleciona Profissional
  4. Seleciona Serviço
  5. Seleciona Data → busca horários disponíveis via /api/schedule/availability
  6. Seleciona Horário
  7. Opcional: Observações
  8. Checkbox: "Abrir comanda com este serviço"
  9. Salva → POST /api/appointments
```

### Backend — AppointmentService.create()
```
POST /api/appointments → AppointmentController.create() → AppointmentService.create()
  1. Valida dados do DTO
  2. Se newCustomerName + newCustomerPhone:
     a. Busca cliente por telefone (findByPhone)
     b. Se existe: usa existente
     c. Se não existe: cria via CustomerService.create()
  3. Se customerId: usa diretamente
  4. Calcula endAt = startAt + service.durationMinutes
  5. Salva appointment no banco (status: SCHEDULED)
  6. Cria log de auditoria
  7. Se createSale = true: cria venda DRAFT com o serviço
  8. Dispara notificação (APPOINTMENT_CREATED)
  9. Sincroniza com Google Calendar (se integrado)
  10. Retorna appointment com includes (customer, professional, service, unit)
```

### Transições de Status
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                                        CANCELED (a qualquer momento)
                                        NO_SHOW (a partir de CONFIRMED)
```

### Cancelamento
```
POST /api/appointments/:id/cancel
  1. Valida se status permite cancelamento (não pode CANCELED ou COMPLETED)
  2. Atualiza status para CANCELED, registra motivo e data
  3. Dispara notificação APPOINTMENT_CANCELLED
  4. Remove evento do Google Calendar (se integrado)
```

### Reagendamento
```
POST /api/appointments/:id/reschedule
  1. Valida se status permite reagendamento
  2. Atualiza startAt/endAt, registra rescheduledFromId
  3. Se já tinha evento no Google Calendar: atualiza
  4. Cria notificação
```

---

## 2. Telas Envolvidas

| Tela | Rota | Arquivo |
|---|---|---|
| Lista de Agendamentos | `/agendamentos` | `agendamentos/page.tsx` |
| Novo Agendamento | `/agendamentos/novo` | `agendamentos/novo/page.tsx` |
| Editar Agendamento | ❌ **Não existe** | — |

**Observação:** Não há tela de edição detalhada ou visualização individual do agendamento. Toda a operação é feita via modais na lista (cancelar, reagendar, alterar status). Também não há tela de detalhes do agendamento (página dedicada).

---

## 3. Componentes Utilizados

### Frontend
| Componente | Onde é usado |
|---|---|
| `FormField` | Novo agendamento |
| `FormActions` | Novo agendamento |
| `ErrorBox` | Lista + Novo |
| `QuickCustomerForm` | 🟡 **Não usado** no agendamento (o fluxo de novo cliente foi implementado inline) |

### Backend (serviços injetados)
| Serviço | Função |
|---|---|
| `PrismaService` | Acesso ao banco |
| `AuditService` | Log de auditoria |
| `NotificationsService` | Notificações push/in-app |
| `IntegrationsService` | Sincronização Google Calendar |
| `CustomerService` | Criação/busca de clientes |
| `SaleService` | Criação de comanda (venda) |
| `PhoneService` | Normalização de telefone |

---

## 4. Endpoints Utilizados

### Backend — AppointmentController

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/appointments` | Listar agendamentos (filtros: unitId, professionalId, customerId, status, startDate, endDate) |
| `GET` | `/api/appointments/calendar` | Listar para calendário (startDate, endDate, unitId, professionalId) |
| `GET` | `/api/appointments/:id` | Detalhes de um agendamento |
| `POST` | `/api/appointments` | Criar agendamento |
| `PATCH` | `/api/appointments/:id` | Atualizar agendamento |
| `POST` | `/api/appointments/:id/cancel` | Cancelar agendamento |
| `POST` | `/api/appointments/:id/reschedule` | Reagendar |
| `PATCH` | `/api/appointments/:id/status` | Atualizar status individual |
| `DELETE` | `/api/appointments/:id` | Excluir (soft delete) |

### Backend — ScheduleController (externo ao módulo)

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/schedule/availability` | Buscar horários disponíveis |

### Frontend — Lib

| Função | Endpoint chamado |
|---|---|
| `fetchAppointments()` | `GET /api/appointments` |
| `fetchAppointmentsCalendar()` | `GET /api/appointments/calendar` |
| `fetchAppointment()` | `GET /api/appointments/:id` |
| `createAppointment()` | `POST /api/appointments` |
| `updateAppointment()` | `PATCH /api/appointments/:id` |
| `cancelAppointment()` | `POST /api/appointments/:id/cancel` |
| `rescheduleAppointment()` | `POST /api/appointments/:id/reschedule` |
| `updateAppointmentStatus()` | `PATCH /api/appointments/:id/status` |
| `deleteAppointment()` | `DELETE /api/appointments/:id` |

---

## 5. Serviços do Backend Envolvidos

### AppointmentService (444 linhas)
- `findAll()` — Lista com filtros, ordenação, paginação
- `findOne()` — Busca por ID
- `create()` — Cria agendamento + cliente + venda + notificação + calendário
- `update()` — Atualiza dados básicos
- `cancel()` — Cancela com motivo, notifica, remove do calendário
- `reschedule()` — Reagenda com nova data, atualiza calendário
- `softRemove()` — Soft delete
- `updateStatus()` — Transição de status individual
- `findByDateRange()` — Para calendário
- `syncCalendarEvent()` — Sincronização com Google Calendar

### ScheduleService (módulo separado)
- `getAvailability()` — Retorna slots disponíveis baseado em regras de horário

---

## 6. Integrações Acionadas

| Integração | Quando | O que faz |
|---|---|---|
| **Notificações** | create, cancel, reschedule | Cria notificação in-app para o profissional |
| **Google Calendar** | create, cancel, reschedule, update | Sincroniza evento no Google Calendar do profissional (se integrado) |
| **CRM** | ❌ **Não integrado** | Não há criação de interação ou segmentação ao agendar |
| **Evolution API (WhatsApp)** | ❌ **Não integrado** | Não envia confirmação por WhatsApp |
| **Criação de Venda** | create (se createSale = true) | Abre comanda DRAFT com o serviço agendado |

---

## 7. Criação da Ordem de Serviço

**Atualmente não existe criação automática de Ordem de Serviço ao concluir o atendimento.**

- O modelo `ServiceOrder` existe no Prisma com `appointmentId` opcional
- O status `COMPLETED` no Appointment apenas marca o agendamento como concluído
- **Não há** no `updateStatus()` ou `create()` do AppointmentService nenhuma lógica que crie uma `ServiceOrder`
- A Ordem de Serviço parece ser um fluxo separado (não implementado ou em outro módulo)

**Fluxo atual ao concluir atendimento:**
```
Usuário clica "Concluir" → PATCH /api/appointments/:id/status { status: COMPLETED }
  → Apenas atualiza status no banco
  → NÃO cria Ordem de Serviço
  → NÃO fecha comanda automaticamente (se existir)
  → NÃO dispara notificação de conclusão
```

---

## 8. Pontos de Melhoria de UX

### 8.1. Cliente novo no agendamento não usa QuickCustomerForm
O formulário de novo agendamento implementou o fluxo de novo cliente **inline** (campos de nome + telefone) em vez de reutilizar o componente `QuickCustomerForm`. Isso duplica código e comportamento. O QuickCustomerForm faz pesquisa automática por telefone — o inline atual não.

**Impacto:** Se o usuário digitar um telefone de cliente já existente no campo "Novo Cliente", o sistema criará uma duplicata (embora o backend rejeite com 409).

### 8.2. Sem busca automática de horários ao selecionar profissional/serviço
A busca de horários disponíveis (`fetchAvailability`) depende de unidade + data. Profissional e serviço são opcionais no filtro. Se o usuário selecionar profissional e serviço, os slots são recalculados. Mas não há indicador claro de que a grade está sendo atualizada.

### 8.3. Lista de agendamentos sem calendário visual
A lista é exibida como cards empilhados. Não há uma visualização em calendário (semanal/diário) que mostre a ocupação dos profissionais ao longo do dia. O endpoint `/calendar` existe mas não é usado no frontend.

### 8.4. Sem página de edição dedicada
Não é possível editar um agendamento de forma detalhada (trocar serviço, profissional, reagendar). As ações disponíveis são via modais na lista (cancelar, reagendar com data/hora apenas).

### 8.5. Status "Não Compareceu" (NO_SHOW) não tem ação dedicada
Não há botão para marcar como "Não Compareceu". Esse status existe no backend/enum mas não tem fluxo no frontend.

### 8.6. Mobile: sem adaptação específica
A lista de agendamentos usa cards que funcionam em mobile, mas os modais de cancelar/reagendar não foram testados para telas pequenas.

### 8.7. Sem filtro por cliente na lista
Não há filtro para buscar agendamentos de um cliente específico embora o endpoint aceite `customerId`.

---

## 9. Possíveis Inconsistências

### 9.1. Fluxo "Abrir Comanda" ≠ "Ordem de Serviço"
O checkbox "Abrir comanda" cria uma venda DRAFT. Mas ao concluir o agendamento (COMPLETED), a venda continua DRAFT — não é finalizada automaticamente. E a Ordem de Serviço nunca é criada, embora o modelo exista no banco.

**Risco:** O profissional pode esquecer de finalizar a comanda no PDV após concluir o atendimento.

### 9.2. Cliente duplicado no formulário inline
O formulário de novo agendamento permite digitar nome + telefone de um novo cliente, mas não pesquisa se o telefone já existe. O backend rejeita (409), mas a experiência é frustrante — o usuário perde os dados preenchidos.

### 9.3. Notificações apenas in-app
As notificações são criadas no banco (`Notification` model), mas não há evidência de entrega real (push, WhatsApp, email). O profissional só vê a notificação se estiver logado no sistema.

### 9.4. Google Calendar: erro silencioso
`syncCalendarEvent` usa `.catch(() => {})` — qualquer falha na sincronização é engolida. O usuário nunca sabe se o evento foi sincronizado ou não.

### 9.5. Sem bloqueio de horário duplicado
Não há verificação de conflito de horário no backend. O endpoint de `availability` sugere slots, mas o POST não valida se o slot ainda está disponível no momento da criação. Pode haver sobreposição (race condition).

---

## 10. Recomendações (sem novas funcionalidades)

### 10.1. Substituir fluxo inline de cliente pelo QuickCustomerForm
Reutilizar o componente `QuickCustomerForm` já implementado no lugar dos inputs manuais de nome + telefone. Zero código novo — apenas integrar o componente existente.

### 10.2. Adicionar validação de conflito de horário no create()
Antes de salvar o appointment, verificar se já existe outro agendamento no mesmo horário para o mesmo profissional + unidade. Retornar 409 se conflitar.

### 10.3. Finalizar comanda ao concluir agendamento
No `updateStatus()` para COMPLETED, se o appointment tiver uma sale vinculada, finalizar a venda (alterar status de DRAFT para alguma transição lógica, como fechar o caixa).

### 10.4. Unificar notificações com falha visível
Remover `.catch(() => {})` e pelo menos logar o erro. Futuramente, exibir indicador de falha.

### 10.5. Adicionar ação NO_SHOW no frontend
Status já existe no backend — só falta o botão na lista.

### 10.6. Remover duplicação entre customer-form e quick-customer-form
O `customer-form.tsx` reimplementou inline o fluxo telefone-primeiro. Deveria importar `QuickCustomerForm` como dependência.

---

## Status

- **Versão atual:** Fluxo funcional com Pontos de Melhoria identificados (acima)
- **Débitos técnicos:** Não reutilização do QuickCustomerForm, validação de conflito ausente, Ordem de Serviço não integrada
- **Próxima ação:** Aguardando revisão do usuário para definir quais melhorias implementar

---

## 11. Validação Arquitetural

### 11.1. Diagrama de Relacionamentos Atual

```
Appointment ──opcional──> ServiceOrder (appointmentId @unique)
     │                            │
     │                            ├── ServiceOrderItem (serviços APENAS)
     │                            │      └── Service
     │                            │
     │                            └── Payment[] (opcional)
     │
     └── (via createSale) ──> Sale (sem FK direta)
                                   ├── SaleItem (produtos + serviços)
                                   │      ├── Product?
                                   │      └── Service?
                                   │
                                   ├── Payment[] (opcional)
                                   │
                                   └── CashbackTransaction[]
                                       LoyaltyPoints[]
```

### 11.2. Modelo ServiceOrder — Capaz de armazenar?

| Requisito | Capaz? | Observação |
|---|---|---|
| Serviços | ✅ Sim | Via `ServiceOrderItem[]`, cada item vinculado a um `Service` |
| Produtos | ❌ **Não** | `ServiceOrderItem` só tem `serviceId` — não existe `productId` |
| Descontos | ⚠️ Parcial | `discount Decimal` global na ServiceOrder, sem desconto por item |
| Cupom | ❌ **Não** | Não há `couponId` no modelo ServiceOrder |
| Totais | ✅ Sim | `subtotal`, `discount`, `total` — todos `Decimal` |

### 11.3. Fluxo PDV — ServiceOrder sem recriar itens

> **Não existe hoje.** O PDV (`pdv/novo`) cria uma `Sale` diretamente — não abre uma `ServiceOrder` existente.
>
> Se uma `ServiceOrder` for criada a partir de um agendamento (quando implementado), o PDV precisará:
> - Carregar a ServiceOrder
> - Adicionar produtos ao carrinho (mas `ServiceOrderItem` não aceita produtos)
> - Aplicar descontos/cupons (não há `couponId`)
> - Converter para pagamento
>
> O modelo `ServiceOrderItem` atual não suporta o carrinho misto (serviço + produto) que o PDV exige.

### 11.4. Relacionamentos Entre Entidades

| Relação | Existe? | Tipo |
|---|---|---|
| `Appointment → ServiceOrder` | ⚠️ Unidirecional | `ServiceOrder.appointmentId` (FK opcional + @unique). Appointment **não tem** campo reverso `serviceOrders[]`. |
| `ServiceOrder → Appointment` | ✅ | `ServiceOrder.appointment Appointment? @relation` |
| `ServiceOrder → Sale` | ❌ **Não existe** | Não há FK entre ServiceOrder e Sale. São entidades paralelas sem relação. |
| `ServiceOrder → Payment` | ✅ | `Payment.serviceOrderId` (FK opcional) |
| `Sale → Payment` | ✅ | `Payment.saleId` (FK opcional) |
| `Sale → Coupon` | ❌ **Não existe** | `Sale` não tem `couponId`. `Coupon` não tem relação com Sale. |
| `Appointment → Sale` | ⚠️ Indireta | Criação via `AppointmentService.create()` com `createSale: true`. Sem FK direta — não há `appointmentId` na Sale. |
| `Appointment ↔ Customer` | ✅ | `Appointment.customerId` |
| `ServiceOrder ↔ Customer` | ✅ | `ServiceOrder.customerId` |
| `Sale ↔ Customer` | ✅ | `Sale.customerId` (opcional) |

### 11.5. Gaps Identificados

| # | Gap | Impacto |
|---|---|---|
| 1 | `ServiceOrderItem` não aceita **produtos** | Uma OS não pode adicionar itens do estoque (ex: pomada, shampoo usado no serviço) |
| 2 | `Sale` não tem `couponId` | Não é possível vincular cupom de desconto a uma venda |
| 3 | `ServiceOrder` ↔ `Sale` sem relação | Duas entidades paralelas com Payments separados — risco de duplicidade |
| 4 | `Appointment` → `Sale` sem FK direta | A venda criada via createSale não tem referência de volta ao agendamento |
| 5 | `Appointment` → `ServiceOrder` sem campo reverso | Não é possível navegar `appointment.serviceOrders[]` no Prisma |

### 11.6. Conclusão da Validação

**A Sprint UX.1 (Agendamento) NÃO pode ser apenas integração entre módulos existentes** — existem gaps estruturais que impedem o fluxo completo:

1. **ServiceOrderItem precisa suportar produtos** para que o PDV possa adicionar itens de estoque à OS
2. **ServiceOrderItem precisa de desconto por item** para alinhar com SaleItem
3. **Relação Sale ↔ Coupon** é necessária para aplicar cupons
4. **ServiceOrder ↔ Sale** precisam de algum mecanismo de unificação ou relação clara
5. **Appointment → Sale** precisa de FK direta se a venda for referenciada do agendamento

**Recomendação:** Antes de implementar a Sprint UX.1, é necessário decidir se:

- **Opção A (simples):** Unificar ServiceOrder e Sale em um único modelo (Sale passa a ser a OS)
- **Opção B (estrutural):** Adicionar os relacionamentos faltantes e expandir ServiceOrderItem para produtos
- **Opção C (mínima):** Criar apenas os relacionamentos mínimos (ServiceOrder + produtos, FK Sale↔Coupon) e postergar unificação

A decisão impacta diretamente o escopo da Sprint UX.1 e deve ser tomada antes de iniciar a implementação.
