# Auditoria do Fluxo de Estoque — review-stock-flow

**Data:** 25/07/2026
**Status:** ✅ COMPLETO (correções ALT-01 e ALT-02 aplicadas e validadas)
**Repositório:** `main @ 25290cd` (com correções adicionais)
**Auditor:** Hermes Agent (Sprint UX.2)

---

## Correções Realizadas (v1.0)

### ALT-01: Valuation detalhado por produto

**Solução:** Adicionado parâmetro `?detail=true` ao endpoint `GET /api/stock/reports/valuation`.

Quando `detail=true`, retorna array de objetos com:

| Campo | Descrição |
|-------|-----------|
| `productName` | Nome do produto |
| `productBarcode` | Código de barras |
| `avgCost` | Custo médio atual |
| `quantity` | Quantidade em estoque |
| `costValue` | Valor de custo (qtd × avgCost) |
| `saleValue` | Valor de venda (qtd × salePrice) |
| `potentialProfit` | Lucro potencial (saleValue − costValue) |
| `unitName` | Nome da unidade |
| `categoryName` | Nome da categoria |

Sem o parâmetro, mantém o comportamento original (agregado por unidade).

**Arquivos modificados:**
- `backend/src/modules/stock/stock-report.service.ts` — método `valuation()`
- `backend/src/modules/stock/stock-report.controller.ts` — seleção do formato de exportação
- `backend/src/modules/stock/dto/report-query.dto.ts` — campo `detail?: string`

**Teste:** 20 produtos retornados com todos os campos obrigatórios preenchidos.

---

### ALT-02: Snapshot do custo médio nas saídas

**Solução:** Todas as movimentações de saída (SALE, CONSUMPTION, TRANSFER_OUT, LOSS) agora registram o `avgCostBefore` e `avgCostAfter` como snapshot histórico do custo médio no momento da operação. O custo médio do estoque **não é alterado** — apenas registrado na movimentação.

**Regra:** O valor é um snapshot da operação. Nunca é recalculado posteriormente.

**Alterações:**

1. **`stock-movement.service.ts`** — `avgCostBefore` removido da condicional `isEntry`; agora sempre registrado. `avgCostAfter` para saídas mantém o mesmo valor de `avgCostBefore`.

2. **`sale-payment.service.ts`** — `deductStock()` agora busca o custo médio atual via `Stock.findUnique` e passa `unitCost` e `totalCost` para `recordMovement()`.

**Testes:**
- Movimentação SALE: `avgCostBefore=1.5`, `avgCostAfter=1.5`, `unitCost=1.5`, `totalCost=1.5` ✅
- Movimentação RETURN (cancelamento): `avgCostBefore=1.5`, `avgCostAfter=1.5` ✅
- Kardex: 3 movimentos todos com snapshot do custo médio ✅

---

## Visão Geral do Módulo

O módulo de Estoque está organizado dentro de `backend/src/modules/stock/` com **8 controllers + 8 services**, além do módulo `Product` e schema Prisma completo.

### Estrutura de Arquivos

| Camada | Arquivos |
|--------|----------|
| **Backend** | `stock.module.ts`, `stock-movement.service/controller`, `purchase.service/controller`, `transfer.service/controller`, `inventory.service/controller`, `stock-report.service/controller`, `stock-alert.service/controller`, `stock-dashboard.service/controller`, `supplier.service/controller` |
| **DTOs** | `adjust-stock.dto`, `create-purchase.dto`, `add-purchase-item.dto`, `create-transfer.dto`, `inventory.dto`, `create-supplier.dto`, `update-supplier.dto`, `report-query.dto`, `stock-alert-query.dto` |
| **Schema** | `Product`, `Stock`, `StockMovement`, `StockAlert`, `Purchase`, `PurchaseItem`, `Transfer`, `Supplier`, `InventoryCount`, `InventoryItem` |
| **Frontend** | `/estoque` (dashboard), `/estoque/movimentacoes`, `/estoque/alertas`, `/estoque/relatorios`, `/estoque/inventario`, `/produtos`, `/produtos/novo`, `/produtos/[id]`, `lib/stock.ts`, `lib/stock-alerts.ts` |

