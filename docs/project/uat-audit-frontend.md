# Auditoria de Frontend — UAT.1

Data: 23/07/2026  
Objetivo: Verificar se todos os módulos do backend possuem interface frontend correspondente.

---

## Legenda

| Status | Significado |
|--------|------------|
| **Completo** | Possui página, menu, lib de API e CRUD funcional |
| **Parcial** | Possui página ou rota, mas incompleta (ex: falta create/edit, link quebrado) |
| **Ausente** | Não possui página, menu nem lib de API |
| **Integrado** | Funcionalidade embutida em outra tela (ex: permissões via formulário de usuário) |

---

## Tabela de Auditoria

| # | Módulo | Backend | Frontend | Rota(s) | Status | Observações |
|---|--------|---------|----------|---------|--------|-------------|
| 1 | **Login** | OK | Completo | `/login` | ✅ Funcional | Loga com token JWT, refresh, logout. Testado e funcionando |
| 2 | **Dashboard** | OK | Completo | `/dashboard` | ✅ Funcional | 14 gráficos/indicadores, cards, rankings, alertas. Consome 14 endpoints do dashboard |
| 3 | **Empresas** | OK | Completo | `/empresas`, `/empresas/novo`, `/empresas/[id]` | ✅ Funcional | CRUD completo com list/search/edit/delete |
| 4 | **Unidades** | OK | Completo | `/unidades`, `/unidades/novo`, `/unidades/[id]` | ✅ Funcional | CRUD completo |
| 5 | **Usuários** | OK | Completo | `/usuarios`, `/usuarios/novo`, `/usuarios/[id]` | ✅ Funcional | CRUD completo. Carrega roles da API para o formulário |
| 6 | **Permissões/Roles** | OK | Integrado | (via formulário de usuários) | ⚠️ Parcial | Roles são carregadas inline nos forms de usuário. **Não há tela dedicada de gerenciamento de permissões** |
| 7 | **Clientes** | OK | Completo | `/clientes`, `/clientes/novo`, `/clientes/[id]` | ✅ Funcional | CRUD completo com busca, paginação |
| 8 | **Fornecedores** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/suppliers` completo. Sem tela, sem menu, sem lib |
| 9 | **Produtos** | OK | Completo | `/produtos`, `/produtos/novo`, `/produtos/[id]` | ✅ Funcional | CRUD completo |
| 10 | **Categorias** | OK | Completo | `/categorias`, `/categorias/novo`, `/categorias/[id]` | ✅ Funcional | CRUD completo |
| 11 | **Serviços** | OK | Completo | `/servicos`, `/servicos/novo`, `/servicos/[id]` | ✅ Funcional | CRUD completo |
| 12 | **Profissionais** | OK | Completo | `/profissionais`, `/profissionais/novo`, `/profissionais/[id]` | ✅ Funcional | CRUD completo |
| 13 | **Agenda (horários/bloqueios)** | OK | Completo | `/agenda` | ✅ Funcional | Gestão de horários de funcionamento e bloqueios. Consome `/api/schedule/*` |
| 14 | **Agendamentos** | OK | Parcial | `/agendamentos` | ⚠️ Parcial | Listagem, cancelar, reagendar, status funcionam. **Botão "Novo Agendamento" redireciona para `/agendamentos/novo` que não existe (404)** |
| 15 | **Estoque** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/stock/*`, `/api/stock/dashboard`, `/api/stock/reports`. Sem tela, sem menu, sem lib |
| 16 | **Compras** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/purchases` completo. Sem tela, sem menu, sem lib |
| 17 | **Transferências** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/stock/transfers` completo. Sem tela, sem menu, sem lib |
| 18 | **Inventário** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/stock/inventory` completo. Sem tela, sem menu, sem lib |
| 19 | **Alertas de Estoque** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/stock/alerts` completo. Sem tela, sem menu, sem lib |
| 20 | **Relatórios de Estoque** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/stock/reports/*` (kardex, turnover, valuation). Sem tela, sem menu, sem lib |
| 21 | **PDV / Vendas** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/sales`, `/api/sales/dashboard`, `/api/payments`. **NENHUMA tela de PDV ou vendas** |
| 22 | **Caixa** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/cash` (open/close/supply/withdraw/history). Sem tela, sem menu, sem lib |
| 23 | **Financeiro (Contas)** | OK | Completo | `/financeiro/contas` | ✅ Funcional | CRUD contas a pagar/receber, pagar, cancelar, categorias, fluxo de caixa |
| 24 | **Financeiro (Categorias)** | OK | Completo | `/financeiro/categorias` | ✅ Funcional | CRUD categorias financeiras |
| 25 | **Financeiro (Fluxo Caixa)** | OK | Completo | `/financeiro/fluxo-caixa` | ✅ Funcional | Relatório de fluxo de caixa por período |
| 26 | **Financeiro (Fechamento)** | OK | Completo | `/financeiro/fechamento` | ✅ Funcional | Fechamento de caixa (nota: usa `cashRegisterId` mas não há tela de caixa para criar registros) |
| 27 | **CRM** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/crm`, `/api/crm/dashboard`, segmentos. Sem tela, sem menu, sem lib |
| 28 | **Campanhas** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/crm/campaigns` completo. Sem tela, sem menu, sem lib |
| 29 | **Conversas WhatsApp** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/conversations` completo (CRUD + mensagens + tags + notas + atribuição). Sem tela, sem menu, sem lib |
| 30 | **Cupons** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/coupons` completo (CRUD + validate + apply). Sem tela, sem menu, sem lib |
| 31 | **Cashback** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/cashback`. Sem tela, sem menu, sem lib |
| 32 | **Loyalty/Fidelidade** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/loyalty` (config + balance + history). Sem tela, sem menu, sem lib |
| 33 | **Integrações/Webhooks** | OK | Ausente | — | ❌ Ausente | Backend tem `/api/integrations/webhooks`. Sem tela, sem menu, sem lib |
| 34 | **Configurações** | OK | Completo | `/configuracoes` | ✅ Funcional | Formulário completo de configurações da empresa: identidade visual, preferências, atendimento |
| 35 | **Auditoria** | OK | Completo | `/auditoria` | ✅ Funcional | Tabela de logs de auditoria com busca e filtros |
| 36 | **Notificações** | OK | Completo | `/notificacoes` | ✅ Funcional | Lista de notificações com filtros, badge de não lidas |
| 37 | **Status** | OK | Completo | `/status` | ✅ Funcional | Health check do backend |

---

## Problemas Identificados

### 1. Link quebrado — Novo Agendamento
- **Rota:** `/agendamentos/novo`
- **Problema:** Botão "Novo Agendamento" na página `/agendamentos` redireciona para rota que **não existe**.
- **Impacto:** Usuário não consegue criar agendamentos pelo frontend.

### 2. Módulos sem interface (17 ausentes)
Estes módulos têm backend 100% implementado mas **zero** interface frontend:
- Fornecedores
- Estoque (Dashboard, Movimentações, Alertas, Relatórios)
- Compras
- Transferências
- Inventário
- PDV / Vendas
- Caixa
- CRM (Segmentos, Dashboard, Interações, Tarefas)
- Campanhas
- Conversas WhatsApp
- Cupons
- Cashback
- Loyalty/Fidelidade
- Integrações/Webhooks
- Permissões (tela dedicada)

### 3. Financeiro/Fechamento depende de Caixa
- A página de fechamento pede `cashRegisterId` mas **não há tela de Caixa** para criar registros de caixa.

---

## Resumo

| Categoria | Quantidade |
|-----------|-----------|
| **Módulos completos** | 19 |
| **Módulos parciais** | 2 (Permissões, Agendamentos) |
| **Módulos ausentes** | 17 |
| **Total de módulos auditados** | 37 |

### Próximos passos sugeridos (UAT)

1. **Prioridade crítica:** Criar página PDV/Vendas + Caixa (core do negócio)
2. **Prioridade alta:** Criar páginas de Estoque (dashboard, alertas, movimentações)
3. **Prioridade média:** Fornecedores, Compras, Transferências, Inventário
4. **Prioridade baixa:** CRM, Campanhas, Conversas, Cupons, Cashback, Loyalty, Integrações
5. **Bug fix:** Criar rota `/agendamentos/novo` ou remover botão quebrado
