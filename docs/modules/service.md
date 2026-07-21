# Sprint 006 — Service (Serviços)

## Objetivo

Criar o catálogo de serviços oferecidos pela barbearia.

Serviço será utilizado em:

Agenda;
Atendimento;
Comanda;
Caixa;
Comissão;
Relatórios.

---

# Arquitetura

Company
   │
   │ 1:N
   │
Service

Cada empresa possui seus próprios serviços.

Exemplo:

Barbearia A

- Corte Masculino
- Barba
- Combo Corte + Barba

Barbearia B

- Corte Premium
- Navalhado

---

# Modelo

Service

id
companyId

name
description

durationMinutes
price

commissionType
commissionValue

status

createdAt
updatedAt
deletedAt

createdBy
updatedBy
deletedBy

---

# Decisões

## Duração

Campo:

durationMinutes

Exemplo:

Corte = 45 minutos
Barba = 30 minutos

Preparado para agenda.

## Preço

Inicialmente:

price

Preço padrão do serviço.

Futuro:

Poderemos criar histórico de preços.

## Comissão

Preparado para regras futuras:

Exemplo:

Corte
Preço: R$60

Comissão: 40%

---

# Regras de Negócio

## RN001

Todo serviço pertence a uma empresa.

## RN002

Serviços podem ser ativados ou desativados.

## RN003

Serviço inativo não aparece para novos agendamentos.

## RN004

Preço deve ser maior que zero.

## RN005

Serviços não serão removidos fisicamente.

---

# Critérios de Aceite

- Criar serviço.
- Editar serviço.
- Alterar preço.
- Definir duração.
- Ativar/inativar serviço.
- Listar serviços ativos.
