# Sprint 019 — CRM (Relacionamento com Clientes)

## Objetivo

Criar o módulo de relacionamento com clientes do ERP.

Responsável por:
- perfil 360° do cliente com dados consolidados;
- segmentação dinâmica para campanhas;
- campanhas de comunicação (WhatsApp, e-mail, SMS);
- interações e histórico de relacionamento;
- etiquetas livres (tags);
- tarefas vinculadas ao cliente;
- indicadores de relacionamento.

---

## Arquitetura

```
Customer
   │
   ├── CustomerProfile    (visão 360°, computada)
   ├── CustomerSegment    (regras de segmentação)
   ├── CustomerTag        (etiquetas livres)
   ├── CustomerInteraction (histórico)
   ├── CustomerTask       (tarefas)
   └── Campaign
          └── CampaignRecipient (envios)
```

### Consumo de dados (leitura)

```
CustomerProfile
   ├── Sale           → total gasto, ticket médio, frequência, LTV
   ├── Appointment    → último atendimento
   ├── CashbackTransaction → saldo de cashback
   ├── LoyaltyPoints  → pontuação de fidelidade
   └── AuditLog       → histórico de ações
```

---

## Modelos Conceituais

### CustomerProfile

Visão 360° do cliente. **Não é uma tabela** — é computada em tempo de consulta.

```
customerId

── Financeiro ──
totalSpent             total acumulado de vendas PAID
averageTicket          totalSpent / totalPurchases
highestPurchase        maior valor de venda única
totalPurchases         quantidade de vendas com produto
totalServices          quantidade de vendas com serviço

── Agenda ──
totalAppointments      total de agendamentos
completedAppointments  agendamentos concluídos
cancelledAppointments  agendamentos cancelados
cancellationRate       cancelledAppointments / totalAppointments
lastAppointment        data e serviço do último atendimento
nextAppointment        data e serviço do próximo agendamento

── Fidelização ──
loyaltyPoints          saldo de pontos de fidelidade
cashbackBalance        saldo de cashback disponível
customerSince          data da primeira compra
daysSinceLastPurchase  dias desde a última compra
daysSinceLastAppointment dias desde o último atendimento

── Relacionamento ──
customerScore          score calculado 0-100
relationshipStatus     NOVO | ATIVO | INATIVO | RISCO | PERDIDO
currentSegments[]      segmentos atuais do cliente
tags[]                 etiquetas atribuídas
firstPurchaseAt
lastPurchaseAt
```

### CustomerSegment

Segmento definido por regras.

```
id
companyId
name
description
rules            JSON com regras de segmentação
color            cor para identificação visual

active

customerCount    (atualizado periodicamente ou computado)

createdAt
updatedAt
```

**Exemplos de regras (rules):**

```json
// VIP: mais de R$ 5.000 em compras nos últimos 12 meses
{ "type": "totalSpent", "operator": "gte", "value": 5000, "periodDays": 365 }

// Inativo: sem compras há mais de 90 dias
{ "type": "daysSinceLastPurchase", "operator": "gt", "value": 90 }

// Aniversariante: mês do aniversário é o atual
{ "type": "birthMonth", "value": "current" }
```

### Campaign

Campanha de relacionamento.

```
id
companyId
name
description
type               WHATSAPP | EMAIL | SMS | PUSH | INTERNAL
status             DRAFT | SCHEDULED | SENDING | SENT | CANCELLED

messageTemplate    template da mensagem
scheduledAt        data de agendamento
sentAt             data de envio

segmentId?         segmento alvo (opcional — null = todos)
customerIds?       lista específica (opcional)

stats:
  totalRecipients
  sentCount
  deliveredCount
  failedCount
  readCount

createdBy
createdAt
updatedAt
```

### CampaignRecipient

Controle individual de envio.

```
id
campaignId
customerId
status                PENDING | SENT | DELIVERED | FAILED | READ
sentAt
deliveredAt
readAt
errorMessage
createdAt
```

### CustomerScore

Score calculado de 0 a 100 que representa o valor do cliente para o negócio.

**Não é armazenado em banco** — é computado dinamicamente no CustomerProfile.

**Composição sugerida:**