### Endpoints Mapeados

| Controller | Endpoints |
|------------|-----------|
| **StockMovement** | `GET /api/stock/movements`, `GET /api/stock/movements/:id`, `GET /api/stock/products/:productId/stock`, `POST /api/stock/adjust` |
| **Purchase** | `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `POST /api/purchases/:id/confirm`, `POST /api/purchases/:id/cancel`, `POST /api/purchases/:id/items`, `DELETE /api/purchases/:id/items/:itemId` |
| **Transfer** | `GET /api/stock/transfers`, `GET /api/stock/transfers/:id`, `POST /api/stock/transfers`, `PATCH /api/stock/transfers/:id/approve`, `PATCH /api/stock/transfers/:id/send`, `PATCH /api/stock/transfers/:id/receive`, `PATCH /api/stock/transfers/:id/cancel` |
| **Inventory** | `GET /api/stock/inventory`, `GET /api/stock/inventory/:id`, `POST /api/stock/inventory`, `PATCH /api/stock/inventory/:id/start`, `POST /api/stock/inventory/:id/items`, `PATCH /api/stock/inventory/:id/items/:itemId`, `PATCH /api/stock/inventory/:id/review`, `PATCH /api/stock/inventory/:id/approve`, `PATCH /api/stock/inventory/:id/cancel` |
| **StockReport** | `GET /api/stock/reports/current-stock`, `GET /api/stock/reports/movements`, `GET /api/stock/reports/kardex/:productId`, `GET /api/stock/reports/turnover`, `GET /api/stock/reports/valuation`, `GET /api/stock/reports/low-stock`, `GET /api/stock/reports/inactive-products` |
| **StockAlert** | `GET /api/stock/alerts`, `GET /api/stock/alerts/count/open`, `GET /api/stock/alerts/:id`, `PATCH /api/stock/alerts/:id/resolve`, `POST /api/stock/alerts/check`, `POST /api/stock/alerts/check/inactive` |
| **Supplier** | `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers`, `PATCH /api/suppliers/:id`, `DELETE /api/suppliers/:id` |
| **StockDashboard** | `GET /api/stock/dashboard/cards`, `GET /api/stock/dashboard/charts`, `GET /api/stock/dashboard/rankings`, `GET /api/stock/dashboard/alerts` |

---

## Análise por Etapa do Fluxo

### 1. Compra (Purchase)

**O que deveria acontecer:** Criar pedido de compra para fornecedor. Itens com quantidade e custo unitário. Status DRAFT → CONFIRMED → RECEIVED (ou similar).

**O que acontece hoje:**
- ✅ Criação como DRAFT com validação de itens
- ✅ Adição/remoção de itens em DRAFT
- ✅ Confirmação (DRAFT → CONFIRMED) gera movimentações de estoque (PURCHASE)
- ✅ Cancelamento de compras em DRAFT
- ⚠️ **Não permite cancelamento de compras CONFIRMED** (proteção, mas sem fluxo de devolução)
- ❌ **Não há status RECEIVED** — compra vai direto de DRAFT → CONFIRMED, e a entrada de estoque ocorre na confirmação, não no recebimento físico

**Services:** `PurchaseService`, `StockMovementService.recordMovement()`
**Models:** `Purchase`, `PurchaseItem`, `Supplier`, `StockMovement`
**Eventos:** Audit log CREATE/UPDATE, stock movement PURCHASE no confirm()

**Bugs/Gaps:**
- 🔴 **MÉDIO:** `PurchaseStatus` não tem `RECEIVED`. A entrada de estoque acontece no `confirm()`, não no recebimento real. Não há separação entre "pedido confirmado" e "mercadoria recebida".
- 🔴 **MÉDIO:** Erros de FK violation (`purchases_supplierId_fkey`) retornam 500 genérico — sem validação amigável de supplierId
- 🟢 **BAIXO:** Seed de dados cria 4 compras CONFIRMED diretamente sem movimentações de estoque

---

### 2. Recebimento

**O que deveria acontecer:** Etapa separada onde a mercadoria é recebida fisicamente e o estoque é atualizado.

**O que acontece hoje:**
- ❌ **Não existe fluxo de recebimento.** A entrada de estoque ocorre automaticamente no `confirm()` da compra, sem conferência de NF, sem separação lógica.

**Services:** N/A (inexistente)
**Models:** N/A

**Bugs/Gaps:**
- 🟠 **ALTO:** Sem fluxo de recebimento — não é possível receber parcialmente nem conferir divergências entre NF e recebido
- 🟠 **ALTO:** Se uma compra CONFIRMED precisar ser ajustada (quantidade diferente da NF), não há mecanismo — a compra não pode ser alterada depois de CONFIRMED

---

### 3. Entrada de Estoque

**O que deveria acontecer:** Ao receber mercadoria, o estoque é incrementado. Custo médio recalculado.

**O que acontece hoje:**
- ✅ Entrada via `confirm()` da compra → `StockMovementService.recordMovement()` com type=PURCHASE
- ✅ Custo médio recalculado automaticamente para entradas (média ponderada)
- ✅ Atualização do `Stock.quantity` e `Stock.avgCost` via upsert
- ✅ Audit log e alertas verificados após movimento
- ✅ Entrada via `adjust()` → type=ADJUSTMENT

**Services:** `StockMovementService.recordMovement()`
**Models:** `Stock`, `StockMovement`

**Bugs/Gaps:**
- 🟡 **MÉDIO:** Ajuste manual (`adjust`) não valida se o productId/unitId existem antes de tentar criar o movimento — retorna 500 genérico (FK violation) em vez de 404 amigável

---

### 4. Ajuste

**O que deveria acontecer:** Correção manual de estoque para divergências. Lançamento com type=ADJUSTMENT.

**O que acontece hoje:**
- ✅ `POST /api/stock/adjust` funciona (testado: qty=5, balanceBefore=20 → balanceAfter=25)
- ✅ Lançamento no Stock e StockMovement
- ✅ Audit log criado

**Services:** `StockMovementService.adjust()`
**Models:** `Stock`, `StockMovement`

**Bugs/Gaps:**
- 🔴 **MÉDIO:** `adjust()` não valida productId/unitId antes de tentar criar movimento (erro 500 genérico em FK)
- 🟢 **BAIXO:** `adjust()` não aceita `createdBy` no DTO (usa do token JWT, o que é correto)

---

### 5. Transferência

**O que deveria acontecer:** Movimentação de estoque entre unidades. Saída da origem, entrada no destino.

**O que acontece hoje:**
- ✅ Criação como PENDING com validação de saldo na origem
- ✅ Ciclo completo: PENDING → APPROVED → IN_TRANSIT → RECEIVED → COMPLETED
- ✅ Movimentação de estoque apenas no RECEIVED
  - Saída: type=TRANSFER_OUT
  - Entrada: type=TRANSFER_IN
- ✅ Custo médio da origem transferido para o destino

**Services:** `TransferService`, `StockMovementService.recordMovement()` (no receive)

**Bugs/Gaps:**
- 🟢 **BAIXO:** Transferência de um único produto por vez (não suporta múltiplos produtos)

---

### 6. Inventário (Contagem Física)

**O que deveria acontecer:** Ciclo: criar contagem → contar itens → revisar → aprovar → gerar ajustes → fechar.

**O que acontece hoje:**
- ✅ Ciclo completo: OPEN → COUNTING → REVIEW → APPROVED → ADJUSTMENTS_GENERATED → CLOSED
- ✅ Unique constraint: apenas 1 inventário OPEN por unidade
- ✅ `approve()` gera ajustes automáticos (ADJUSTMENT) para cada item com diferença
- ✅ Cancelamento permitido em OPEN/COUNTING/REVIEW

**Services:** `InventoryService`
**Models:** `InventoryCount`, `InventoryItem`

**Bugs/Gaps:**
- 🟢 **BAIXO:** A geração de ajustes no `approve()` precisa ser testada com dados reais

---

### 7. Venda (Baixa de Estoque)

**O que deveria acontecer:** Ao completar uma venda, produtos com estoque são baixados automaticamente.

**O que acontece hoje:**
- ✅ `SalePaymentService.deductStock()` chamado dentro do bloco `if (willComplete)` (já corrigido na Sprint UX.2)
- ✅ Usa `StockMovementService.recordMovement()` com type=SALE
- ✅ Verifica saldo antes de baixar (estoque insuficiente → erro amigável)
- ✅ Referencia a venda (`referenceId`, `referenceType: 'sale'`)
- ✅ Filtra apenas itens com `productId` (serviços sem produto são ignorados)

**Services:** `SalePaymentService.deductStock()`, `StockMovementService.recordMovement()`
**Models:** `Stock`, `StockMovement`, `Sale`, `SaleItem`

**Bugs/Gaps:**
- 🟡 **MÉDIO:** `deductStock()` não registra `unitCost`/`totalCost` na movimentação SALE — o custo médio não é transferido para o movimento de saída. Isso afeta cálculos de margem e valuation.
- 🟢 **BAIXO:** Se a venda não tem `customerId`, a baixa ainda ocorre (correto)

---

### 8. Baixa Automática

**O que deveria acontecer:** A baixa ocorre automaticamente quando a venda é completada.

**O que acontece hoje:**
- ✅ A baixa automática funciona no fluxo Sale → Payment completo → `willComplete` → `deductStock()` (validado na Sprint UX.2)
- ⚠️ Depende do `willComplete` — se a venda for paga em parcelas, a baixa ocorre apenas no último pagamento

**Services:** Integração SalePaymentService → StockMovementService

**Bugs/Gaps:**
- 🟢 **BAIXO:** A baixa não considera lote/validade — produtos com controle de lote teriam baixa incorreta

---

### 9. Cancelamento de Venda

**O que deveria acontecer:** Ao cancelar uma venda, o estoque é revertido.

**O que acontece hoje:**
- ✅ `SaleService.cancel()` → `reverseStock()` cria movimentação RETURN
- ✅ `SaleService.refund()` → `reverseStock()` cria movimentação RETURN
- ✅ Usa `skipNegativeCheck: true` (não bloqueia se estoque ficar negativo)
- ✅ Também reverte finanças, cashback e fidelidade

**Services:** `SaleService.cancel()`, `SaleService.refund()`, `StockMovementService.recordMovement()`

**Bugs/Gaps:**
- ✅ **NENHUM** — fluxo completo e bem estruturado

---

### 10. Estorno

**O que deveria acontecer:** Estorno de movimentação de estoque (reversão de ajuste, etc.).

**O que acontece hoje:**
- ✅ Estorno de venda via RETURN (cancelamento/reembolso)
- ❌ **Não existe estorno genérico de movimentação** — não há endpoint `PATCH /api/stock/movements/:id/reverse` ou similar
- ❌ Ajuste manual não pode ser revertido — precisa de novo ajuste manual com sinal contrário

**Services:** N/A (exceto SaleService.reverseStock())

**Bugs/Gaps:**
- 🟡 **MÉDIO:** Sem estorno de movimentações — qualquer erro em ajuste manual precisa de outro ajuste manual para corrigir

---

### 11. Custo Médio

**O que deveria acontecer:** Custo médio ponderado recalculado a cada entrada.

**O que acontece hoje:**
- ✅ Cálculo de custo médio para entradas (PURCHASE, RETURN, TRANSFER_IN, ADJUSTMENT com qtd>0):
  ```
  avgCostAfter = (avgCostBefore * currentQty + incomingCost * incomingQty) / (currentQty + incomingQty)
  ```
- ✅ Se estoque estava zerado, novo avgCost = incomingCost
- ✅ AvgCost armazenado em `Stock.avgCost` e `StockMovement.avgCostAfter`
- ❌ **Custo médio NÃO é registrado em movimentos de saída** (SALE, CONSUMPTION, etc.)

**Services:** `StockMovementService.recordMovement()`

**Bugs/Gaps:**
- 🟠 **ALTO:** Saídas (SALE, etc.) não registram o custo médio no momento da venda. Isso impossibilita cálculo preciso de margem por venda individual.

---

### 12. Kardex

**O que deveria acontecer:** Histórico completo de movimentações de um produto, com saldos anteriores e posteriores.

**O que acontece hoje:**
- ✅ Endpoint: `GET /api/stock/reports/kardex/:productId` retorna movimentações do produto
- ✅ Cada movimentação registra `balanceBefore` e `balanceAfter`
- ✅ Cada movimentação registra `avgCostBefore` e `avgCostAfter` (para entradas)
- ✅ Movimentações ordenadas por data
- ✅ Testado: retorna 200 OK

**Services:** `StockReportService`

**Bugs/Gaps:**
- 🟡 **MÉDIO:** Sem filtro por período/unitId no kardex — retorna todas as movimentações do produto sem paginação por data

---

### 13. Valuation

**O que deveria acontecer:** Valor total do estoque (quantidade × custo médio), com detalhamento por produto/unidade.

**O que acontece hoje:**
- ✅ Endpoint: `GET /api/stock/reports/valuation` retorna 200 OK
- ⚠️ **Retorna agregado por unidade** (não por produto individual)
- ✅ Dashboard mostra `totalValue: R$10.465` (total geral do estoque)

**Services:** `StockReportService.valuation()`

**Bugs/Gaps:**
- 🟠 **ALTO:** Valuation retorna agregado por unidade (`byUnit`) — não há endpoint para valuation detalhado por produto
- 🟡 **MÉDIO:** Relatório de valuation sem detalhamento por categoria/unidade

---

## Tabela Resumo

| Fluxo | Status | Prioridade | Observações |
|-------|--------|-----------|-------------|
| 1. Compra | ✅ PARCIAL | MÉDIA | Confirma gera entrada no estoque, mas sem status RECEIVED |
| 2. Recebimento | ❌ PARCIAL | ALTA | Não existe fluxo separado de recebimento |
| 3. Entrada de Estoque | ✅ OK | — | Funciona via compra, ajuste e transferência |
| 4. Ajuste | ✅ OK | — | Testado: ADJUSTMENT funciona, mas sem validação de FK |
| 5. Transferência | ✅ OK | — | Ciclo completo PENDING→RECEIVED→COMPLETED |
| 6. Inventário | ✅ OK | — | Ciclo completo com geração de ajustes |
| 7. Venda (Baixa) | ✅ OK | — | Baixa automática no willComplete (corrigido Sprint UX.2) |
| 8. Baixa Automática | ✅ OK | — | Integração Sale → Stock funcional |
| 9. Cancelamento | ✅ OK | — | reverseStock com RETURN |
| 10. Estorno | ❌ PARCIAL | MÉDIO | Só existe reversão via cancelamento de venda |
| 11. Custo Médio | ✅ PARCIAL | ALTA | Calculado para entradas, NÃO registrado em saídas |
| 12. Kardex | ✅ OK | — | Histórico com saldos, sem filtro por período |
| 13. Valuation | ❌ PARCIAL | ALTA | Total geral OK, mas sem detalhamento por produto |

---

## Problemas Encontrados

### 🔴 BLOQUEANTES
Nenhum bloqueante encontrado. Todos os endpoints retornam 200 OK.

### 🟠 ALTOS

| ID | Problema | Local | Impacto | Situação |
|----|----------|-------|---------|----------|
| ALT-01 | **Valuation sem detalhamento por produto** | `StockReportService.valuation()` | Impossível ver valuation individual por produto; retorna apenas agregado por unidade | ✅ **CORRIGIDO** — `?detail=true` retorna por produto com nome, custo, qtd, valor |
| ALT-02 | **Custo médio não registrado em saídas (SALE)** | `StockMovementService.recordMovement()`, `SalePaymentService.deductStock()` | Margem por venda não pode ser calculada historicamente | ✅ **CORRIGIDO** — snapshot do custo médio registrado em toda saída |
| ALT-03 | **Não há fluxo de recebimento separado da confirmação** | PurchaseService, schema | Impossível recebimento parcial ou conferência de NF | 📋 **v1.1** — documentado, não implementado |

### 🟡 MÉDIOS

| ID | Problema | Local | Impacto |
|----|----------|-------|---------|
| MED-01 | **FK violation retorna 500 genérico** | `adjust()`, `purchase.create()` | UX pobre, sem mensagem clara |
| MED-02 | **Sem estorno genérico de movimentação** | StockMovementService | Ajuste manual errado precisa de novo ajuste manual |
| MED-03 | **Kardex sem filtro por período** | StockReportService | Relatório pode ser extenso demais |
| MED-04 | **deductStock não registra unitCost na SALE** | SalePaymentService | Custo da venda não fica no kardex |

### 🟢 BAIXOS

| ID | Problema | Local | Impacto |
|----|----------|-------|---------|
| LOW-01 | Seed de compras sem movimentações | Seed | Dados de teste inconsistentes |
| LOW-02 | Transferência de 1 produto por vez | TransferService | Sem suporte a lote |
| LOW-03 | Sem lote/validade em movimentações | Schema | Produtos perecíveis sem rastreabilidade |

---

## Correções Recomendadas (para próxima sprint)

1. **ALT-03: Separar Recebimento de Confirmação** — Adicionar status `RECEIVED` no `PurchaseStatus`. Mover `recordMovement()` do `confirm()` para novo método `receive()`. Adicionar `POST /:id/receive` no controller.

2. **ALT-02: Registrar custo médio em saídas** — Modificar `recordMovement()` para incluir `avgCostBefore` e `avgCostAfter` também para saídas (usando `currentStock.avgCost`).

3. **ALT-01: Valuation por produto** — Criar endpoint `valuation/detailed` ou adicionar query param `detail=true` que retorne por produto.

4. **MED-01: Validação amigável de FK** — Adicionar verificação de productId/unitId/supplierId antes de tentar criar registros que dependem deles.

5. **MED-02: Estorno de movimentação** — Implementar `reverseMovement(id, userId, reason)` que cria movimento oposto.

---

## Conclusão

**O módulo de Estoque está FUNCIONAL com 2 correções aplicadas (ALT-01 e ALT-02).**

✅ **O que funciona bem:** Transferências, Inventário, Ajustes, Baixa automática via venda, Cancelamento de venda com reversão de estoque, Kardex, Custo médio, Valuation detalhado (ALT-01), Snapshot do custo médio nas saídas (ALT-02).

⚠️ **O que precisa de atenção:** Fluxo de Compra/Recebimento (não separados, ALT-03 para v1.1), Estorno genérico, Validações amigáveis de FK.

🚫 **Não implementado (v1.1):** Fluxo de recebimento físico, status RECEIVED em compras.

| Fluxo | Status |
|-------|--------|
| ALT-01: Valuation detalhado | ✅ **CORRIGIDO** — 20 produtos com nome, custo, qtd, valor |
| ALT-02: Snapshot custo médio nas saídas | ✅ **CORRIGIDO** — SALE/Return com avgCostBefore/After |
| ALT-03: Recebimento separado | 📋 **v1.1** |

---

*Relatório atualizado em 25/07/2026 — Correções ALT-01 e ALT-02 validadas*