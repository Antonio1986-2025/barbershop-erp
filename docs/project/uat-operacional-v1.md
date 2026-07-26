# UAT Operacional — v1.0

**Data:** 26/07/2026
**Auditor:** Hermes Agent (simulação de usuário real)

---

## Resumo Executivo

| Métrica | Valor |
|---------|:-----:|
| Módulos testados | 18 |
| Bugs encontrados | 4 |
| Melhorias UX sugeridas | 6 |
| Fluxos aprovados | 14 |
| Fluxos reprovados | 2 |
| Recomendação | 🟡 **APTO COM RESSALVAS** |

---

## Fluxos Aprovados

| Módulo | Fluxo | Status |
|--------|-------|:------:|
| Login | Autenticação admin, operador, barber, viewer | ✅ |
| Login | Rate limiting (429 após excesso) | ✅ |
| Dashboard | Carregamento de dados | ✅ |
| Empresa | Listagem, edição | ✅ |
| Unidades | Listagem | ✅ |
| Usuários | Listagem, criação | ✅ |
| Clientes | Criação, proteção duplicata telefone | ✅ |
| Profissionais | Listagem | ✅ |
| Serviços | Listagem | ✅ |
| Produtos | Listagem | ✅ |
| Agenda | Criação, confirmação, cancelamento, conflito de horário | ✅ |
| Caixa | Visualização do caixa atual | ✅ |
| Financeiro | Listagem de contas | ✅ |
| CRM | Perfil, interações, tasks | ✅ |

---

## Fluxos Reprovados

| Módulo | Fluxo | Motivo | Gravidade |
|--------|-------|--------|:---------:|
| Perfil | Visualizar perfil do usuário logado | `GET /api/auth/profile` retorna 404 | 🔴 CRÍTICA |
| Frontend | Página de vendas | `/vendas` retorna 404 | 🔴 CRÍTICA |

---

## Bugs Encontrados

### 🔴 BUG-01: Perfil do usuário retorna 404

| Campo | Detalhe |
|-------|---------|
| **Módulo** | Perfil |
| **Tela** | Perfil do usuário |
| **Passos** | 1. Logar como admin → 2. Clicar no perfil → 3. Aguardar carregamento |
| **Resultado esperado** | Dados do usuário (nome, email, empresa, roles, permissões) |
| **Resultado obtido** | `{"statusCode": 404, "message": "Cannot GET /api/auth/profile"}` |
| **Gravidade** | 🔴 **CRÍTICA** — o usuário não consegue ver seu próprio perfil |

### 🔴 BUG-02: Página de vendas no frontend retorna 404

| Campo | Detalhe |
|-------|---------|
| **Módulo** | Frontend |
| **Tela** | Vendas |
| **Passos** | 1. Logar como admin → 2. Navegar para /vendas |
| **Resultado esperado** | Página de listagem de vendas |
| **Resultado obtido** | HTTP 404 — página não encontrada |
| **Gravidade** | 🔴 **CRÍTICA** — impossível acessar vendas pela interface |

### 🟡 BUG-03: Dashboard sem cards estruturados

| Campo | Detalhe |
|-------|---------|
| **Módulo** | Dashboard |
| **Tela** | Home |
| **Passos** | 1. Logar → 2. Página inicial |
| **Resultado esperado** | Cards visuais com indicadores (receita, clientes, agendamentos) |
| **Resultado obtido** | API retorna dados crus sem estrutura de cards |
| **Gravidade** | 🟡 **MÉDIA** — dados existem mas sem UX adequada |

### 🟡 BUG-04: Login response sem dados completos do usuário

| Campo | Detalhe |
|-------|---------|
| **Módulo** | Login |
| **Tela** | Pós-login |
| **Passos** | 1. Logar → 2. Verificar response do login |
| **Resultado esperado** | Nome, email, roles, permissões no response |
| **Resultado obtido** | `user` object pode não conter todos os campos esperados |
| **Gravidade** | 🟡 **MÉDIA** — frontend pode não ter dados para renderizar |

---

## Melhorias de UX

### UX-01: Páginas sem auth redirecionam para login (307)

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Frontend | Páginas protegidas retornam 307 → redirecionam ao login. Comportamento esperado do NextAuth mas pode confundir usuário se ocorrer meio de sessão | 🟢 BAIXO |

### UX-02: Lista de usuários não mostra roles associadas

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Usuários | Ao listar usuários, o response não inclui as roles. O admin não vê de relance qual permissão cada usuário tem | 🟢 BAIXO |

