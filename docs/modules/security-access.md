# Sprint 002 — Segurança e Acesso

## Objetivo

Criar a base de autenticação, usuários, perfis e permissões do Barbershop ERP.

Este módulo será responsável por controlar quem pode acessar o sistema e quais ações cada usuário pode executar.

---

# Escopo

Modelos:

- User
- Role
- Permission
- UserRole
- RolePermission

---

# Arquitetura

```
Company

   │
   │ 1:N

 User

   │
   │ N:N

 Role

   │
   │ N:N

 Permission
```

---

# Regras de Negócio

## Usuários

RN001

Todo usuário deve estar vinculado a uma empresa.

RN002

Um usuário pode possuir um ou mais perfis.

RN003

Usuários podem ser ativados ou desativados.

RN004

Senhas nunca devem ser armazenadas em texto puro.

RN005

Usuários de uma empresa nunca podem acessar dados de outra empresa.

---

# Perfis (Role)

Perfis iniciais:

- SUPER_ADMIN
- COMPANY_ADMIN
- MANAGER
- BARBER
- RECEPTIONIST
- CASHIER

Novos perfis poderão ser criados futuramente.

---

# Permissões (Permission)

Modelo baseado em ação.

Exemplos:

## Clientes

- CUSTOMER_CREATE
- CUSTOMER_READ
- CUSTOMER_UPDATE
- CUSTOMER_DELETE

## Caixa

- CASH_OPEN
- CASH_CLOSE
- CASH_VIEW

## Estoque

- STOCK_CREATE
- STOCK_ENTRY
- STOCK_EXIT

---

# Modelo de Permissões

As permissões serão armazenadas no banco.

Não serão fixadas no código.

Objetivos:

- flexibilidade;
- novos cargos;
- customização por empresa;
- evolução sem alteração estrutural.

---

# Segurança

Requisitos:

- Senhas utilizando hash seguro.
- Controle de sessão.
- Autorização por permissão.
- Auditoria de ações importantes.

---

# Critérios de Aceite

## Usuários

- Criar usuário.
- Editar usuário.
- Ativar/inativar usuário.
- Vincular usuário à empresa.

## Perfis

- Criar perfil.
- Associar permissões.
- Associar perfil ao usuário.

## Permissões

- Criar permissões.
- Validar acesso por permissão.

---

# Fora do Escopo

Não será desenvolvido nesta Sprint:

- Login social.
- Autenticação por dois fatores.
- Integrações externas.

Esses recursos serão avaliados futuramente.
