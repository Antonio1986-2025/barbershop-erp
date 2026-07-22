# Barbershop ERP

![CI/CD](https://github.com/Antonio1986-2025/barbershop-erp/actions/workflows/ci.yml/badge.svg?branch=main)
![Testes](https://github.com/Antonio1986-2025/barbershop-erp/actions/workflows/ci.yml/badge.svg?branch=main&label=testes)
![Cobertura](https://img.shields.io/badge/cobertura-%3E%3D80%25-brightgreen)

Sistema de gestão para barbearias.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js + TypeScript |
| Backend | NestJS + TypeScript |
| Banco | PostgreSQL |
| ORM | Prisma |
| Deploy | Railway |

## Pipeline CI/CD

O workflow `.github/workflows/ci.yml` executa automaticamente em **push** e **pull_request** para as branches `main` e `develop`:

### Backend
- `npm ci` — instalação limpa de dependências
- `prisma generate` — geração do Prisma Client
- `prisma db push` + `seed` — provisionamento do banco de testes
- `tsc --noEmit` — verificação de tipos TypeScript
- `eslint` — verificação de lint
- `nest build` — compilação
- `jest` — testes unitários (185)
- `jest --config jest-e2e.json` — testes de integração (112)
- `jest --coverage` — cobertura mínima **80%** (statements, branches, functions, lines)

### Frontend
- `npm ci` — instalação limpa de dependências
- `tsc --noEmit` — verificação de tipos TypeScript
- `eslint` — verificação de lint
- `next build` — compilação
- `playwright test` — testes end-to-end

### Artefatos publicados
- Relatório de cobertura (HTML)
- Resultados de testes (em caso de falha)
