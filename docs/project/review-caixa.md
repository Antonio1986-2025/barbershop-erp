# Auditoria do Módulo Caixa

> **Data:** 2026-07-25
> **Versão:** 1.0
> **Propósito:** Auditoria completa do módulo Caixa para identificar o que impede o funcionamento 100%.

---

## 1. Fluxo Completo: Abertura e Fechamento de Caixa

### 1.1 Abertura

1. Usuário seleciona unidade no select
2. Clica em "Abrir Caixa"
3. Modal solicita **Valor Inicial** (opcional, padrão R$ 0,00)
4. `POST /api/cash/open` → `CashService.open()`
5. Cria `CashRegister` com status `OPEN`
6. Se `openingAmount > 0`, cria `CashTransaction` tipo `ENTRY`, descrição "Abertura de caixa"
7. Registra auditoria (`AuditService.create`)

### 1.2 Movimentações (Suprimento / Sangria)

- **Suprimento:** `POST /api/cash/:id/supply` → Cria `CashTransaction` tipo `ENTRY`
- **Sangria:** `POST /api/cash/:id/withdraw` → Cria `CashTransaction` tipo `EXIT`
- Ambas exigem caixa `OPEN` e validam `amount >= 0.01`

### 1.3 Recebimento de Pagamentos (Integração Sale)

1. `POST /api/sales/:id/payments` → `SalePaymentService.create()`
2. Se método = `CASH`, verifica se existe caixa `OPEN` na unidade. Se não, **bloqueia** o pagamento
3. Cria `Payment` com status `PAID`
4. Se `willComplete` (pagamento >= saldo restante):
   - `createFinancialRecords()` → cria `CashTransaction` tipo `ENTRY` vinculada ao `Payment`
   - Cria `FinancialAccount` tipo `RECEIVABLE` (categoria "Vendas")
   - Baixa estoque, gera cashback/loyalty, dispara automações
   - Atualiza Sale para `PAID`
   - Envia notificação de venda concluída

### 1.4 Fechamento

1. Usuário clica "Fechar Caixa"
2. Modal mostra **Valor Esperado** (pré-preenchido com saldo atual) e **Valor Real em Caixa**
3. `POST /api/cash/:id/close` → `CashService.close()`
4. `CashService.close()` delega para `FinancialService.createCashClosing()`
5. `FinancialService.createCashClosing()`:
   - Calcula `difference` (valor real - valor esperado)
   - Cria `CashClosing` com `openingAmount, expectedAmount, closingAmount, difference`
   - Atualiza `CashRegister` para status `CLOSED`, preenche `closedAt` e `closedBy`
   - Registra auditoria

### 1.5 Reabertura

- `POST /api/cash/:id/reopen` → Volta status para `OPEN`, limpa `closedBy/closedAt/closingAmount`
- Só funciona se caixa está `CLOSED` e não há outro caixa `OPEN` na mesma unidade

---

## 2. Telas Existentes

### 2.1 Página Principal

| Tela | Rota | Arquivo | Status |
|------|------|---------|--------|
| Caixa | `/caixa` | `frontend/.../caixa/page.tsx` | 🟡 Com bugs |
| Fluxo de Caixa | `/financeiro/fluxo-caixa` | `frontend/.../financeiro/fluxo-caixa/page.tsx` | ✅ Funcional |

### 2.2 Sidebar

- Link na sidebar: linha 18 (`/caixa`, ícone `wallet`)
- Link Financeiro: linha 22 (`/financeiro/contas`, ícone `dollar-sign`)

---

## 3. Endpoints Utilizados

| Endpoint | Método | Controller | Status |
|----------|--------|-----------|--------|
| `/api/cash/current?unitId=` | GET | `CashController.current()` | ✅ |
| `/api/cash/open` | POST | `CashController.open()` | ✅ |
| `/api/cash/:id/close` | POST | `CashController.close()` | ✅ |
| `/api/cash/:id/reopen` | POST | `CashController.reopen()` | ✅ |
| `/api/cash/:id/supply` | POST | `CashController.supply()` | ✅ |
| `/api/cash/:id/withdraw` | POST | `CashController.withdraw()` | ✅ |
| `/api/cash/:id/summary` | GET | `CashController.summary()` | ✅ |
| `/api/cash/history` | GET | `CashController.history()` | ✅ |
| `/api/financial/cash-flow` | GET | `FinancialController.getCashFlow()` | ✅ |
| `/api/financial/cash-closing` | GET | `FinancialController.findCashClosings()` | ✅ |

