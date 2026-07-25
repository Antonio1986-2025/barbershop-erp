# Sprint 018 — PDV (Ponto de Venda)

## Objetivo

Criar o módulo de vendas para o PDV da barbearia.

Responsável por:
- registrar vendas avulsas (sem agendamento);
- venda de produtos avulsos;
- venda de serviços avulsos;
- mix de produtos + serviços na mesma venda;
- baixa de estoque no ato da venda;
- cálculo de descontos e acréscimos;
- fechamento de vendas em aberto;
- integração com caixa, financeiro e estoque.

---

## Arquitetura

```
Sale
  │
  ├── SaleItem (1..N)
  │     ├── Product (opcional)
  │     └── Service (opcional)
  │
  ├── Payment (1..N)
  │     └── CashMovement
  │
  ├── Discount (opcional)
  ├── Coupon (opcional)
  └── Receipt (opcional)
```

### Ecossistema

```
Sale
  │
  ├── StockMovement (SALE) → StockModule
  ├── FinancialAccount → FinancialModule
  ├── CashTransaction → CashModule
  └── AuditLog → AuditModule
```

---

## Modelos Conceituais

### Sale

Representa uma venda no PDV.

```
id
companyId
unitId
customerId?        (opcional — venda pode ser anônima)

status              DRAFT | OPEN | PAID | CANCELLED | REFUNDED

subtotal            soma dos itens antes de descontos
discountAmount      valor total de descontos aplicados
total               valor final após descontos
paidAmount          valor efetivamente pago
changeAmount        troco (quando pagamento > total)

notes?

createdBy
updatedBy
cancelledBy
refundedBy

cancelledAt
refundedAt

createdAt
updatedAt
```

### SaleItem

Linha da venda.

```
id
saleId

productId?         (opcional — se for produto)
serviceId?         (opcional — se for serviço)

productName        snapshot no momento da venda
serviceName        snapshot no momento da venda

quantity
unitPrice          preço unitário no momento da venda
totalPrice         quantity × unitPrice
costPrice          custo no momento da venda (para margem)

createdAt
```

### Payment

Pagamento de uma venda.

```
id
saleId

amount
paymentMethod      CASH | PIX | CREDIT_CARD | DEBIT_CARD | STORE_CREDIT | GIFT_CARD
status             PENDING | AUTHORIZED | PAID | CANCELLED | REFUNDED

paidAt
refundedAt

gatewayTransactionId?   (futuro: integração com maquininha)
gatewayResponse?        (futuro)

createdAt
updatedAt
```

### Receipt

Comprovante da venda.

```
id
saleId

type                COUPON_NF | FISCAL_NF | SIMPLIFIED
number              número do comprovante
series?             série (quando aplicável)
issuedAt

metadata            JSON com dados completos para reimpressão

createdAt
```

### Discount

Desconto aplicado a uma venda.

```
id
saleId

type                PERCENTAGE | FIXED
value               percentual ou valor fixo
reason              motivo do desconto
grantedBy           usuário que autorizou

createdAt
```

### Coupon

Cupom promocional.

```
id
companyId

code                código do cupom
discountType        PERCENTAGE | FIXED
discountValue       valor do desconto
minPurchaseValue?   valor mínimo para uso
maxUses?            limite de usos
expiresAt           data de validade

active
usedCount

createdAt
updatedAt

saleId?             venda em que foi utilizado (relação 0..1)
```

### CashbackTransaction

Movimentação de cashback de uma venda.

```
id
saleId
customerId

amount              valor do cashback gerado
rate                percentual aplicado
status              PENDING | AVAILABLE | USED | EXPIRED

expiresAt           data de expiração
usedAt
usedInSaleId?       venda em que foi consumido

createdAt
```

---

## Enums

### SaleStatus

```
DRAFT         → rascunho, ainda não finalizada
OPEN          → aguardando pagamento
PAID          → paga e concluída
CANCELLED     → cancelada (estorna estoque + financeiro)
REFUNDED      → reembolsada (movimentações compensatórias)
```

### PaymentMethod

