# Dashboard — Especificação Técnica de API

## Decisão Arquitetural

✅ Não criar tabelas novas.

O Dashboard será uma camada de leitura sobre os dados existentes.

```
Banco Operacional
        │
        ▼
Dashboard Service
        │
        ▼
API REST
        │
        ▼
Frontend Dashboard
```

---

## Backend — Módulo Dashboard

```
backend/src/modules/dashboard/
├── dashboard.module.ts
├── dashboard.controller.ts
├── dashboard.service.ts
├── dto/
│   ├── dashboard-filter.dto.ts
│   └── dashboard-response.dto.ts
```

---

## Filtros Padrão (DTO)

```typescript
class DashboardFilter {
  companyId: string;
  unitId?: string;
  startDate: Date;
  endDate: Date;
}
```

Todos os indicadores respeitam:
- empresa obrigatória;
- unidade opcional;
- período obrigatório.

---

## APIs

### 1. Resumo Geral

```
GET /dashboard/summary
```

```json
{
  "revenue": 15000.00,
  "appointments": 230,
  "completedServices": 210,
  "averageTicket": 71.42,
  "customers": 180
}
```

### 2. Financeiro

```
GET /dashboard/financial
```

Dados: pagamentos recebidos, formas de pagamento, entradas, saídas, saldo.

Fonte: `payments`, `cash_transactions`

### 3. Operacional

```
GET /dashboard/operations
```

Dados: agendamentos, concluídos, cancelados, no-show.

Fonte: `appointments`, `service_orders`

### 4. Profissionais

```
GET /dashboard/professionals
```

Dados: atendimentos, faturamento, produtividade.

Fonte: `service_orders`, `professionals`

### 5. Serviços

```
GET /dashboard/services
```

Dados: mais vendidos, receita, quantidade.

Fonte: `service_order_items`, `services`

### 6. Estoque

```
GET /dashboard/stock
```

Dados: quantidade atual, movimentações, produtos críticos.

Fonte: `stocks`, `stock_movements`, `products`

---

## Índices Adicionais (Revisão Futura)

- `appointments(startAt, status)`
- `payments(paidAt, status)`
- `service_orders(createdAt, status)`
- `stock_movements(createdAt)`

Não criar agora sem necessidade.

---

## Critérios de Aceite Técnico

- Consultas isoladas por empresa.
- Sem duplicação de dados.
- Filtros reutilizáveis.
- Respostas agregadas.
- Tempo de consulta preparado para crescimento.
