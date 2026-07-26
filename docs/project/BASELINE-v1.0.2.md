# BASELINE v1.0.2 — Referência Oficial do Projeto

**Versão:** 1.0.2  
**Data:** 26/07/2026  
**Commit:** `819638c`  
**Status:** ✅ CERTIFICADA PARA USO OPERACIONAL

---

## 1. Sobre esta Baseline

Este documento define o estado oficial do Barbershop ERP na versão 1.0.2. 
Toda evolução futura (v1.1 em diante) parte deste ponto.

---

## 2. Módulos Existentes

| Módulo | Diretório | Função |
|--------|-----------|--------|
| Auth | `auth/` | Login JWT, refresh, logout, roles, permissions |
| Agenda | `appointment/` | Agendamentos CRUD, status, conflito |
| Atendimento | (via appointment) | Ciclo: CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED |
| Auditoria | `audit/` | Log de todas as operações |
| Barber | `barber/` | Dashboard, agenda, comandas, vendas, perfil do barbeiro |
| Caixa | `cash/` | Abertura, suprimento, retirada, fechamento |
| Campanhas | `campaign/` | Campanhas de marketing |
| Categorias | `category/` | Categorias de produtos/serviços |
| Clientes | `customer/` | Cadastro, proteção duplicata, histórico |
| Compras | `purchase/`  | Ordem de compra |
| Configurações | `company-settings/` | Configurações da empresa |
| Conversas | `conversations/` | Conversas com clientes |
| CRM | `crm/` | Perfil, score, segmentos, cashback, loyalty |
| Cupons | `coupon/` | Cupons de desconto |
| Dashboard | `dashboard/` | Cards, gráficos, indicadores |
| Empresa | `company/` | Dados da empresa |
| Estoque | `stock/` | Movimentos, relatórios, kardex, valuation |
| Financeiro | `financial/` | Contas, categorias, movimentações |
| Fornecedores | `supplier/` | Cadastro de fornecedores |
| Integrações | `integrations/` | Gateways, webhooks |
| Interações | `interaction/` | Interações CRM |
| Notificações | `notifications/` | Notificações push, WebSocket |
| Observability | `observability/` | Métricas e monitoramento |
| Pagamentos | `payment/` | Pagamentos, split, métodos |
| PDV | (via sale) | Ponto de venda |
| Produtos | `product/` | Cadastro de produtos |
| Profissionais | `professional/` | Barbeiros e profissionais |
| RBAC | (via auth) | Roles, permissions, guards |
| Service Order | `service-order/` | Comanda de serviços |
| Serviços | `service/` | Catálogo de serviços |
| Tasks | `task/` | Tasks automáticas (follow-up, reminder) |
| Unidades | `unit/` | Filiais |
| Usuários | `user/` | Usuários do sistema |
| Vendas | `sale/` | Vendas, itens, descontos |

**Total: 30 módulos**

---

## 3. Fluxos Certificados

### 3.1 Fluxo Operacional (UAT v1.0.2 — 54/54 testes)

| # | Fluxo | Status |
|:-:|-------|:------:|
| 1 | Login ADMIN | ✅ |
| 2 | Dashboard (indicadores estruturados) | ✅ |
| 3 | Clientes — cadastro com proteção duplicata | ✅ |
| 4 | Agenda — criar, confirmar, iniciar, concluir | ✅ |
| 5 | Conflito de horário (mesmo profissional) | ✅ |
| 6 | Profissionais — cadastro e listagem | ✅ |
| 7 | Serviços — catálogo completo | ✅ |
| 8 | Produtos — cadastro e estoque | ✅ |
| 9 | Comanda (Service Order) — adicionar itens | ✅ |
| 10 | Venda — geração, desconto, pagamento | ✅ |
| 11 | Pagamento parcial e total | ✅ |
| 12 | Caixa — visualização e movimentação | ✅ |
| 13 | Financeiro — contas e categorias | ✅ |
| 14 | Estoque — movimentos e kardex | ✅ |
| 15 | CRM — perfil do cliente | ✅ |
| 16 | CRM — interações automáticas | ✅ |
| 17 | CRM — tasks (follow-up, reminder) | ✅ |
| 18 | Notificações — marcar como lida | ✅ |
| 19 | Auditoria — logs de operações | ✅ |
| 20 | Logout | ✅ |
| 21 | Perfil BARBER completo | ✅ |