```
CASH          → dinheiro
PIX           → transferência instantânea
CREDIT_CARD   → cartão de crédito
DEBIT_CARD    → cartão de débito
STORE_CREDIT  → crédito interno na loja
GIFT_CARD     → vale-presente
```

### PaymentStatus

```
PENDING       → aguardando confirmação
AUTHORIZED    → autorizado pela maquininha/gateway
PAID          → confirmado
CANCELLED     → cancelado
REFUNDED      → estornado
```

### DiscountType

```
PERCENTAGE    → percentual sobre o subtotal
FIXED         → valor fixo em reais
```

### ReceiptType

```
COUPON_NF     → cupom não fiscal
SIMPLIFIED    → nota simplificada
FISCAL_NF     → nota fiscal (futuro)
```

### CashbackStatus

```
PENDING       → aguardando liberação
AVAILABLE     → disponível para uso
USED          → utilizado
EXPIRED       → expirado
```

---

## Regras de Negócio

### RN001 — Itens obrigatórios

Toda venda deve possuir pelo menos 1 item (`SaleItem`).

### RN002 — Escopo

Toda venda pertence a uma empresa (`companyId`) e a uma unidade (`unitId`).

### RN003 — Baixa de estoque

A venda somente baixa o estoque **após a confirmação do pagamento** (status `PAID`).
Cada produto na venda gera `StockMovement` do tipo `SALE` no `StockModule`.

### RN004 — Snapshot de preço

`SaleItem.unitPrice` e `SaleItem.costPrice` congelam os valores no momento da venda.
Alterações futuras no cadastro do produto não retroagem sobre vendas concluídas.

### RN005 — Integração financeira

Todo pagamento com status `PAID` gera movimentação financeira:
- `FinancialAccount` (contas a receber)
- `CashTransaction` (movimentação no caixa)
- Atualização do `CashRegister`

### RN006 — Cancelamento

Cancelamento de venda (`CANCELLED`) gera:
- estorno do estoque (`StockMovement` de entrada com referência à venda);
- estorno financeiro (conta a receber cancelada);
- reversão da movimentação no caixa.

### RN007 — Reembolso

Reembolso (`REFUNDED`) gera:
- movimentação compensatória no estoque;
- movimentação de saída no financeiro;
- nova transação no caixa (devolução).

### RN008 — Imutabilidade pós-finalização

Nenhuma venda com status `PAID`, `CANCELLED` ou `REFUNDED` pode ser alterada.

### RN009 — Estoque negativo

A baixa de estoque respeita a regra de `StockMovementService`:
se `skipNegativeCheck` não estiver setado, impede venda se saldo for insuficiente.

### RN010 — Descontos

Desconto não pode ultrapassar o subtotal da venda.
Descontos acima de um percentual configurável exigem autorização (futuro).

### RN011 — Cupons

Cupom só pode ser usado uma vez por venda.
Cupom deve estar ativo e dentro da validade.
`minPurchaseValue` deve ser respeitado.

### RN012 — Cashback

Cashback é calculado com base no total pago (após descontos).
Disponível para uso em vendas futuras após confirmação.

### RN013 — Auditoria

Toda transição de status deve ser auditada via `AuditService`:
- `CREATE` (criação da venda)
- `UPDATE` (adição de itens/pagamentos)
- `PAY` (confirmação de pagamento)
- `CANCEL` (cancelamento)
- `REFUND` (reembolso)

---

---

## Invariantes do PDV

1. Uma venda concluída nunca pode ser editada.

2. O preço do item é um snapshot e não acompanha alterações futuras do cadastro do produto.

3. Toda venda concluída gera movimentação de estoque.

4. Todo pagamento gera movimentação financeira.

5. Cancelamentos e reembolsos devem gerar movimentações compensatórias.

6. O total da venda deve ser igual à soma dos itens menos descontos mais acréscimos.

7. Nenhum pagamento pode exceder o saldo restante da venda.

8. Toda venda pertence a uma empresa e a uma unidade.

9. Toda operação relevante deve ser auditada.

10. O estoque nunca deve ser alterado diretamente pelo PDV, apenas através do StockMovementService.

---

## Fluxo

