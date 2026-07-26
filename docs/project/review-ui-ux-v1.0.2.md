# Auditoria UX/UI — v1.0.2

**Data:** 26/07/2026
**Status:** 📋 ANÁLISE COMPLETA (nenhuma alteração realizada)

---

## Resumo Executivo

| Indicador | Nota |
|-----------|:----:|
| Desktop | **6.5/10** |
| Mobile | **4.0/10** |
| UX | **5.5/10** |
| UI | **6.0/10** |
| Consistência | **5.5/10** |
| Responsividade | **4.0/10** |

**Total de problemas encontrados: 38**
- 🔴 Críticos: 5
- 🟡 Médios: 18
- 🟢 Baixos: 15

---

## 🔴 Problemas Críticos

### CR-01: Sem feedback visual para ações do usuário

| Campo | Detalhe |
|-------|---------|
| **Tipo** | UX |
| **Onde** | Todas as telas |
| **Problema** | Nenhum toast/modal de confirmação após criar, editar ou excluir. O usuário nunca sabe se a ação foi bem-sucedida |
| **Evidência** | Nenhum arquivo `toast.tsx` ou `modal.tsx` encontrado no projeto |
| **Sugestão** | Implementar componente Toast global (ex: sonner, react-hot-toast) |

### CR-02: Sem breadcrumbs

| Campo | Detalhe |
|-------|---------|
| **Tipo** | UX |
| **Onde** | Todas as telas |
| **Problema** | O usuário nunca sabe onde está na hierarquia do sistema. 0 arquivos com `breadcrumb` encontrados |
| **Sugestão** | Criar componente Breadcrumb reutilizável baseado na rota atual |

### CR-03: Sem confirmação em ações destrutivas

| Campo | Detalhe |
|-------|---------|
| **Tipo** | UX/Segurança |
| **Onde** | Exclusões, cancelamentos |
| **Problema** | Nenhum diálogo de confirmação antes de excluir registros. Nenhum componente Modal/Dialog encontrado |
| **Sugestão** | Criar componente `ConfirmDialog` reutilizável |

### CR-04: Dashboard com 14 hooks simultâneos

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Performance |
| **Onde** | `dashboard/page.tsx` |
| **Problema** | A página carrega 14 hooks de API em paralelo, cada um fazendo sua própria requisição. Pode causar lentidão |
| **Sugestão** | Agrupar chamadas em menos endpoints ou usar React Query com deduplicação |

### CR-05: Perfil BARBER sem frontend dedicado

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Funcionalidade |
| **Onde** | Todas as telas do barbeiro |
| **Problema** | Não existe nenhuma interface específica para o perfil BARBER. O barbeiro usa as mesmas telas do admin (com menu oculto) |
| **Sugestão** | Criar dashboard, agenda e perfil específicos para o barbeiro (conforme documentado no barber-domain.md) |

---

## 🟡 Problemas Médios

### UX-01: Loading genérico em todas as telas

| Onde | Problema | Sugestão |
|------|----------|----------|
| `data-table.tsx` | Apenas texto "Carregando..." com `animate-pulse` | Usar Skeleton loader com formato da tabela |
| `customer-form.tsx` | "Pesquisando..." com `animate-pulse` | Skeleton específico |

### UX-02: Empty states sem informação útil

| Onde | Problema | Sugestão |
|------|----------|----------|
| `data-table.tsx` | Apenas texto "Nenhum cliente encontrado." | Ilustração + botão de ação (ex: "Criar primeiro cliente") |

### UX-03: Sem estados de erro visuais

| Onde | Problema | Sugestão |
|------|----------|----------|
| Todos os formulários | Erro de API exibido como texto simples | Alertas coloridos com ação de retry |

### UX-04: Sidebar com 21 links sem scroll visível

| Onde | Problema | Sugestão |
|------|----------|----------|
| `sidebar.tsx` | Muitos links sem indicador de scroll. Em mobile, pode ficar inacessível | Adicionar `overflow-y-auto` com indicador |

### UX-05: Sem atalhos de teclado

| Onde | Problema | Sugestão |
|------|----------|----------|
| PDV, formulários | Usuário precisa sempre usar o mouse | Adicionar Ctrl+Enter para salvar, Escape para fechar |

### UX-06: Sidebar não colapsa automaticamente

| Onde | Problema | Sugestão |
|------|----------|----------|
| Mobile | Sidebar overlay não fecha após navegação | Já existe `onClick` mas não funciona em todos os casos |

