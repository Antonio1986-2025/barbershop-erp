# Sprint BARBER.2 — Domínio de Comissão

**Data:** 26/07/2026
**Status:** 📋 ARQUITETURA (pré-implementação)
**Baseline:** v1.0.2 (`6778890`)

---

## 1. Fluxo Completo

```
Agendamento (Appointment)
     │
     ▼
Atendimento (Appointment.COMPLETED)
     │
     ▼
Comanda (ServiceOrder) ← items: services + products
     │
     ▼
Venda (Sale) ← vinculada a ServiceOrder
     │
     ▼
Pagamento (Payment) ← PAID / PARTIAL / PENDING
     │
     ▼
┌─────────────────────────────────────────────┐
│         COMISSÃO (Commission)                │
│  Calculada quando: Payment.status = PAID     │
│  Recalculada quando: estorno / cancelamento  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
Fechamento (CommissionClosing)
     │
     ▼
Financeiro (FinancialAccount)
```

---

## 2. Pontos de Cálculo da Comissão

Existem 5 momentos onde a comissão pode ser calculada:

| Ponto | Gatilho | Vantagem | Desvantagem |
|-------|---------|----------|-------------|
| **A. Na conclusão do atendimento** | `Appointment.status → COMPLETED` | Imediato, independente de venda | Pode não refletir itens/produtos reais |
| **B. Na criação da ServiceOrder** | `ServiceOrder.created` | Preciso, todos os itens conhecidos | Pode não virar venda |
| **C. Na criação da venda (Sale.DRAFT)** | `Sale.created` | Vinculado a ServiceOrder | Venda pode não ser paga |
| **D. No pagamento (Sale.PAID)** | `Payment.status → PAID` | **✅ RECOMENDADO** | Só quando efetivamente recebido |
| **E. No fechamento de caixa** | `CashClosing.created` | Agrega tudo do período | Muito tarde, difícil rastrear |

**Decisão arquitetural:** O cálculo da comissão será disparado **no momento do pagamento** (ponto D), quando o `Payment.status` torna-se `PAID`. Isso garante que comissão só é gerada sobre valores efetivamente recebidos.

---

## 3. Eventos da Comissão

### 3.1 Disparo do cálculo

```
Evento: Payment.status = PAID (qualquer valor, inclusive parcial)
Ação:  Disparar cálculo de comissão para o profissional vinculado
       à ServiceOrder da Sale
       
Regra: Se já existir comissão para esta Sale+Professional, 
       recalcular (atualizar valor) em vez de duplicar
```

### 3.2 Cancelamento da comissão

```
Evento: Sale.status = CANCELLED
        OU Payment.status = REFUNDED
Ação:  Commission.status = CANCELLED
       (não deletar, manter histórico)
```

### 3.3 Recalculo

```
Evento: Alteração de itens na ServiceOrder (antes do pagamento)
        OU pagamento adicional (parcial → total)
Ação:  Recalcular comissão com base no valor total atualizado
```

### 3.4 Estorno

```
Evento: Sale.refundedAt preenchido
Ação:  Commission.status = REFUNDED
       Commission.refundedAt = now()
       Se já foi pago ao barbeiro: criar CommissionAdjustment negativo
```

### 3.5 Cancelamento da venda

```
Evento: Sale.cancelledAt preenchido
Ação:  Commission.status = CANCELLED
       Commission.cancelledAt = now()
       Se já foi pago ao barbeiro: criar CommissionAdjustment negativo
```

### 3.6 Pagamento parcial

```
Evento: Payment criado com amount < Sale.total
Ação:  Commission.amount = valor proporcional ao pagamento
       Ex: Sale R$100, commissionRate 40%, pagamento R$60
       Commission.calculatedValue = R$60 × 40% = R$24
       (em vez de R$100 × 40% = R$40)
```

### 3.7 Pagamento posterior

```
Evento: Pagamento complementar (Sale já tinha pagamento parcial)
Ação:  Recalcular Commission com base no total recebido até o momento
       Commission.calculatedValue = totalRecebido × taxa
```

### 3.8 Alteração de profissional

```
Evento: ServiceOrder.professionalId alterado
Ação:  Commission.professionalId = novo profissional
       Se já existir comissão para o antigo: cancellar e criar nova
```

---

## 4. Modelos de Comissão

### 4.1 Percentual por serviço

```
Professional.commissionRate = 40
Serviço R$100 → Comissão = R$40
```

### 4.2 Percentual por produto

```
Professional.commissionProductRate = 10
Produto R$50 → Comissão = R$5
```