| Fator | Peso | Fonte |
|---|---|---|
| Frequência de compras | 25% | Sale (intervalo médio entre vendas) |
| Ticket médio | 20% | Sale (totalSpent / totalSales) |
| Valor total gasto | 20% | Sale (totalSpent) |
| Recência da última compra | 15% | Sale (dias desde última compra) |
| Índice de cancelamentos | 10% | Sale (canceladas / total) |
| Utilização de cashback | 5% | CashbackTransaction (used / granted) |
| Fidelidade (pontos) | 5% | LoyaltyPoints (saldo atual) |

**Faixas de classificação:**

| Score | Classificação |
|---|---|
| 80–100 | VIP |
| 60–79 | Ouro |
| 40–59 | Prata |
| 20–39 | Bronze |
| 0–19 | Novo / Inativo |

**Uso previsto:**
- ordenação de clientes para campanhas;
- priorização de tarefas;
- alimentação de BI e dashboards;
- base para modelos de IA (Sprint 021);
- recomendações automáticas.

---

### CustomerInteraction

Registro de interação com o cliente.

```
id
companyId
customerId
type              CALL | WHATSAPP | EMAIL | VISIT | NOTE | CAMPAIGN | SALE | APPOINTMENT
summary
details
metadata          JSON com dados extras
createdBy
createdAt
```

### CustomerTag

Etiqueta livre.

```
id
companyId
name
color
createdAt
```

### CustomerTagAssignment

Atribuição de etiqueta a cliente.

```
id
customerId
tagId
createdBy
createdAt
```

### CustomerTask

Tarefa vinculada ao cliente.

```
id
companyId
customerId
title
description
type              CALL | FOLLOW_UP | QUOTE | POST_SALE | RENEWAL | OTHER
status            PENDING | IN_PROGRESS | COMPLETED | CANCELLED
dueDate
assignedTo        userId
completedAt
completedBy
createdBy
createdAt
updatedAt
```

---

## Enums

### CampaignType

```
WHATSAPP
EMAIL
SMS
PUSH
INTERNAL
```

### CampaignStatus

```
DRAFT
SCHEDULED
SENDING
SENT
CANCELLED
```

### CampaignRecipientStatus

```
PENDING
SENT
DELIVERED
FAILED
READ
```

### InteractionType

```
CALL
WHATSAPP
EMAIL
VISIT
NOTE
CAMPAIGN
SALE
APPOINTMENT
```

### TaskType

```
CALL
FOLLOW_UP
QUOTE
POST_SALE
RENEWAL
OTHER
```

### TaskStatus

```
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
```

### CustomerRelationshipStatus

```
NEW
ACTIVE
INACTIVE
RISK
LOST
```

---

## Regras de Negócio

### RN001 — Perfil computado

CustomerProfile não possui tabela própria. Todos os indicadores são calculados em tempo real a partir de Sale, Appointment, LoyaltyPoints, CashbackTransaction e AuditLog.

### RN002 — Segmentação recalculável

Segmentos são definidos por regras JSON. A qualquer momento é possível recalcular quantos clientes pertencem a cada segmento.

### RN003 — Campanha não altera cliente

Campanhas apenas geram registros de envio (CampaignRecipient) e interações (CustomerInteraction). Nunca alteram dados do cliente.

### RN004 — Rastreabilidade

Todo envio de campanha gera um CampaignRecipient com status trackeável.

### RN005 — Interações imutáveis

CustomerInteraction jamais pode ser alterada ou apagada após criada.

### RN006 — Tarefa com responsável

Toda CustomerTask possui um assignedTo (usuário responsável).

### RN007 — Auditoria

Toda criação, atualização e cancelamento de campanhas, segmentos, tarefas e interações deve ser auditada via AuditService.

### RN008 — Notificações

Campanhas do tipo INTERNAL geram Notification no sistema. Os demais tipos (WHATSAPP, EMAIL, SMS) registram a intenção de envio para processamento futuro por adaptadores especializados.

### RN009 — Tags são autorais

Tags não possuem regras automáticas. São atribuídas manualmente por usuários.

### RN010 — Segmentação por data

Segmentos baseados em datas (ex: aniversariante, inativo) devem ser recalculados a cada consulta, pois dependem do momento atual.

---

## Invariantes

1. Nenhum dado operacional será duplicado.

2. O CRM apenas referencia dados existentes.

3. Toda interação deve ser auditada.

4. Segmentações devem ser recalculáveis.

5. Campanhas nunca alteram dados do cliente.

6. Histórico nunca pode ser apagado.