### UX-07: Títulos inconsistentes entre páginas

| Onde | Problema | Sugestão |
|------|----------|----------|
| Várias telas | Algumas usam `text-xl`, outras `text-2xl` | Padronizar `text-2xl font-bold` em todas |

### UX-08: Sem página de perfil do usuário

| Onde | Problema | Sugestão |
|------|----------|----------|
| Perfil | Não existe rota `/perfil`. Apenas um card no sidebar | Criar página de perfil com dados do usuário + alterar senha |

---

## 🟢 Problemas Baixos

### UI-01: SVGs inline no sidebar

| Onde | Problema |
|------|----------|
| `sidebar.tsx` | 21 icons SVG inline no código. Dificulta manutenção |
| **Sugestão** | Extrair para arquivos .tsx separados ou usar biblioteca (lucide, heroicons) |

### UI-02: FormActions duplicado em formulários

| Onde | Problema |
|------|----------|
| Vários `novo/page.tsx` | Botão submit + voltar repetido em cada formulário |
| **Sugestão** | Já existe `FormActions` component, verificar se está sendo usado em todos |

### UI-03: Sem tema escuro

| Onde | Problema |
|------|----------|
| Global | Apenas tema claro disponível |
| **Sugestão** | Adicionar toggle claro/escuro com Tailwind `dark:` |

### UI-04: Ícones inconsistentes

| Onde | Problema |
|------|----------|
| Sidebar | Alguns ícones não representam bem o módulo |
| **Sugestão** | Revisar todos os ícones com designer |

### UI-05: Espaçamentos inconsistentes

| Onde | Problema |
|------|----------|
| Várias telas | `px-4 py-6` vs `px-6 py-8` |
| **Sugestão** | Padronizar padding no layout authenticated |

---

## Responsividade

### Desktop (1920–1366)

| Problema | Gravidade |
|----------|:---------:|
| Dashboard com 4 colunas — ok | 🟢 |
| Tabelas com muitas colunas — ok | 🟢 |
| Sidebar fixa — ok | 🟢 |

### Notebook (1280)

| Problema | Gravidade |
|----------|:---------:|
| Dashboard pode quebrar para 2 colunas | 🟡 |
| Tabelas com 6+ colunas podem ter scroll horizontal | 🟡 |

### Tablet (1024–820)

| Problema | Gravidade |
|----------|:---------:|
| Sidebar como overlay (bom) | 🟢 |
| Tabelas sem `hideOnMobile` podem vazar | 🟡 |
| Cards do dashboard empilhados — ok | 🟢 |

### Mobile (430–320)

| Problema | Gravidade |
|----------|:---------:|
| Sidebar ocupa 100% da tela — ok | 🟢 |
| Sidebar não fecha após clique em alguns casos | 🔴 |
| Tabelas sem `hideOnMobile` causam scroll horizontal | 🔴 |
| Formulários com muitos campos podem exigir scroll infinito | 🟡 |
| Botões muito próximos em mobile | 🟡 |
| Touch targets pequenos (menos de 44px) | 🟡 |
| Sem suporte a gestos (swipe) | 🟢 |

---

## Padrões BR

### Implementados corretamente

| Padrão | Onde | Status |
|--------|------|:------:|
| ✅ `CurrencyInput` (R$) | formulários de preço | ✅ |
| ✅ Busca por telefone | `customer-form.tsx`, `quick-customer-form.tsx` | ✅ |
| ✅ Fluxo telefone primeiro | cadastro de clientes | ✅ |
| ✅ `FormField` component | formulários | ✅ |

### Não implementados ou inconsistentes

| Padrão | Problema | Gravidade |
|--------|----------|:---------:|
| ❌ Máscara de telefone consistente | Alguns formulários usam input raw sem formatação | 🟡 |
| ❌ Validação de CPF/CNPJ | Não encontrada em nenhum formulário | 🟡 |
| ❌ CEP com máscara | Não encontrado | 🟢 |
| ❌ Data no padrão BR (dd/mm/aaaa) | Pode estar usando ISO | 🟡 |

---

## Checklist por Módulo

