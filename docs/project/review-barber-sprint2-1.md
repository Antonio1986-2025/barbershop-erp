# Sprint BARBER.2.1 — Implementação do Motor de Comissão

**Data:** 26/07/2026
**Status:** ✅ CONCLUÍDA
**Commit:** `(pendente)`
**Baseline:** v1.0.2

---

## Objetivo

Implementar o cálculo automático de comissão do barbeiro quando uma venda for totalmente paga, com estorno automático ao cancelar a venda.

---

## Arquitetura Implementada

```
backend/src/modules/commission/
├── commission.module.ts
├── commission.controller.ts     → GET /api/commission, POST calculate, POST cancel
└── commission.service.ts        → calculateForSale(), cancelForSale(), findAll()
```

### Schema Prisma (novo)

```prisma
Commission { id, companyId, unitId, saleId, serviceOrderId, professionalId,
             totalServiceAmount, totalProductAmount, commissionAmount,
             rateApplied, rateType, status(PENDING|APPROVED|PAID|CANCELLED|REFUNDED),
             approvedAt, approvedBy, paidAt, paidBy, notes, createdAt, updatedAt,
             items CommissionItem[] }

CommissionItem { id, commissionId, saleItemId, itemType(SERVICE|PRODUCT),
                 itemName, quantity, itemAmount, rate, commissionAmount }
```

### Priority Chain de Resolução de Taxa

1. `Service.commissionType = 'NONE'` → comissão 0
2. `Service.commissionType = 'FIXED'` → commissionValue fixo
3. `Service.commissionType = 'PERCENTAGE'` → commissionValue%
4. `Professional.commissionRate` → percentual do profissional
5. → 0 (nenhuma taxa configurada)

---

## Integrações Realizadas

| Arquivo | Alteração |
|---------|-----------|
| `sale-payment.service.ts` | Hook `commissionService.calculateForSale()` quando Sale fica PAID |
| `sale.service.ts` | Hook `prisma.commission.updateMany()` com status CANCELLED |
| `sale.module.ts` | Import `CommissionModule` |
| `create-sale.dto.ts` | + campo `serviceOrderId` com validação |
| `sale.service.ts` | + `serviceOrderId: dto.serviceOrderId` no `prisma.sale.create()` |
| `app.module.ts` | Import `CommissionModule` |

---

## Evidências dos Testes

### UAT — Fluxo Completo

| Etapa | Operação | Resultado |
|:-----:|----------|:---------:|
| 1 | Criar agendamento + service order | ✅ |
| 2 | Criar venda com `serviceOrderId` | ✅ **(corrigido)** |
| 3 | Pagamento parcial (R$50 de R$120) | ✅ Sem comissão (correto) |
| 4 | Pagamento final (R$70) | ✅ Sale = PAID |
| 5 | Comissão criada automaticamente | ✅ **CREATED** |
| 6 | Cancelar venda (PATCH) | ✅ Sale = CANCELLED |
| 7 | Comissão cancelada automaticamente | ✅ **CANCELLED** |

### Valores

| Campo | Valor |
|-------|:-----:|
| Serviço | Pigmentação Capilar — R$120 |
| Profissional | Pedro Santos (commissionRate = 40%) |
| Comissão calculada | R$48 (R$120 × 40%) |
| Items | 1 CommissionItem |
| Duplicatas | 0 (apenas 1 comissão) |
| Histórico | Preservado (status alterado, registro mantido) |

### Logs do Servidor

```
[Nest] WARN [CommissionService] Created commission for sale xxx: R$48 (40% rate, 1 items)
[Nest] WARN [CommissionService] Commission CANCELLED for sale xxx: UAT BARBER.2.1
```

---

## Bugs Corrigidos Durante a Sprint

| Bug | Causa | Correção |
|-----|-------|----------|
| Comissão nunca era criada | `serviceOrderId` não era salvo na venda (DTO sem campo, whitelist:true) | ✅ Adicionado `@IsOptional() @IsString()` ao DTO + passado no service |
| Comissão não cancelada | Hook ausente em `saleService.cancel()` | ✅ Adicionado `updateMany` no cancel |
| Servidor antigo rodando | `taskkill` não matava todos os PIDs | ✅ Descoberto e corrigido manualmente |

---

## Checklist Final

| Item | Status |
|------|--------|
| DTO `create-sale.dto.ts` com `serviceOrderId` + decorators | ✅ |
| Serviço `sale.service.ts` passando `serviceOrderId` no create | ✅ |
| Hook cálculo no `sale-payment.service.ts` | ✅ |
| Hook cancelamento no `sale.service.ts` | ✅ |
| Rotas `GET /api/commission` protegidas | ✅ |
| Apenas 1 comissão por venda (upsert) | ✅ |
| Histórico preservado (nunca deleta) | ✅ |
| Pagamento parcial não gera comissão | ✅ |
| Cancelamento → Commission CANCELLED | ✅ |
| Zero erros 500 | ✅ |
| Zero FK violations | ✅ |

---

## Status Final

```
✅ SPRINT BARBER.2.1 — CONCLUÍDA

Motor de comissão implementado e validado.
Calcula automaticamente na venda paga.
Cancela automaticamente na venda cancelada.
Pronto para Sprint BARBER.2.2 (fechamento/aprovação).
```