7. Toda tarefa possui responsável.

8. Todo envio possui rastreabilidade.

9. Perfil 360º deve ser calculável a qualquer momento.

10. Toda automação deve gerar auditoria.

---

## Fluxos

```
Cliente
   │
   ▼
 Perfil 360°
   │
   ├── Segmentação
   │        │
   │        ▼
   │     Campanha
   │        │
   │        ▼
   │     Interações
   │
   ├── Tags (atribuição manual)
   │
   └── Tarefas (ações do usuário)
              │
              ▼
        Indicadores de relacionamento
```

---

## Integrações

### Customer (módulo existente)

```
CustomerProfile.customerId    → Customer.id
CustomerProfile.firstPurchaseAt → Sale (primeira venda PAID)
CustomerProfile.lastSale       → Sale (última venda PAID)
CustomerProfile.lastAppointment → Appointment (último concluído)
```

### Sale (módulo PDV)

```
CustomerProfile.totalSpent   → SUM(Sale.total WHERE status=PAID)
CustomerProfile.totalSales   → COUNT(Sale WHERE status=PAID)
CustomerProfile.avgTicket    → totalSpent / totalSales
CustomerProfile.frequency    → média de dias entre vendas
CustomerProfile.ltv          → totalSpent (pode incluir margem futura)
```

### LoyaltyPoints (módulo fidelidade)

```
CustomerProfile.loyaltyPoints → SUM(points WHERE type=EARNED) - SUM(points WHERE type=REDEEMED)
```

### CashbackTransaction (módulo cashback)

```
CustomerProfile.cashbackAvailable → SUM(amount WHERE status=AVAILABLE)
CustomerProfile.cashbackUsed      → SUM(amount WHERE status=USED)
```

### Notifications (módulo notificações)

```
Campaign (tipo INTERNAL) → NotificationsService.create()
```

### Audit (módulo auditoria)

```
Toda operação relevante   → AuditService.create()
```

---

## Endpoints Planejados

### Perfil

```
GET /crm/profile/:customerId    → perfil 360° do cliente
```

### Segmentos

```
GET    /crm/segments             → listar segmentos
POST   /crm/segments             → criar segmento
PATCH  /crm/segments/:id         → atualizar regras
DELETE /crm/segments/:id         → remover segmento
GET    /crm/segments/:id/calculate → recalcular contagem do segmento
```

### Campanhas

```
GET    /crm/campaigns            → listar campanhas
POST   /crm/campaigns            → criar campanha
PATCH  /crm/campaigns/:id        → atualizar
DELETE /crm/campaigns/:id        → cancelar
POST   /crm/campaigns/:id/send   → disparar campanha
GET    /crm/campaigns/:id/recipients → ver status dos envios
```

### Interações

```
GET    /crm/interactions         → listar interações (filtro por cliente)
POST   /crm/interactions         → registrar interação
```

### Tags

```
GET    /crm/tags                 → listar tags da empresa
POST   /crm/tags                 → criar tag
DELETE /crm/tags/:id             → remover tag
POST   /crm/customers/:id/tags   → atribuir tag ao cliente
DELETE /crm/customers/:id/tags/:tagId → remover tag do cliente
```

### Tarefas

```
GET    /crm/tasks                → listar tarefas
POST   /crm/tasks                → criar tarefa
PATCH  /crm/tasks/:id            → atualizar / concluir
```

---

## Estrutura de Sub-sprints

| Sub-sprint | Objetivo |
|---|---|
| 019.0 | Modelagem do domínio (esta sprint) |
| 019.1 | Perfil 360° + Segmentação — CustomerProfile (computado), CustomerSegment, LTV, ticket médio, frequência, recência, CustomerScore |
| 019.2 | Campanhas — Campaign + CampaignRecipient |
| 019.3 | Interações + Tarefas — CustomerInteraction, CustomerTag, CustomerTask |
| 019.4 | Automações — regras de disparo, agendamento, integração com WhatsApp/E-mail/SMS |
| 019.5 | Dashboard CRM — indicadores de relacionamento |

---

## Critério de Aceite

Nenhuma implementação nesta etapa.

A Sprint 019.0 contém apenas:
- documentação do domínio CRM;
- modelo conceitual das entidades;
- enums e regras de negócio;
- invariantes e fluxos;
- integrações mapeadas;
- endpoints planejados;
- definição da arquitetura.
