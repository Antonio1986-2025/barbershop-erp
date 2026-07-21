# Sprint 007 — Agenda (Appointment)

## Objetivo

Criar o sistema de agendamento de atendimentos.

A agenda será responsável por organizar:

clientes;
profissionais;
serviços;
unidades;
horários;
status do atendimento.

---

# Arquitetura

Unit
 │
 │
Appointment
 │
 ├── Customer
 │
 ├── Professional
 │
 └── Service

---

# Modelo

Appointment

id

companyId
unitId

customerId
professionalId
serviceId

startAt
endAt

status

notes

createdAt
updatedAt
deletedAt

createdBy
updatedBy
deletedBy

---

# Status

SCHEDULED
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELED
NO_SHOW

---

# Regras de Negócio

## RN001

Todo agendamento pertence a uma empresa e uma unidade.

## RN002

Um agendamento deve possuir:

cliente;
profissional;
serviço;
horário.

## RN003

O horário final deve ser calculado usando:

startAt + durationMinutes

do serviço.

## RN004

Não permitir conflito de horário do profissional.

Exemplo:

João

10:00 - Corte

Não pode:

10:30 - Barba

## RN005

Cancelamentos mantêm histórico.

Não apagar agendamento.

## RN006

Agendamentos finalizados poderão gerar:

atendimento;
comissão;
financeiro.

---

# Critérios de Aceite

- Criar agendamento.
- Alterar horário.
- Confirmar atendimento.
- Cancelar.
- Finalizar.
- Consultar agenda por:
  - unidade;
  - profissional;
  - dia.
