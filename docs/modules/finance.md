# Sprint 009 — Financeiro / Caixa

## Objetivo

Criar a base financeira operacional da barbearia.

Controlar:
- abertura e fechamento de caixa;
- entradas e saídas;
- recebimentos de atendimentos;
- formas de pagamento;
- histórico financeiro.

---

## Arquitetura

```
ServiceOrder
      │
      │ gera cobrança
      ↓
Payment
      │
      ↓
CashTransaction
      │
      ↓
CashRegister
```

---

## Modelos Conceituais

### CashRegister

Representa o caixa físico da unidade.

id
companyId
unitId

openedBy
closedBy

openedAt
closedAt

openingAmount
closingAmount

status

notes

createdAt
updatedAt

### Payment

Representa o pagamento realizado.

id
companyId
unitId

serviceOrderId

amount

paymentMethod

status

paidAt

createdAt
updatedAt

### CashTransaction

Movimentação financeira.

id
companyId
unitId

cashRegisterId

type

amount

description

paymentId

createdAt

---

## Enums

### CashRegisterStatus

OPEN
CLOSED

### PaymentMethod

CASH
CREDIT_CARD
DEBIT_CARD
PIX
TRANSFER
OTHER

### PaymentStatus

PENDING
PAID
CANCELED
REFUNDED

### CashTransactionType

ENTRY
EXIT

---

## Regras de Negócio

### RN001

Cada caixa pertence a uma unidade.

### RN002

Uma unidade pode possuir vários caixas ao longo do tempo.

Exemplo: Centro — Caixa Janeiro, Caixa Fevereiro, Caixa Março.

### RN003

Só pode existir um caixa aberto por unidade.

### RN004

Pagamento concluído gera entrada no caixa.

### RN005

Toda movimentação financeira deve possuir histórico.

### RN006

Valores financeiros nunca devem ser alterados após fechamento.

---

## Critérios de Aceite

- Abrir caixa.
- Registrar valor inicial.
- Registrar pagamento.
- Registrar entrada/saída manual.
- Fechar caixa.
- Consultar resumo do período.
