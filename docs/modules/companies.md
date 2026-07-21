# Módulo 02 — Empresas (Multiempresa)

## Objetivo

Gerenciar as empresas clientes do ERP.

Cada empresa representa um cliente SaaS e possui seus próprios dados, usuários, unidades e configurações.

---

## Regras de Negócio

### RN001

Uma empresa possui um único plano ativo.

### RN002

Uma empresa pode possuir uma ou mais unidades, conforme o plano contratado.

### RN003

Nenhum dado operacional poderá existir sem vínculo com uma empresa.

### RN004

Todos os usuários pertencem a uma empresa.

### RN005

Uma empresa não pode visualizar dados de outra empresa.

### RN006

A exclusão será lógica (campo `deletedAt`).

### RN007

O sistema deverá registrar auditoria para criação, alteração e exclusão.

---

## Campos

- id
- name
- document
- email
- phone
- status
- planId
- createdAt
- updatedAt
- deletedAt

---

## API

GET /companies

GET /companies/:id

POST /companies

PATCH /companies/:id

DELETE /companies/:id

---

## Critérios de Aceite

- Criar empresa.
- Editar empresa.
- Inativar empresa.
- Listar empresas.
- Buscar empresa por ID.
- Validar CNPJ duplicado.
- Registrar auditoria.