### 4.3 Valor fixo

```
Service.commissionType = 'FIXED'
Service.commissionValue = 15
Serviço R$100 → Comissão = R$15 (ignora percentual do profissional)
```

### 4.4 Valor por categoria

```
Category.commissionType = 'PERCENTAGE'
Category.commissionValue = 30
Todo serviço da categoria "Corte" → 30%
```

### 4.5 Valor por profissional

```
Professional.commissionRate = 50 (sobrescreve regra geral)
Professional.commissionProductRate = 15
```

### 4.6 Valor por empresa

```
Company.defaultCommissionRate = 35
Company.defaultCommissionProductRate = 5
Aplicado quando Professional não tem taxa definida
```

### 4.7 Comissão somente quando pago

```
Payment.status deve ser PAID para gerar comissão.
Regra padrão → não precisa de configuração extra.
```

### 4.8 Comissão no atendimento

```
Alternativa ao pagamento: calcular no COMPLETED.
Ex: barbearia que não usa venda no sistema.
```

### 4.9 Comissão no fechamento

```
Alternativa: calcular apenas no fechamento do caixa,
agregando todas as vendas do período.
```

### 4.10 Comissão por unidade

```
Unit.commissionRate? (se existir, sobrescreve Company)
Ex: Unidade "Matriz" → 40%, Unidade "Filial" → 35%
```

### 4.11 Comissão diferente por barbeiro

```
Cada Professional tem seu próprio commissionRate e commissionProductRate.
```

### 4.12 Comissão diferente por serviço

```
Service.commissionType = 'PERCENTAGE' | 'FIXED'
Service.commissionValue = 30 (percentual) ou 20 (fixo)
```

### 4.13 Comissão diferente por produto

```
Product.commissionType? (se implementado no futuro)
Product.commissionValue?
```

### 4.14 Comissão zero

```
Service.commissionType = 'NONE' → comissão 0
Professional.commissionRate = 0 → sem comissão para serviços
Professional.commissionProductRate = 0 → sem comissão para produtos
```

### 4.15 Produtos sem comissão

```
Regra global: se commissionProductRate = null ou 0 → sem comissão em produtos
Por produto: Product.commissionExempt = true (futuro)
```

---

## 5. Levantamento do Banco (O QUE JÁ EXISTE)

### Já existe no schema:

| Campo | Modelo | Uso Atual |
|-------|--------|-----------|
| `commissionRate` `Decimal?` | `Professional` | Percentual sobre serviços (40 = 40%) |
| `commissionProductRate` `Decimal?` | `Professional` | Percentual sobre produtos |
| `commissionType` `String?` | `Service` | Tipo: 'PERCENTAGE' / 'FIXED' / 'NONE' |
| `commissionValue` `Decimal?` | `Service` | Valor ou percentual do serviço |

### NÃO existe (precisa criar):

| Item | Modelo | Descrição |
|------|--------|-----------|
| `Commission` | **NOVO** | Registro de comissão calculada |
| `CommissionItem` | **NOVO** | Detalhamento por item |
| `CommissionClosing` | **NOVO** | Fechamento/ pagamento de comissões |
| `CommissionAdjustment` | **NOVO** | Ajuste (estorno, correção) |
| `Company.defaultCommissionRate` | Company | Taxa padrão da empresa |
| `Unit.commissionRate` | Unit | Taxa por unidade |
| `Category.commissionType` | Category | Comissão por categoria |

### Relacionamentos:

| De | Para | Existe? |
|----|------|:-------:|
| Commission → Sale | FK `saleId` | ❌ |
| Commission → Professional | FK `professionalId` | ❌ |
| Commission → Payment | FK `paymentId` | ❌ |
| Commission → ServiceOrder | FK `serviceOrderId` | ❌ |
| Commission → Company | FK `companyId` | ❌ |
| CommissionItem → Commission | FK `commissionId` | ❌ |
| CommissionItem → ServiceOrderItem | FK `serviceOrderItemId` | ❌ |
| CommissionClosing → Company | FK `companyId` | ❌ |
| CommissionClosing → FinancialAccount | FK `financialAccountId` | ❌ |

---

## 6. Pontos do Código que Precisarão Ser Alterados

### 6.1 Backend — Controllers

| Arquivo | Alteração |
|---------|-----------|
| **NOVO** `commission.controller.ts` | CRUD de comissões, fechamento, relatórios |
| `sale/sale-payment.service.ts` | Disparar cálculo de comissão após pagamento PAID |
| `sale/sale.controller.ts` | Disparar cancelamento de comissão |
| `professional/professional.controller.ts` | Retornar taxas de comissão |
| `service/service.controller.ts` | Retornar commissionType/Value |