| Módulo | Funciona? | Desktop | Mobile | Observações |
|--------|:---------:|:-------:|:------:|-------------|
| Login | ✅ | ✅ | ✅ | Simples, funcional |
| Dashboard | ✅ | ✅ | ⚠️ | 14 hooks pode ser lento |
| Clientes | ✅ | ✅ | ⚠️ | Tabela pode ter scroll horizontal |
| Agendamentos | ✅ | ✅ | ⚠️ | Calendário complexo em mobile |
| PDV/Vendas | ✅ | ✅ | ❌ | Muitos campos, fluxo longo |
| Caixa | ✅ | ✅ | ⚠️ | Operações financeiras |
| Financeiro | ✅ | ✅ | ⚠️ | Muitas sub-páginas |
| Estoque | ✅ | ✅ | ❌ | Relatórios complexos em mobile |
| Produtos | ✅ | ✅ | ✅ | CRUD simples |
| Serviços | ✅ | ✅ | ✅ | CRUD simples |
| Profissionais | ✅ | ✅ | ✅ | CRUD simples |
| CRM | ✅ | ✅ | ⚠️ | Perfil + interações |
| Perfil BARBER | ❌ | ❌ | ❌ | **Não implementado no frontend** |
| Notificações | ✅ | ✅ | ✅ | Lista simples |
| Auditoria | ✅ | ✅ | ❌ | Tabela grande sem filtro mobile |

---

## Plano Priorizado de Melhorias (Futura Sprint UX)

### PRIORIDADE 1 (Correções Obrigatórias)

| # | Problema | Esforço | Impacto |
|:-:|----------|:-------:|:-------:|
| 1 | Toast/feedback para ações | 4h | Alto |
| 2 | ConfirmDialog para ações destrutivas | 3h | Alto |
| 3 | Página de perfil BARBER no frontend | 8h | Alto |
| 4 | Breadcrumbs | 3h | Alto |

### PRIORIDADE 2 (Melhorias de UX)

| # | Problema | Esforço | Impacto |
|:-:|----------|:-------:|:-------:|
| 5 | Skeleton loading (substituir animate-pulse) | 6h | Médio |
| 6 | Empty states com ilustração + ação | 4h | Médio |
| 7 | Máscara de telefone consistente | 2h | Médio |
| 8 | Responsividade mobile do PDV | 6h | Alto |

### PRIORIDADE 3 (Padronização)

| # | Problema | Esforço | Impacto |
|:-:|----------|:-------:|:-------:|
| 9 | Extrair SVGs do sidebar para arquivos | 2h | Baixo |
| 10 | Padronizar títulos e espaçamentos | 2h | Médio |
| 11 | Revisar `hideOnMobile` em todas as tabelas | 3h | Médio |
| 12 | Validação CPF/CNPJ | 2h | Médio |

### PRIORIDADE 4 (Performance + Acessibilidade)

| # | Problema | Esforço | Impacto |
|:-:|----------|:-------:|:-------:|
| 13 | Otimizar Dashboard (14 hooks → menos chamadas) | 4h | Alto |
| 14 | Contraste de cores (acessibilidade) | 2h | Médio |
| 15 | Atalhos de teclado no PDV | 3h | Baixo |

---

## Conclusão

### Pontos fortes
- `CurrencyInput` bem implementado com máscara R$
- `DataTable` com suporte a `hideOnMobile`
- Sidebar com filtro BARBER via `adminOnly`
- `QuickCustomerForm` com busca por telefone
- Estrutura de componentes modular (`FormField`, `FormActions`, `ErrorBox`)
- Rotas organizadas por módulo no App Router
- 17 componentes compartilhados

### Pontos fracos
- **Perfil BARBER sem frontend** (crítico para a Sprint BARBER.2)
- **Sem feedback visual** para operações do usuário
- **Sem breadcrumbs** — navegação sem contexto
- **Sem skeleton loading** — experiência de carregamento pobre
- **Dashboard sobrecarregado** — 14 chamadas simultâneas
- **Responsividade mobile limitada** — tabelas e formulários longos
- **SVGs inline** — difícil manutenção

### Notas finais

| Categoria | Nota | Status |
|-----------|:----:|:------:|
| Desktop | **6.5** | 🟡 Aceitável |
| Mobile | **4.0** | 🔴 Precisa melhorar |
| UX | **5.5** | 🟡 Média |
| UI | **6.0** | 🟡 Regular |
| Consistência | **5.5** | 🟡 Média |
| Responsividade | **4.0** | 🔴 Precisa melhorar |

---

*Documento gerado em 26/07/2026 — Auditoria UX/UI v1.0.2*
