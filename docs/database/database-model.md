# Modelo Conceitual do Banco de Dados

## Objetivo

Este documento define toda a estrutura conceitual do banco de dados do Barbershop ERP.

Ele servirá como referência para:

- Prisma
- PostgreSQL
- Migrations
- Backend
- APIs

Nenhuma tabela deverá ser criada antes de estar documentada aqui.

---

# Camada 1 — Plataforma (SaaS)

## Plan

Representa os planos disponíveis.

Campos principais:

- id
- name
- code
- price
- billingCycle
- active
- createdAt
- updatedAt

---

## Company

Representa uma empresa cliente.

Campos:

- id
- planId
- corporateName
- tradeName
- document
- email
- phone
- active
- createdAt
- updatedAt
- deletedAt

Relacionamentos:

- pertence a Plan
- possui Units
- possui Users
- possui Customers
- possui Professionals
- possui Services
- possui Products
- possui Suppliers
- possui Appointments
- possui Orders
- possui CashRegisters
- possui FinancialEntries

---

## CompanySettings

Configurações da empresa.

Exemplos:

- horário padrão
- moeda
- fuso horário
- intervalo entre atendimentos
- permitir encaixe
- dias de funcionamento

Relacionamento:

1:1 com Company

---

# Camada 2 — Operação

## Unit

Representa uma unidade física.

Pertence a Company.

---

## User

Acesso ao sistema.

---

## Role

Perfis.

---

## Permission

Permissões.

---

# Camada 3 — Atendimento

Customer

Professional

Service

Appointment

Order (Comanda)

---

# Camada 4 — Financeiro

CashRegister

Payment

FinancialEntry

Commission

---

# Camada 5 — Estoque

Product

Supplier

Purchase

PurchaseItem

InventoryMovement

StockBalance

---

# Camada 6 — Auditoria

AuditLog

---

# Regras Gerais

- Todas as tabelas operacionais possuem `companyId`.
- Quando aplicável, também possuem `unitId`.
- Exclusão lógica com `deletedAt`.
- Histórico nunca é alterado.
- Auditoria obrigatória.
- Datas em UTC.
- Chaves primárias em UUID.