### 6.2 Backend — Services

| Arquivo | Alteração |
|---------|-----------|
| **NOVO** `commission.service.ts` | Lógica principal: calcular, cancelar, estornar, fechar |
| `sale-payment.service.ts` | Hook pós-pagamento → commissionService.calculate() |
| `sale.service.ts` | Hook cancelamento → commissionService.cancel() |
| `service-order.service.ts` | Hook alteração profissional → commissionService.reassign() |

### 6.3 Backend — DTOs

| Arquivo | Alteração |
|---------|-----------|
| **NOVO** `commission.dto.ts` | Create, Update, Filter, Calculate, Close |
| **NOVO** `commission-closing.dto.ts` | Fechamento de comissões |

### 6.4 Prisma Schema

| Modelo | Alteração |
|--------|-----------|
| **NOVO** `Commission` | Tabela principal |
| **NOVO** `CommissionItem` | Itens da comissão |
| **NOVO** `CommissionClosing` | Fechamento |
| **NOVO** `CommissionAdjustment` | Ajustes |
| `Company` | +`defaultCommissionRate`, `defaultCommissionProductRate` |
| `Service` | Já tem commissionType e commissionValue ✅ |
| `Professional` | Já tem commissionRate e commissionProductRate ✅ |

### 6.5 Frontend

| Tela | Alteração |
|------|-----------|
| `(authenticated)/comissoes/page.tsx` | **NOVO** - Listagem de comissões |
| `(authenticated)/comissoes/[id]/page.tsx` | **NOVO** - Detalhe da comissão |
| `(authenticated)/profissionais/[id]/page.tsx` | + Campos de taxa de comissão |
| `(authenticated)/servicos/[id]/page.tsx` | + Campos commissionType/Value |
| `(authenticated)/financeiro/contas/page.tsx` | + Vínculo com CommissionClosing |
| `sidebar.tsx` | + Link para Comissões (admin/manager) |

### 6.6 Permissões

| Permissão | Quem pode |
|-----------|-----------|
| `commission.view` | ADMIN, MANAGER, BARBER (apenas próprias) |
| `commission.approve` | ADMIN, MANAGER |
| `commission.pay` | ADMIN, MANAGER |
| `commission.config` | ADMIN |

### 6.7 Seed

| Alteração | Descrição |
|-----------|-----------|
| `seed.ts` | + commissionRate/commissionProductRate nos profissionais |
| `seed.ts` | + commissionType/commissionValue nos serviços |
| `seed.ts` | + Algumas comissões de exemplo |

### 6.8 Testes

| Teste | Descrição |
|-------|-----------|
| `commission.service.spec.ts` | Cálculo, percentual, fixo, cancelamento, estorno |
| `commission.controller.spec.ts` | CRUD, permissões, validações |

### 6.9 Documentação

| Documento | Alteração |
|-----------|-----------|
| `admin-guide.md` | + Capítulo de Comissões |
| `user-guide.md` | + Seção do barbeiro sobre comissão |
| `faq.md` | + Perguntas sobre comissão |
| `glossary.md` | + Termos: Commission, Closing, Adjustment |

---

## 7. Arquitetura Recomendada

### 7.1 Estrutura de Pastas

```
backend/src/modules/commission/
├── commission.module.ts
├── commission.controller.ts
├── commission.service.ts
├── commission-closing.controller.ts
├── commission-closing.service.ts
├── dto/
│   ├── create-commission.dto.ts
│   ├── update-commission.dto.ts
│   ├── filter-commission.dto.ts
│   ├── create-closing.dto.ts
│   └── approve-closing.dto.ts
```

### 7.2 Fluxo de Dados

```
ServiceOrder.PAID
       │
       ▼
sale-payment.service.ts
       │
       ├──→ commissionService.calculate(saleId, paymentId)
       │        │
       │        ├── 1. Buscar ServiceOrder da Sale
       │        ├── 2. Buscar Professional vinculado
       │        ├── 3. Buscar regras (Company → Unit → Professional → Service)
       │        ├── 4. Calcular por item (serviço e produto)
       │        ├── 5. Persistir Commission + CommissionItem
       │        └── 6. Retornar comissão calculada
       │
       └──→ Se já existir commission: recalcular
```

### 7.3 Regra de Resolução de Taxa (Priority Chain)

