# Sprint 004 — Clientes (Customer)

## Objetivo

Criar o cadastro central de clientes da barbearia.

O cliente será utilizado futuramente em:

Agenda;
Atendimento;
Comandas;
Histórico de serviços;
Fidelidade;
Financeiro;
Relatórios.

---

# Arquitetura

Company
   │
   │ 1:N
   │
 Customer

A empresa é dona dos seus clientes.

Exemplo:

Barbearia A
 ├── João
 ├── Pedro

Barbearia B
 ├── João

Clientes podem ter o mesmo nome em empresas diferentes.

---

# Modelo

Customer

id
companyId

name
email
phone
document
birthDate

notes

status

createdAt
updatedAt
deletedAt

createdBy
updatedBy
deletedBy

---

# Regras de Negócio

## RN001

Todo cliente pertence obrigatoriamente a uma empresa.

## RN002

Um cliente pode possuir histórico de múltiplos atendimentos.

## RN003

O telefone deve ser armazenado para contato e busca.

## RN004

O documento (CPF) quando informado deve ser único dentro da empresa.

Exemplo:

Empresa A
CPF 111.111.111-11 ✅

Empresa B
CPF 111.111.111-11 ✅

## RN005

Clientes não serão excluídos fisicamente.

Usar:

deletedAt

## RN006

O cadastro deve permitir clientes sem CPF.

Motivo:

Muitos clientes de barbearia não informam documento.

---

# Critérios de Aceite

- Criar cliente.
- Editar cliente.
- Inativar cliente.
- Buscar cliente por nome.
- Buscar cliente por telefone.
- Impedir CPF duplicado na mesma empresa.