```
              ┌──────────┐
              │  DRAFT   │
              └────┬─────┘
                   │ adiciona itens
                   ↓
              ┌──────────┐
              │   OPEN   │
              └────┬─────┘
                   │ recebe pagamentos
                   ↓
              ┌──────────┐
              │   PAID   │  → baixa estoque (StockMovement SALE)
              └────┬─────┘    → gera mov. financeira
                   │          → gera receipt
                   ↓
              ┌─────────────┐
              │  COMPLETED  │
              └─────────────┘

           ┌──────────────────────┐
           ↓                      ↓
    ┌─────────────┐       ┌──────────────┐
    │  CANCELLED  │       │  REFUNDED    │
    └─────────────┘       └──────────────┘
    estorno estoque       compensação
    estorno financeiro    mov. financeira
    auditoria             auditoria
```

---

## Integrações

### Estoque (StockModule)

```
Sale.PAID
  → StockMovementService.recordMovement()
    → type: SALE
    → productId, unitId, quantity
    → referenceId: saleId
    → referenceType: 'sale'
```

### Financeiro (FinancialModule)

```
Sale.PAID
  → gera FinancialAccount (RECEIVABLE)
  → gera CashTransaction (ENTRY)
  → atualiza CashRegister
```

### Auditoria (AuditModule)

```
Sale.CREATE   → auditService.create({ action: 'CREATE' })
Sale.PAY      → auditService.create({ action: 'PAY' })
Sale.CANCEL   → auditService.create({ action: 'CANCEL' })
Sale.REFUND   → auditService.create({ action: 'REFUND' })
```

### Notificações (NotificationsModule)

```
Sale.PAID      → notificação "Venda concluída"
Sale.CANCELLED → notificação "Venda cancelada"
Sale.REFUNDED  → notificação "Estorno realizado"
```

---

## Endpoints Planejados

### Sales

```
POST   /sales                        → criar venda (DRAFT)
GET    /sales                        → listar vendas (paginado + filtros)
GET    /sales/:id                    → detalhe da venda
PATCH  /sales/:id                    → atualizar dados gerais
POST   /sales/:id/items              → adicionar item
DELETE /sales/:id/items/:itemId      → remover item
POST   /sales/:id/pay                → finalizar (OPEN → PAID)
POST   /sales/:id/cancel             → cancelar
POST   /sales/:id/refund             → reembolsar
```

### Payments

```
POST   /sales/:id/payments           → adicionar pagamento
DELETE /sales/:id/payments/:payId    → remover pagamento (se ainda PENDING)
```

### Cupons

```
POST   /coupons                      → criar cupom
GET    /coupons                      → listar cupons
GET    /coupons/:code                → validar cupom (para uso no PDV)
PATCH  /coupons/:id                  → atualizar
DELETE /coupons/:id                  → remover
POST   /sales/:id/coupon/:code       → aplicar cupom na venda
DELETE /sales/:id/coupon             → remover cupom da venda
```

### Cashback

```
GET    /customers/:id/cashback       → saldo de cashback do cliente
POST   /sales/:id/cashback/redeem    → utilizar cashback na venda
```

### Recibos

```
GET    /sales/:id/receipt            → gerar/imprimir recibo
```

---

## Estrutura de Sub-sprints

| Sub-sprint | Objetivo |
|---|---|
| 018.0 | Modelagem do domínio (esta sprint) |
| 018.1 | Vendas — Sale + SaleItem + CRUD |
| 018.2 | Pagamentos — Payment + fluxo de confirmação |
| 018.3 | Integração com Estoque — baixa automática no PAY |
| 018.4 | Integração com Financeiro — contas + caixa |
| 018.5 | Caixa PDV — interface e fluxo completo |
| 018.6 | Cupons, descontos e cashback |
| 018.7 | Dashboard de vendas |

---

## Critério de Aceite

Nenhuma implementação nesta etapa.

A Sprint 018.0 contém apenas:
- documentação do domínio;
- modelo conceitual das entidades;
- enums e regras de negócio;
- fluxo de status;
- integrações mapeadas;
- endpoints planejados;
- definição da arquitetura.