### 3.2 Fluxo do Barbeiro (UAT Sprint BARBER.1 — 22/22 testes)

| # | Fluxo | Status |
|:-:|-------|:------:|
| 1 | Login BARBER | ✅ |
| 2 | Dashboard do barbeiro (cards do dia) | ✅ |
| 3 | Agenda filtrada (apenas profissional logado) | ✅ |
| 4 | Service Orders filtradas | ✅ |
| 5 | Vendas filtradas | ✅ |
| 6 | Perfil do barbeiro | ✅ |

### 3.3 Permissões BARBER (6 bloqueios)

| Recurso | Acesso |
|---------|:------:|
| Estoque | 🚫 403 |
| Financeiro | 🚫 403 |
| Caixa | 🚫 403 |
| Empresas | 🚫 403 |
| Usuários | 🚫 403 |
| Auditoria | 🚫 403 |

---

## 4. Endpoints (aproximadamente 150+)

| Categoria | Quantidade estimada |
|-----------|:-------------------:|
| Auth | 5 |
| Agenda | 8 |
| Auditoria | 2 |
| Barber | 5 |
| Caixa | 8 |
| Campanhas | 6 |
| Categorias | 6 |
| Clientes | 8 |
| Compras | 10 |
| Configurações | 4 |
| Conversas | 6 |
| CRM | 8 |
| Cupons | 6 |
| Dashboard | 14 |
| Empresa | 6 |
| Estoque | 20 |
| Financeiro | 8 |
| Fornecedores | 6 |
| Integrações | 6 |
| Notificações | 4 |
| Pagamentos | 4 |
| Produtos | 6 |
| Profissionais | 6 |
| Service Order | 8 |
| Serviços | 6 |
| Tasks | 4 |
| Unidades | 6 |
| Usuários | 6 |
| Vendas | 8 |

**Total estimado: ~200 endpoints**

---

## 5. Perfis de Acesso

| Perfil | Slug | Descrição |
|--------|:----:|-----------|
| Administrador | `admin` | Acesso total ao sistema |
| Operador | `operator` | Operações do dia a dia |
| Barbeiro | `barber` | Apenas dados do profissional logado |
| Visualizador | `viewer` | Apenas visualização |

---

## 6. Estrutura do Banco (Prisma)

**Total de models:** ~50  
**Migrations:** 12+

### Principais modelos

```
User → UserRole → Role → RolePermission → Permission
User → Professional (1:1)
Company → User, Unit, Customer, Professional, Product, Service, Sale, ...
Appointment → Customer, Professional, Service
ServiceOrder → Customer, Professional, Sale
Sale → Customer, ServiceOrder, SaleItem, Payment
Payment → CashTransaction → CashRegister
Stock → StockMovement, PurchaseOrder, Inventory
CRM → CustomerInteraction, Task, CustomerSegment, Cashback, Loyalty
AuditLog → User, Company
Notification → User
```

---

## 7. Documentação Existente

| Documento | Conteúdo |
|-----------|----------|
| `docs/project/review-caixa.md` | Auditoria do módulo Caixa |
| `docs/project/system-flows.md` | Mapeamento de 11 fluxos |
| `docs/project/flow-validation-report.md` | Correções validadas |
| `docs/project/review-stock-flow.md` | Auditoria Estoque + ALT-01/02 |
| `docs/project/review-crm-flow.md` | Auditoria CRM + interações automáticas |
| `docs/project/uat-final-v1.md` | UAT Final v1.0 (19/19 etapas) |
| `docs/project/release-v1.0.md` | Release v1.0 oficial |
| `docs/project/v1.0.1-stabilization.md` | Estabilização pós-certificação |
| `docs/project/post-release-plan.md` | Política de manutenção |
| `docs/project/barber-domain.md` | Domínio do Barbeiro v1.1 |
| `docs/project/review-barber-sprint1.md` | Sprint BARBER.1 |
| `docs/project/review-barber-uat.md` | UAT Perfil BARBER |
| `docs/project/uat-operacional-v1.md` | UAT Operacional completa |
| `docs/project/certificacao-final-v1.0.2.md` | Certificação Final v1.0.2 |
| `docs/manuals/admin-guide.md` | Manual do Administrador |
| `docs/manuals/user-guide.md` | Manual do Usuário |
| `docs/manuals/quick-start.md` | Guia Rápido |
| `docs/manuals/faq.md` | Perguntas Frequentes (71) |
| `docs/manuals/glossary.md` | Glossário (55 termos) |
| `docs/manuals/README.md` | Índice da documentação |

