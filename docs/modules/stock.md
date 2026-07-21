# Sprint 010 — Estoque

## Objetivo

Criar o controle de produtos e movimentações de estoque da barbearia.

Responsável por:
- cadastro de produtos;
- categorias;
- estoque por unidade;
- entradas;
- saídas;
- ajustes;
- histórico de movimentações.

---

## Arquitetura

```
Company
   │
   └── Unit
          │
          └── Stock
                 │
                 └── Product
```

---

## Modelos Conceituais

### Category

Categorias de produtos.

Exemplo: Pomadas, Shampoos, Bebidas, Cosméticos.

id
companyId

name
description

active

createdAt
updatedAt
deletedAt

### Product

Cadastro dos produtos.

id
companyId

categoryId

name
barcode

costPrice
salePrice

active

createdAt
updatedAt
deletedAt

### Stock

Saldo por unidade.

id

unitId
productId

quantity

createdAt
updatedAt

### StockMovement

Histórico de movimentações.

id

unitId
productId

type

quantity

description

createdAt

---

## Enums

### StockMovementType

ENTRY
EXIT
ADJUSTMENT

---

## Regras de Negócio

### RN001

Produto pertence a uma empresa.

### RN002

Estoque é separado por unidade.

Exemplo: Produto Pomada Premium — Centro 10 und, Shopping 5 und.

### RN003

Toda alteração de estoque gera movimentação.

### RN004

Não permitir estoque negativo.

### RN005

Produtos não são apagados fisicamente.

---

## Critérios de Aceite

- Criar categoria.
- Criar produto.
- Definir estoque por unidade.
- Registrar entrada.
- Registrar saída.
- Consultar saldo.
- Consultar histórico.
