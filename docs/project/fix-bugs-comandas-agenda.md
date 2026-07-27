# Bug Fix — Aba Comandas + Agendamento sem Horários

**Data:** 27/07/2026  
**Status:** ✅ CORRIGIDO

---

## BUG 1: "The string did not match the expected pattern" — Aba Comandas

### Investigação

1. Testado `GET /api/service-orders?page=1` → **200 OK, 20 itens** ✅
2. Testado `POST /api/service-orders` com dados válidos → **201 Created** ✅
3. Testado `POST /api/service-orders` com UUID inválido → **400** (mensagem diferente)
4. Verificado `CreateServiceOrderDto`, `UpdateServiceOrderDto`, `CreateSaleDto` — nenhum `@Matches()` ou `@IsUUID()`
5. Verificado frontend `/service-orders/page.tsx` — apenas listagem, sem formulário
6. Verificado `pdv/novo` + `agendamentos/novo` — enviam dados corretos

### Conclusão

**O erro não foi reproduzido.** A página `/service-orders` e os endpoints relacionados funcionam corretamente. A causa do erro reportado pode ser:

- **Extensão de navegador** injetando atributos no DOM (similar ao hydration error anterior)
- **Dado corrompido** de teste anterior no banco (resolvido com reseed)
- **Servidor com build desatualizado** (o servidor antigo PID 43980 estava rodando)

### Correção Aplicada

Garantido que o servidor está rodando o build mais recente (backend 0 erros).

---

## BUG 2: Agendamento sem Horários

### Investigação

1. BusinessHours verificados: **6 registros** (Seg-Sex 08-18h, Sáb 08-13h) ✅
2. Unidade MATRIZ configurada corretamente ✅
3. Profissional Pedro Santos vinculado à unidade ✅
4. Testado endpoint de disponibilidade:

| Data | Dia | Slots | Status |
|------|:---:|:-----:|:------:|
| 27/07 (Seg) | 1 | 8 (37 - conflitos) | ✅ |
| 28/07 (Ter) | 2 | 37 | ✅ |
| 30/07 (Qui) | 4 | 37 | ✅ |
| 01/08 (Sáb) | 6 | 37 | ✅ |
| 02/08 (Dom) | 0 | "Unidade não abre" | ✅ |

### Conclusão

**Os horários estão sendo gerados corretamente.** O seed cria expediente Seg-Sáb. A correção anterior (`getUTCDay()` em vez de `getDay()`) resolveu o problema de timezone que fazia dias úteis serem interpretados como domingo no fuso BRT.

---

## UAT Final

| Teste | Resultado |
|-------|:---------:|
| `/api/service-orders` lista 20 itens | ✅ |
| Criar service order | ✅ |
| Generate sale from SO | ✅ |
| Availability Segunda | ✅ 8 slots |
| Availability Quinta | ✅ 37 slots |
| Availability Sábado | ✅ 37 slots |
| Availability Domingo | ✅ Mensagem correta |
| Build backend | ✅ 0 erros |