**Observação:** Todos os endpoints foram testados e retornam respostas corretas.

---

## 4. Services Envolvidos

| Service | Arquivo | Responsabilidade |
|---------|---------|------------------|
| `CashService` | `cash.service.ts` | CRUD caixa, supply/withdraw, summary, history |
| `FinancialService` | `financial.service.ts` | Cash closing, accounts, categories, cash flow |
| `SalePaymentService` | `sale-payment.service.ts` | Cria pagamentos + vincula ao caixa (CashTransaction) |
| `AuditService` | `audit.service.ts` | Auditoria de todas as operações |

---

## 5. Models / Tabelas Relacionadas

| Model | Tabela | Campos Principais |
|-------|--------|-------------------|
| `CashRegister` | `cash_registers` | id, companyId, unitId, openedBy, closedBy, openedAt, closedAt, openingAmount, closingAmount, status (OPEN/CLOSED), notes |
| `CashTransaction` | `cash_transactions` | id, cashRegisterId, paymentId?, type (ENTRY/EXIT), amount, description |
| `CashClosing` | `cash_closings` | id, cashRegisterId, openedAt, closedAt, openingAmount, closingAmount, expectedAmount, difference |
| `Payment` | `payments` | id, saleId?, serviceOrderId?, amount, paymentMethod (CASH/CREDIT_CARD/etc), status (PENDING/PAID/etc) |
| `Sale` | `sales` | id, unitId, customerId, status (DRAFT/OPEN/PAID/etc), total |
| `SaleItem` | `sale_items` | id, saleId, serviceId?, productId?, quantity, unitPrice |
| `FinancialAccount` | `financial_accounts` | id, categoryId, description, type (RECEIVABLE/PAYABLE), amount, status (OPEN/PAID) |
| `FinancialCategory` | `financial_categories` | id, name, type (INCOME/EXPENSE) |

### Relacionamentos

```
CashRegister 1──N CashTransaction
CashRegister 1──N CashClosing
Payment      1──N CashTransaction (via paymentId)
Sale         1──N Payment
```

---

## 6. Integrações

### 6.1 Integração com Sale

`SalePaymentService.create()` (linhas 88-98):
- Se método = `CASH`, busca `CashRegister OPEN` na unidade
- Se não encontrar → **499: "Caixa não está aberto"** (bloqueia pagamento)
- Se encontrar → cria `Payment` e (se for completo) cria `CashTransaction`

### 6.2 Integração com Payment

`SalePaymentService.createFinancialRecords()` (linhas 280-327):
- Para cada `Payment` com método `CASH`, cria `CashTransaction` tipo `ENTRY`
- Vincula `paymentId` na `CashTransaction`
- **⚠️ Só executa se `willComplete = true`** (pagamento >= saldo restante)
- Pagamentos parciais em dinheiro NÃO geram CashTransaction

### 6.3 Integração com Financeiro

`FinancialService`:
- `createCashClosing()` é chamado pelo `CashService.close()`
- `getCashFlow()` consulta `CashTransaction` e `FinancialAccount`
- Consulta `CashClosing` para relatórios

---

## 7. Como o Caixa Recebe Pagamentos Hoje

**Fluxo completo:**

```
PDV (venda) → POST /api/sales/:id/payments
  ↓
SalePaymentService.create()
  ↓
Verifica: método CASH? → Busca CashRegister OPEN na unidade
  ↓
Cria Payment (status PAID)
  ↓
Se pagamento >= saldo restante (willComplete):
  ├── createFinancialRecords()
  │     ├── Cria FinancialAccount (RECEIVABLE)
  │     └── Cria CashTransaction (ENTRY, vinculada ao Payment)
  ├── Baixa estoque
  ├── Gera cashback / loyalty
  ├── Sale → PAID
  └── Notificação
```