### UX-03: Sem breadcrumbs em nenhuma tela

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Global | Nenhuma tela possui breadcrumbs. Usuário pode se perder na navegação | 🟢 BAIXO |

### UX-04: Sem confirmação visual em ações

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Global | Criar/editar/excluir não mostra toast ou mensagem de sucesso | 🟡 MÉDIO |

### UX-05: Responsividade não testada

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Frontend | Testar em viewport mobile (a ferramenta de automação não permite validar responsividade) | 🟢 BAIXO |

### UX-06: Tela de vendas indisponível

| Módulo | Sugestão | Impacto |
|--------|----------|:-------:|
| Vendas | A rota `/vendas` não existe no frontend. Impede fluxo completo de PDV | 🔴 ALTO |

---

## Permissões Validadas

### Perfil ADMIN

| Recurso | Acesso |
|---------|:------:|
| Dashboard | ✅ 200 |
| Financeiro | ✅ 200 |
| Estoque | ✅ 200 |
| Caixa | ✅ 200 |
| Empresas | ✅ 200 |
| Usuários | ✅ 200 |

### Perfil BARBER

| Recurso | Acesso |
|---------|:------:|
| Dashboard | ✅ 200 |
| Agenda | ✅ 200 |
| Estoque | **🚫 403** |
| Financeiro | **🚫 403** |
| Caixa | **🚫 403** |
| Empresas | **🚫 403** |
| Usuários | **🚫 403** |

### Perfil OPERADOR

| Recurso | Acesso |
|---------|:------:|
| Login | ✅ OK |

### Perfil VISUALIZADOR

| Recurso | Acesso |
|---------|:------:|
| Login | ✅ OK |

---

## Performance

| Endpoint | Tempo estimado | Observação |
|----------|:--------------:|------------|
| Login | ~600ms | Aceitável |
| Dashboard | ~500ms | Aceitável |
| Listagens | ~400-600ms | Aceitável |
| Frontend (Next.js) | ~3.6s inicial | Lento no primeiro carregamento (Turbopack) |

---

## Evidências

### API Profile retornando 404
```
GET /api/auth/profile → 404
{"statusCode":404,"message":"Cannot GET /api/auth/profile",...}
```

### Barber bloqueado de Estoque
```
GET /api/stock/reports/current-stock → 403 (como barber)
GET /api/stock/reports/current-stock → 200 (como admin)
```

### Telefone duplicado protegido
```
POST /api/customers (phone duplicado) → 409 Conflict
```

### Conflito de horário na agenda
```
POST /api/appointments (mesmo horário mesmo profissional) → 409 Conflict
```

---

## Recomendação para Produção

### 🟡 APTO COM RESSALVAS

O sistema está **funcional para uso operacional** mas **não deve ser colocado em produção** sem corrigir:

**Correções obrigatórias (bloqueantes):**

| Bug | Prioridade |
|-----|:----------:|
| BUG-01: Profile endpoint 404 | 🔴 **CRÍTICA** |
| BUG-02: Frontend /vendas 404 | 🔴 **CRÍTICA** |

**Correções recomendadas:**

| Bug | Prioridade |
|-----|:----------:|
| BUG-03: Dashboard sem cards estruturados | 🟡 MÉDIA |
| BUG-04: Login response incompleto | 🟡 MÉDIA |
| UX-06: Tela de vendas indisponível | 🟡 MÉDIA |
| UX-04: Sem confirmação visual | 🟡 MÉDIA |

**Melhorias futuras (v1.1):**

| Item | Prioridade |
|------|:----------:|
| Breadcrumbs nas telas | 🟢 BAIXA |
| Roles visíveis na lista de usuários | 🟢 BAIXA |
| Testes de responsividade mobile | 🟢 BAIXA |

---

## Resumo Final

| Indicador | Valor |
|-----------|:-----:|
| Total de bugs | **4** |
| ⚠️ Críticos | **2** (profile 404, vendas 404) |
| ⚠️ Alta | 0 |
| ⚠️ Média | 2 (dashboard, login response) |
| 💡 Sugestões UX | **6** |
| ✅ Fluxos aprovados | **14** |
| ❌ Fluxos reprovados | **2** |
| ✅ Permissões BARBER | **5/5 bloqueios OK** |
| 🔒 Rate limiting | **Funcionando** |

---

*Documento gerado em 26/07/2026 por Hermes Agent — Modo UAT*