```
1. Service.commissionType = 'NONE'         → comissão = 0
2. Service.commissionType = 'FIXED'        → commissionValue = valor fixo
3. Service.commissionType = 'PERCENTAGE'   → commissionValue = percentual
4. Professional.commissionRate             → percentual do profissional
5. Unit.commissionRate                     → percentual da unidade
6. Company.defaultCommissionRate           → percentual padrão da empresa
7. Se nada definido                        → comissão = 0
```

### 7.4 Modelo de Dados (Prisma)

```prisma
enum CommissionStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
  REFUNDED
}

enum CommissionType {
  PERCENTAGE
  FIXED
  NONE
}

model Commission {
  id String @id @default(uuid())

  companyId      String
  unitId         String
  saleId         String?
  serviceOrderId String?
  professionalId String

  totalServiceAmount Decimal? @db.Decimal(10, 2)
  totalProductAmount Decimal? @db.Decimal(10, 2)
  commissionAmount   Decimal  @db.Decimal(10, 2)

  rateApplied  Decimal? @db.Decimal(5, 2)
  rateType     CommissionType?

  status CommissionStatus @default(PENDING)

  approvedAt DateTime?
  approvedBy String?
  paidAt     DateTime?
  paidBy     String?

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company      Company      @relation(fields: [companyId], references: [id])
  unit         Unit         @relation(fields: [unitId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])
  sale         Sale?        @relation(fields: [saleId], references: [id])
  serviceOrder ServiceOrder? @relation(fields: [serviceOrderId], references: [id])

  items      CommissionItem[]
  adjustments CommissionAdjustment[]
  closingId  String?
  closing    CommissionClosing? @relation(fields: [closingId], references: [id])

  @@index([companyId])
  @@index([professionalId])
  @@index([status])
  @@index([createdAt])
  @@map("commissions")
}

model CommissionItem {
  id String @id @default(uuid())

  commissionId String
  serviceOrderItemId String?

  itemType  String  // 'SERVICE' | 'PRODUCT'
  itemName  String
  quantity  Int

  itemAmount    Decimal @db.Decimal(10, 2)
  rate          Decimal @db.Decimal(5, 2)
  commissionAmount Decimal @db.Decimal(10, 2)

  commission Commission @relation(fields: [commissionId], references: [id])

  @@index([commissionId])
  @@map("commission_items")
}

model CommissionClosing {
  id String @id @default(uuid())

  companyId String
  unitId    String

  periodStart DateTime
  periodEnd   DateTime

  totalCommission Decimal @db.Decimal(10, 2)
  totalPaid       Decimal @default(0) @db.Decimal(10, 2)
  totalPending    Decimal @default(0) @db.Decimal(10, 2)

  status CommissionStatus @default(PENDING)

  approvedAt DateTime?
  approvedBy String?
  paidAt     DateTime?
  paidBy     String?

  financialAccountId String?
  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])
  unit    Unit    @relation(fields: [unitId], references: [id])

  commissions Commission[]

  @@index([companyId])
  @@index([status])
  @@map("commission_closings")
}

model CommissionAdjustment {
  id String @id @default(uuid())

  commissionId String

  previousAmount Decimal @db.Decimal(10, 2)
  newAmount      Decimal @db.Decimal(10, 2)
  difference     Decimal @db.Decimal(10, 2)
  reason         String

  createdAt DateTime @default(now())
  createdBy String

  commission Commission @relation(fields: [commissionId], references: [id])

  @@map("commission_adjustments")
}
```

---

## 8. Complexidade, Impacto e Riscos

### Complexidade: 🔴 Alta

| Área | Complexidade | Motivo |
|------|:------------:|--------|
| Modelagem de dados | 🟡 Média | 4 novas tabelas, 2 enums, 3 alterações em tabelas existentes |
| Lógica de cálculo | 🔴 Alta | Resolução de taxa em cadeia, múltiplos tipos, múltiplos gatilhos |
| Reversão/Estorno | 🔴 Alta | Estorno de venda → estorno de comissão; pagamento parcial → recalcular |
| Frontend | 🟡 Média | 3 novas páginas, formulários de configuração |
| Permissões | 🟢 Baixa | 4 novas permissões |
| Seed | 🟢 Baixa | Dados de exemplo |
| Testes | 🟡 Média | Cobertura de todos os cenários de cálculo |

### Impacto: Alto

| Módulo | Impacto |
|--------|---------|
| Sale | Hook pós-pagamento (chamar commissionService.calculate) |
| ServiceOrder | Hook de alteração de profissional |
| Professional | Taxas já existentes, ajuste fino |
| Service | commissionType/commissionValue já existentes |
| Payment | Gatilho para cálculo |
| Cash/Financial | Recebimento de comissão como despesa |

