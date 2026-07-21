# Sprint 003 — Unidade (Unit)

## Objetivo

Criar a estrutura de unidades físicas da empresa.

Uma empresa pode ter:

1 unidade (barbearia única)
várias unidades (rede/franquia)

A unidade será a base operacional para:

agenda;
profissionais;
estoque;
caixa;
relatórios;
configurações locais.

---

# Arquitetura

Company
   │
   │ 1:N
   │
 Unit

Exemplo:

Empresa:
Barbearia Premium LTDA

Unidades:
├── Centro
├── Shopping Norte
└── Zona Sul

---

# Modelo

Unit

id
companyId

name
code (único dentro da empresa)

document
phone
email

address
number
complement
neighborhood
city
state
zipCode

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

Toda unidade pertence obrigatoriamente a uma empresa.

## RN002

Uma empresa pode possuir várias unidades.

## RN003

O código da unidade deve ser único dentro da empresa.

Exemplo:

Empresa A
- CENTRO ✅
- SHOPPING ✅

Empresa B
- CENTRO ✅

## RN004

Dados operacionais futuros devem possuir vínculo com unidade quando necessário.

Exemplo:

Agenda → Unit

Caixa → Unit

Estoque → Unit

## RN005

Exclusão será lógica.

---

# Critérios de Aceite

- Criar unidade.
- Editar unidade.
- Ativar/inativar unidade.
- Listar unidades da empresa.
- Impedir código duplicado dentro da mesma empresa.
