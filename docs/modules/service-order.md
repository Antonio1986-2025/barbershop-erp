# Sprint 008 — Service Order (Atendimento)

## Objetivo

Criar o registro do atendimento realizado.

Separação oficial:

Appointment = agendamento
ServiceOrder = atendimento executado

Um agendamento pode gerar um atendimento.

---

# Arquitetura

Appointment
      │
      │ 1:1
      │
ServiceOrder
      │
      ├── Customer
      ├── Professional
      ├── Unit
      └── ServiceOrderItem

---

# Modelos

## ServiceOrder

id
companyId
unitId
appointmentId

customerId
professionalId

status

startedAt
finishedAt

subtotal
discount
total

notes

createdAt
updatedAt
deletedAt

createdBy
updatedBy
deletedBy

## ServiceOrderItem

id
serviceOrderId
serviceId

quantity

unitPrice
totalPrice

createdAt
updatedAt

---

# Status

OPEN
IN_PROGRESS
COMPLETED
CANCELED

---

# Regras de Negócio

## RN001

Atendimento pertence a uma empresa e unidade.

## RN002

Atendimento concluído não deve ser alterado livremente.

## RN003

Valores devem ser congelados no atendimento.

Exemplo:

Serviço hoje: Corte R$60
Amanhã: Corte R$70
O histórico antigo continua: Corte R$60

## RN004

Um atendimento gera base para:

pagamento;
comissão;
histórico do cliente.

---

# Critérios de Aceite

- Criar atendimento.
- Vincular agendamento.
- Adicionar serviços.
- Calcular total.
- Finalizar atendimento.
- Manter histórico.
