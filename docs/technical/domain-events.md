# Domain Events — v1

Catálogo oficial de eventos de domínio do sistema.

Nenhum módulo deve publicar eventos com nomes diferentes dos listados aqui. Novos eventos devem ser adicionados a este documento antes de serem implementados.

---

## CRM

| Evento | Disparo | Payload esperado |
|---|---|---|
| `CustomerCreated` | Novo cliente cadastrado | `{ customerId, companyId, name }` |
| `CustomerUpdated` | Dados do cliente alterados | `{ customerId, companyId, changedFields[] }` |
| `CustomerBirthday` | Aniversário do cliente (diário) | `{ customerId, companyId, name }` |
| `CustomerInactive` | Cliente sem compras há X dias | `{ customerId, companyId, daysSinceLastPurchase }` |
| `CustomerReachedVip` | Cliente atingiu score VIP | `{ customerId, companyId, score }` |
| `CustomerLostVip` | Cliente perdeu status VIP | `{ customerId, companyId, score }` |

## Agenda

| Evento | Disparo | Payload esperado |
|---|---|---|
| `AppointmentCreated` | Agendamento criado | `{ appointmentId, customerId, professionalId, startAt }` |
| `AppointmentConfirmed` | Agendamento confirmado | `{ appointmentId, customerId, startAt }` |
| `AppointmentCancelled` | Agendamento cancelado | `{ appointmentId, customerId, reason }` |
| `AppointmentCompleted` | Atendimento concluído | `{ appointmentId, customerId, serviceId }` |
| `AppointmentNoShow` | Cliente não compareceu | `{ appointmentId, customerId }` |

## PDV

| Evento | Disparo | Payload esperado |
|---|---|---|
| `SaleCreated` | Venda criada (DRAFT) | `{ saleId, companyId, unitId, total }` |
| `SaleOpened` | Venda aberta para pagamento | `{ saleId, companyId, total }` |
| `SalePaid` | Venda paga e concluída | `{ saleId, companyId, customerId?, total, paymentMethod }` |
| `SaleCancelled` | Venda cancelada | `{ saleId, companyId, reason }` |
| `SaleRefunded` | Venda reembolsada | `{ saleId, companyId, total, reason }` |

## Financeiro

| Evento | Disparo | Payload esperado |
|---|---|---|
| `PaymentReceived` | Pagamento confirmado | `{ paymentId, saleId, amount, method }` |
| `PaymentCancelled` | Pagamento cancelado | `{ paymentId, saleId, amount }` |
| `CashOpened` | Caixa aberto | `{ cashRegisterId, unitId, openingAmount }` |
| `CashClosed` | Caixa fechado | `{ cashRegisterId, unitId, closingAmount, difference }` |

## Estoque

| Evento | Disparo | Payload esperado |
|---|---|---|
| `StockLow` | Estoque abaixo do mínimo | `{ productId, unitId, quantity, minStock }` |
| `StockZero` | Estoque zerado | `{ productId, unitId }` |
| `StockNegative` | Estoque negativo | `{ productId, unitId, quantity }` |
| `StockAdjusted` | Ajuste manual de estoque | `{ productId, unitId, quantity, reason }` |
| `TransferCompleted` | Transferência concluída | `{ transferId, productId, fromUnitId, toUnitId, quantity }` |

## CRM Operacional

| Evento | Disparo | Payload esperado |
|---|---|---|
| `TaskCreated` | Nova tarefa | `{ taskId, customerId, assignedTo, type, dueDate }` |
| `TaskCompleted` | Tarefa concluída | `{ taskId, customerId, completedBy }` |
| `TaskOverdue` | Tarefa venceu | `{ taskId, customerId, assignedTo, daysOverdue }` |
| `InteractionCreated` | Nova interação registrada | `{ interactionId, customerId, type, subject }` |

## Campanhas

| Evento | Disparo | Payload esperado |
|---|---|---|
| `CampaignCreated` | Campanha criada | `{ campaignId, name, type, segmentId? }` |
| `CampaignScheduled` | Campanha agendada | `{ campaignId, scheduledAt }` |
| `CampaignStarted` | Campanha iniciou envio | `{ campaignId, totalRecipients }` |
| `CampaignFinished` | Campanha concluída | `{ campaignId, sentCount, deliveredCount, failedCount }` |

## WhatsApp / Conversas

| Evento | Disparo | Payload esperado |
|---|---|---|
| `ConversationCreated` | Nova conversa iniciada | `{ conversationId, companyId, customerId, channel, customerName }` |
| `ConversationMessageReceived` | Mensagem recebida do cliente | `{ conversationId, messageId, customerId, content, timestamp }` |
| `ConversationAssigned` | Conversa atribuída a um agente | `{ conversationId, assignedToId, assignedBy }` |
| `ConversationClosed` | Conversa encerrada | `{ conversationId, customerId, duration, messageCount }` |
| `ConversationPriorityChanged` | Prioridade alterada | `{ conversationId, oldPriority, newPriority, changedBy }` |
| `FirstResponseSent` | Primeira resposta humana enviada | `{ conversationId, responseTimeMs, agentId }` |

**Uso previsto:**
- `AutomationService` — notificar não atendimento, escalar urgência
- `IA Agent` — contexto para respostas automáticas (Sprint futura)
- `Dashboard` — métricas SLA, tempo médio, fila
- `Webhooks externos` — integração com sistemas de terceiros
- `Auditoria` — rastreabilidade completa do atendimento

## Fidelização

| Evento | Disparo | Payload esperado |
|---|---|---|
| `CashbackGranted` | Cashback gerado | `{ customerId, saleId, amount }` |
| `CashbackUsed` | Cashback resgatado | `{ customerId, saleId, amount }` |
| `LoyaltyPointsGranted` | Pontos creditados | `{ customerId, saleId, points }` |
| `LoyaltyPointsRedeemed` | Pontos resgatados | `{ customerId, saleId, points }` |
| `CouponExpiring` | Cupom próximo do vencimento | `{ couponId, code, expiresAt, companyId }` |

---

## Arquitetura do Event Bus

```
Controller
     │
     ▼
 Service
     │
     ├── lógica de negócio
     ├── auditoria
     └── eventBus.publish('SalePaid', payload)
              │
              ▼
      AutomationService
              │
              ├── cria tarefa (Follow-up)
              ├── cria notificação
              ├── registra interação
              ├── agenda ação futura
              └── (Sprint 020)
                     ├── Evolution API
                     ├── E-mail
                     ├── SMS
                     └── Push
```

### Implementação (Sprint 019.4)

O EventBus inicial pode ser um service simples injetado:

```typescript
@Injectable()
export class EventBus {
  private handlers = new Map<string, DomainEventHandler[]>();

  on(event: string, handler: DomainEventHandler) { ... }
  async publish(event: string, payload: any) { ... }
}
```

Ou, para manter a simplicidade nesta sprint, o próprio `AutomationService` pode ser chamado diretamente pelos serviços que publicam eventos, seguindo o mesmo padrão de injeção já utilizado (StockMovementService, NotificationsService, etc.).

A migração para um EventBus real (BullMQ, RabbitMQ) na Sprint 020 não exige alteração nas regras de negócio — apenas na forma como os eventos são roteados.

---

## Critério de Aceite

Este documento serve como catálogo de referência. Novos eventos só devem ser adicionados após aprovação e registro aqui. Eventos obsoletos devem ser marcados como `deprecated` neste mesmo arquivo.