**⚠️ Pontos críticos:**
- Pagamentos PARCIAIS em dinheiro NÃO geram CashTransaction
- Se não houver caixa OPEN, o pagamento em dinheiro é completamente bloqueado

---

## 8. Como Ocorre o Fechamento

```
Frontend → POST /api/cash/:id/close { closingAmount, expectedAmount }
  ↓
CashService.close() → delega para FinancialService.createCashClosing()
  ↓
FinancialService.createCashClosing():
  1. Busca CashRegister com transactions
  2. Calcula expected = closingAmount ?? (openingAmount + entries - exits)
  3. Calcula difference = closingAmount - expected
  4. Cria CashClosing (openingAmount, closingAmount, expectedAmount, difference)
  5. Atualiza CashRegister → CLOSED, closedAt, closedBy
  6. Auditoria
```

**⚠️ Problema:** O `close()` do `CashService` não valida se `closingAmount` foi informado. O DTO marca como `@IsOptional()`. Se não for enviado, o backend calcula `expected` como o saldo atual, o que não reflete a contagem real do caixa.

---

## 9. Bugs Encontrados

### BUG-001: `<h1` sem `<` (tag quebrada)

**Local:** `caixa/page.tsx:107`
**Código:**
```tsx
        h1 className="text-xl font-bold sm:text-2xl"
```
**Problema:** Falta o `<` antes de `h1`. O JSX renderiza "h1" como texto literal, não como um heading HTML.
**Impacto:** O título da página não aparece como elemento <h1>. Fica invisível ou aparece o texto "h1" na tela.

### BUG-002: `current()` sem unitId retorna qualquer caixa

**Local:** `cash.controller.ts:16-19` e `cash.service.ts:21-48`
**Problema:** Se `unitId` não for informado (undefined), o Prisma ignora o filtro de unidade e retorna qualquer caixa OPEN.
**Impacto:** Pode mostrar caixa de outra unidade se o frontend não enviar unitId corretamente.

### BUG-003: Pagamentos parciais em dinheiro não geram CashTransaction

**Local:** `sale-payment.service.ts:116-118` (willComplete)
**Problema:** `createFinancialRecords()` só é chamada em pagamentos que completam a venda. Pagamento parcial em dinheiro não cria CashTransaction, então o valor não aparece no caixa.
**Impacto:** Saldo do caixa fica incorreto se o cliente pagar em dinheiro de forma parcelada.

---

## 10. Rotas Quebradas

Nenhuma rota quebrada foi identificada. Todos os endpoints respondem corretamente.

---

## 11. Erros do Frontend

| Item | Local | Descrição | Gravidade |
|------|-------|-----------|-----------|
| Tag `<h1` quebrada | `caixa/page.tsx:107` | Título da página não renderiza como heading | 🔴 MÉDIA |
| Input `type="number"` | `caixa/page.tsx:227,249,276,304,309` | Campos de valor sem máscara R$ (digitação com ponto) | 🟡 BAIXA |
| Botão "Abrir Caixa" | `caixa/page.tsx:188-190` | Botão simples sem destaque visual | 🟡 BAIXA |
| Fechamento não finaliza | `caixa/page.tsx:91-102` | Após fechar, deveria redirecionar ou mostrar resumo | 🟡 BAIXA |

---

## 12. Erros do Backend

| Item | Local | Descrição | Gravidade |
|------|-------|-----------|-----------|
| `closingAmount` opcional | `dto/close-cash.dto.ts:9` | Se não enviar, o fechamento usa valor calculado (pode esconder diferença real) | 🔴 MÉDIA |
| `current()` sem unitId | `cash.service.ts:22-27` | Ignora filtro de unidade se unitId for undefined | 🟡 BAIXA |
| Pagamento parcial CASH | `sale-payment.service.ts:298-325` | Só cria CashTransaction se willComplete | 🔴 ALTA |

---

## 13. Campos Obrigatórios

### OpenCashDto
| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `unitId` | string | ✅ Sim | — |
| `openingAmount` | number (>=0) | ✅ Sim | — |
| `notes` | string | ❌ Opcional | — |