### Dependências

| Depende de | Para quê |
|------------|----------|
| Sprint BARBER.1 | User ↔ Professional vinculado (✅ concluído) |
| Module: Sale | Comissão é calculada sobre valores de venda |
| Module: Payment | Gatilho do cálculo é payment.status = PAID |
| Module: ServiceOrder | Itens (serviço/produto) para cálculo detalhado |
| Module: Professional | Taxas de comissão por profissional |
| Module: Service | CommissionType/CommissionValue (já existente) |

### Riscos

| Risco | Probabilidade | Mitigação |
|-------|:-------------:|-----------|
| Cálculo incorreto em pagamento parcial | Média | Testes exaustivos com valores fracionados |
| Estorno de venda sem estorno de comissão | Baixa | Hook obrigatório no cancelamento |
| Performance em relatórios de comissão | Baixa | Indexar por companyId + professionalId + status |
| Duplicidade de comissão (recalcular sem critério) | Média | Usar upsert: atualizar se existir |

---

## 9. Plano em Sprints

### Sprint 1: Base de Dados + Cálculo (15h)

| Tarefa | Estimativa |
|--------|:----------:|
| Schema Prisma: Commission, CommissionItem, CommissionClosing, CommissionAdjustment | 2h |
| Migração + seed | 1h |
| CommissionModule + CommissionController | 1h |
| CommissionService.calculate() — lógica principal | 4h |
| CommissionService.cancel() — estorno | 2h |
| Integração com SalePaymentService (hook pós-pagamento) | 2h |
| Integração com SaleService (hook cancelamento) | 1h |
| Testes de cálculo (percentual, fixo, zero, parcial) | 2h |

### Sprint 2: Frontend + Aprovação (12h)

| Tarefa | Estimativa |
|--------|:----------:|
| Página de listagem de comissões (admin/manager) | 3h |
| Página de detalhe da comissão | 2h |
| Página de fechamento (CommissionClosing) | 3h |
| Página do barbeiro visualizar próprias comissões | 2h |
| Permissões + sidebar | 1h |
| Testes de frontend | 1h |

### Sprint 3: Ajustes Finos + Relatórios (8h)

| Tarefa | Estimativa |
|--------|:----------:|
| Comissão por categoria | 1h |
| Comissão por unidade (CompanyRate + UnitRate) | 2h |
| Alteração de profissional na ServiceOrder | 1h |
| Relatório de comissão por período | 2h |
| Exportação de relatório | 1h |
| Testes de regressão | 1h |

### Total Estimado: 35h (~2 semanas)

---

## 10. Resumo da Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                 MÓDULO DE COMISSÃO (v1.1)                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Eventos:                                                    │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐                │
│  │ Sale     │   │ Payment  │   │Service    │                │
│  │.PAID     │──▶│.PAID     │──▶│Order.edit │                │
│  └──────────┘   └──────────┘   └───────────┘                │
│       │              │              │                        │
│       ▼              ▼              ▼                        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              CommissionService                       │    │
│  │                                                      │    │
│  │  1. Buscar regras (Company→Unit→Prof→Service→Product)│    │
│  │  2. Calcular taxa (priority chain: NONE→FIXED→%→...) │    │
│  │  3. Aplicar sobre valor do item                      │    │
│  │  4. Persistir Commission + CommissionItem            │    │
│  │  5. Se já existe: recalcular (upsert)                │    │
│  └──────────────────────────────────────────────────────┘    │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              CommissionClosing                       │    │
│  │  Aprovação → Pagamento → Financeiro                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Modelos:
┌──────────┐   ┌───────────────┐   ┌───────────────────┐
│Commission│──▶│ CommissionItem│   │CommissionClosing  │
├──────────┤   ├───────────────┤   ├───────────────────┤
│saleId    │   │itemType       │   │periodStart/End    │
│professional│  │itemAmount     │   │totalCommission    │
│rateApplied │  │rate           │   │status             │
│commissionAmt│ │commissionAmt  │   │approvedAt/paidAt  │
│status      │   └───────────────┘   └───────────────────┘
│closingId   │                              │
└──────────┘   ┌──────────────────────┐     │
               │CommissionAdjustment  │◄────┘
               ├──────────────────────┤
               │previousAmount        │
               │newAmount             │
               │reason: estorno/canc  │
               └──────────────────────┘
```

---

*Documento gerado em 26/07/2026 — Arquitetura de Comissão Sprint BARBER.2*