**Total: 22 documentos**

---

## 8. Histórico das Sprints Realizadas

| Sprint | Foco | Período | Status |
|--------|------|:-------:|:------:|
| UX.2 | Fluxo operacional completo | Jul/26 | ✅ |
| ALT-01/02 | Valuation + custo médio | Jul/26 | ✅ |
| CRM | Interações automáticas | Jul/26 | ✅ |
| UAT v1.0 | Certificação 19 fluxos | Jul/26 | ✅ |
| v1.0.1 | Estabilização (catches, performance) | Jul/26 | ✅ |
| Documentação | Manuais (admin, user, faq, glossary) | Jul/26 | ✅ |
| BARBER.1 | Módulo do Barbeiro (núcleo) | Jul/26 | ✅ |
| v1.0.2 | Estabilização final (profile, dashboard, /vendas) | Jul/26 | ✅ |

---

## 9. Bugs Corrigidos

| ID | Bug | Sprint | Gravidade |
|:--:|-----|:------:|:---------:|
| 01 | Interaction DTO desatualizado (OTHER → NOTE) | CRM | Alta |
| 02 | Catch silencioso sem logging | v1.0.1 | Média |
| 03 | Silêncio em InteractionService (5 pontos) | v1.0.1 | Média |
| 04 | PermissionsGuard ausente nos controllers Stock | BARBER.1 | Crítica |
| 05 | PermissionsGuard ausente no controller Cash | BARBER.1 | Alta |
| 06 | Profile endpoint não existe (404) | v1.0.2 | Crítica |
| 07 | Dashboard root com Invalid Date (500) | v1.0.2 | Crítica |
| 08 | Página /vendas não existe (404) | v1.0.2 | Crítica |

**Total de bugs corrigidos: 8**

---

## 10. Débitos Técnicos Restantes

| Item | Impacto | Prioridade |
|------|---------|:----------:|
| Sem testes automatizados (unit/integration) | Risco de regressão | 🔴 Alta |
| Sem CI/CD pipeline | Deploy manual | 🟡 Média |
| Sem rate limit configurável | Hardcoded no ThrottlerModule | 🟡 Média |
| Sem variáveis de ambiente para produção | .env com valores dev | 🟡 Média |
| Frontend sem componentes de loading | UX incompleta | 🟢 Baixa |
| Frontend sem toast de sucesso/erro | UX incompleta | 🟢 Baixa |
| Logs de servidor sem rotação | Acúmulo em produção | 🟢 Baixa |
| Sem backup automatizado do BD | Risco de perda de dados | 🟡 Média |

---

## 11. Funcionalidades Congeladas (v1.0 definitivo)

- ✅ Nenhuma nova funcionalidade será adicionada na v1.0
- ✅ Apenas correções de bugs, segurança e UX
- ✅ Todas as novas funcionalidades pertencem à v1.1

---

## 12. Funcionalidades Previstas para v1.1

| Funcionalidade | Status |
|----------------|:------:|
| Comissão dos profissionais | 📋 Documentado |
| Portal/Tela do barbeiro | 📋 Documentado |
| Recebimento separado de compras | 📋 Documentado |
| CustomerScore persistido | 📋 Documentado |
| Campanhas avançadas | 📋 Previsto |
| Automações avançadas | 📋 Previsto |
| Relatórios gerenciais | 📋 Previsto |

---

## 13. Commits Relevantes

| Commit | Descrição |
|--------|-----------|
| `819638c` | Certificação Final v1.0.2 (54/54 testes) |
| `9410cea` | v1.0.2: Profile, Dashboard, /vendas corrigidos |
| `ae5e3c7` | Sprint BARBER.1 completa |
| `c42c85f` | UAT Perfil BARBER (22/22) |
| `15652a5` | UAT Operacional v1.0 |
| `cd3610e` | Release v1.0 oficial |
| `11b38c0` | UAT Final v1.0 (19/19) |
| `f353cfb` | CRM interações automáticas |

---

*Documento gerado em 26/07/2026 — Baseline Oficial v1.0.2*
