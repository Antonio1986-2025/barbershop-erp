# Estado do Projeto

## Visão Geral

**Fase atual:** Finalização para UAT/Homologação
**Sprints concluídas:** 001 a 019
**Meta atual:** Fazer o sistema rodar 100% nas funções principais antes de novos módulos

## Status Técnico

### Backend

| Indicador | Valor |
|---|---|
| Framework | NestJS 11 |
| Módulos | 32 |
| Modelos Prisma | 62 |
| Testes unitários | 381 (todos passando) |
| Compilação | Ok |

### Frontend

| Indicador | Valor |
|---|---|
| Framework | Next.js 16 |
| Páginas | ~50 |
| Compilação | Ok |
| Testes E2E | 2 (passando) |
| Telas completas | 19 |
| Telas parciais | 2 |
| Telas sem implementação | ~17 |

### Infraestrutura

| Indicador | Valor |
|---|---|
| Docker completo | Sim (PostgreSQL + Backend + Frontend + Seed) |
| CI/CD | GitHub Actions |
| Observabilidade | Health checks + Logging + Request ID |

## Módulos do Backend

```
backend/src/modules/
├── appointment/       # Agendamentos
├── audit/             # Auditoria
├── auth/              # Autenticação JWT + RBAC
├── automation/        # Automações
├── cache/             # Cache in-memory
├── campaign/          # Campanhas CRM
├── cash/              # Caixa PDV
├── cashback/          # Cashback
├── category/          # Categorias
├── company/           # Empresas
├── company-settings/  # Configurações
├── conversations/     # Conversas (WhatsApp)
├── coupon/            # Cupons
├── crm/               # CRM
├── customer/          # Clientes
├── dashboard/         # Dashboard
├── financial/         # Financeiro
├── integrations/      # Integrações (MercadoPago, Evolution, etc.)
├── interaction/       # Interações CRM
├── loyalty/           # Fidelidade
├── notifications/     # Notificações
├── observability/     # Health / Logs
├── product/           # Produtos
├── professional/      # Profissionais
├── role/              # Papéis e permissões
├── sale/              # Vendas PDV
├── schedule/          # Horários e bloqueios
├── service/           # Serviços
├── stock/             # Estoque completo
├── task/              # Tarefas CRM
├── unit/              # Unidades
└── user/              # Usuários
```

## Próximos Passos (UAT)

1. **PDV + Caixa** — Tela de vendas e controle de caixa
2. **Estoque operacional** — Movimentações, inventário, alertas
3. **Compras + Fornecedores** — Tela de compras e cadastro de fornecedores
4. **Agenda completa** — Interface de agenda com arrastar/soltar
5. **CRM** — Perfil do cliente, segmentos, campanhas
6. **Integrações** — Configuração de webhooks e provedores
7. **Refinamento UX** — Mobile first, responsividade, acessibilidade

## Pendências Conhecidas

- [ ] Telas de PDV, caixa, estoque, compras e fornecedores (altíssima prioridade)
- [ ] Playwright com webServer apenas em CI (dev usa start-dev.bat)
- [ ] Documentação de arquitetura atualizada com contagem real de módulos/modelos
- [ ] Testes E2E expandidos para cobrir fluxos principais