### CloseCashDto
| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `closingAmount` | number (>=0) | ❌ Opcional | — |
| `expectedAmount` | number (>=0) | ❌ Opcional | — |

### CashTransactionDto (supply/withdraw)
| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `amount` | number (>=0.01) | ✅ Sim | — |
| `description` | string | ✅ Sim | — |

**⚠️ Problema:** `CloseCashDto` não exige `closingAmount` — o backend aceita fechamento sem valor real, perdendo a conferência de diferença.

---

## 14. Validação das Regras de Negócio

| Regra | Status | Teste |
|-------|--------|-------|
| Não abrir caixa com unidade já aberta | ✅ Passou | `open()` rejeita duplicidade |
| Não fechar caixa já fechado | ✅ Passou | `close()` rejeita CLOSED |
| Não mexer em caixa fechado (supply/withdraw) | ✅ Passou | `findOpenRegister()` rejeita CLOSED |
| Não reabrir se já existe outro aberto | ✅ Passou | `reopen()` valida duplicidade |
| Não receber pagamento CASH sem caixa aberto | ✅ Passou | `SalePaymentService` bloqueia |
| Supply/Withdraw validam amount >= 0.01 | ✅ Passou | DTO valida `@Min(0.01)` |
| Auditoria em todas operações | ✅ Passou | AuditService registra CREATE/UPDATE/CLOSE_CASH |

---

## 15. O Que Impede o Módulo de Funcionar 100%

### 🚫 BLOQUEANTES

**Nenhum bloqueante encontrado.** O módulo Caixa está funcional — é possível abrir, movimentar, fechar, reabrir e receber pagamentos.

### 🟠 ALTO

1. **BUG-003: Pagamento parcial CASH não gera CashTransaction**
   - Se o cliente paga R$ 50 de uma venda de R$ 150 em dinheiro (parcial), esse valor SOME do caixa
   - Aparece no saldo do Payment mas não no saldo do CashRegister
   - **Impacto:** Diferença no fechamento do caixa

2. **Pagamentos em dinheiro sem CashRegister OPEN são bloqueados**
   - Não é um bug, é uma RN válida
   - Mas se o PDV tenta receber e o caixa está fechado, o erro é genérico: "Caixa não está aberto"
   - **Impacto:** UX confusa se o operador não abriu o caixa antes

### 🟡 MÉDIO

3. **BUG-001: `<h1` quebrado na página Caixa**
   - O título não renderiza como heading — fica como texto literal
   - **Impacto:** Aparência quebrada na interface, mas funcionalidade preservada
   - **Mesmo padrão** do bug da página de Auditoria (já corrigido)

4. **`CloseCashDto.closingAmount` opcional**
   - Permite fechar caixa sem informar valor real
   - **Impacto:** Diferença calculada como zero, escondendo possível divergência

### 🟢 BAIXO

5. **BUG-002: `current()` sem unitId retorna qualquer caixa**
   - Caso raro (frontend sempre envia unitId)
   - **Impacto:** Marginal

6. **Inputs sem máscara R$ nos modais do caixa**
   - Usam `type="number" step="0.01"` — funcional mas não segue padrão BR
   - **Impacto:** UX, não funcional

7. **Sem feedback visual após fechamento**
   - Após fechar, a página apenas recarrega (mostra tela de "Abrir Caixa")
   - **Impacto:** Usuário pode não perceber que fechou com sucesso

---

## Resumo Final

| Categoria | Total | Detalhes |
|-----------|-------|----------|
| 🚫 BLOQUEANTE | 0 | — |
| 🟠 ALTO | 2 | Pagamento parcial CASH sem registro; Bloqueio sem orientação |
| 🟡 MÉDIO | 2 | Título quebrado (h1); Fechamento sem valor real obrigatório |
| 🟢 BAIXO | 3 | Filtro unitId; Máscara R$; Feedback pós-fechamento |

**Status geral:** 🟡 **APROVADO COM RESSALVAS** — Funcional, mas com bugs de interface e uma inconsistência contábil em pagamentos parciais em dinheiro.
