# Sprint 011 — Relatórios / Dashboard

## Objetivo

Criar a camada de indicadores e visão gerencial do ERP.

O Dashboard não será uma tabela de dados operacionais, mas uma camada de consulta sobre os módulos existentes.

---

## Arquitetura

```
Appointment
ServiceOrder
Payment
CashTransaction
StockMovement
Customer
Professional
        │
        ▼
   Dashboard / Reports
        │
        ▼
    Indicadores
```

---

## Dashboard Geral

Indicadores:
- Faturamento do período
- Quantidade de atendimentos
- Ticket médio
- Clientes atendidos
- Serviços realizados
- Profissionais ativos
- Produtos com estoque baixo

---

## Relatórios Iniciais

### Relatório Financeiro

Filtros: período, unidade, forma de pagamento.

Dados: faturamento, entradas, saídas, saldo.

### Relatório de Atendimento

Filtros: período, profissional, unidade.

Dados: quantidade, cancelamentos, concluídos, ticket médio.

### Relatório de Profissionais

Dados: atendimentos realizados, faturamento gerado, comissão estimada.

### Relatório de Serviços

Dados: serviços mais realizados, receita por serviço, quantidade.

### Relatório de Estoque

Dados: estoque atual, produtos abaixo do mínimo, movimentações.

---

## Decisão Arquitetural

Neste momento:

❌ Não criar tabelas de relatório.

Motivo: os dados já existem nas tabelas transacionais.

Usaremos: consultas SQL, Prisma queries, agregações.

Futuro: Materialized Views → Data Warehouse → BI.

---

## Critérios de Aceite

- Dashboard por empresa.
- Filtro por unidade.
- Período configurável.
- Indicadores financeiros.
- Indicadores operacionais.
- Consultas sem duplicar dados.
