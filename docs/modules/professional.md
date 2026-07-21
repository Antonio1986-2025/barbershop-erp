# Sprint 005 — Professional

## Objetivo

Criar o cadastro dos profissionais que executam os serviços da barbearia.

O profissional será usado futuramente em:

Agenda;
Atendimento;
Comissão;
Produtividade;
Relatórios;
Avaliações.

---

# Arquitetura

Company
   │
   │ 1:N
   │
Professional
   │
   │ N:N
   │
Unit

Um profissional pode trabalhar em uma ou várias unidades.

Exemplo:

Empresa:
Barbearia Premium

Profissional:
João

Unidades:
├── Centro
└── Shopping

---

# Modelos

## Professional

id
companyId

name
email
phone
document

specialty
commissionRate

status

createdAt
updatedAt
deletedAt

createdBy
updatedBy
deletedBy

## ProfessionalUnit

id

professionalId
unitId

active

createdAt
updatedAt

---

# Regras de Negócio

## RN001

Todo profissional pertence a uma empresa.

## RN002

Um profissional pode atuar em várias unidades.

## RN003

Uma unidade pode possuir vários profissionais.

## RN004

Comissão deve ser configurável.

Exemplo:

João
Comissão padrão: 40%

## RN005

Profissionais não serão removidos fisicamente.

## RN006

Um profissional inativo não pode receber novos agendamentos.

---

# Critérios de Aceite

- Criar profissional.
- Associar profissional a unidades.
- Remover associação com unidade.
- Configurar comissão.
- Ativar/inativar profissional.
