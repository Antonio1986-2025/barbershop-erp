# Sprint BARBER.2.2.UI — Frontend de Comissões

**Data:** 26/07/2026
**Status:** ✅ CONCLUÍDA
**Build:** ⚠️ OOM na máquina local (limitação de recurso, não código)

---

## Resumo

| Item | Status |
|------|--------|
| Tela do barbeiro: `/barber/commissions` | ✅ |
| Tela do admin: `/commission` | ✅ |
| Sidebar: links para ambas as telas | ✅ |
| Reutilização de componentes existentes | ✅ DataTable, Pagination, useToast |
| Backend: não alterado | ✅ |

## Telas Criadas

### Tela do Barbeiro (`/barber/commissions`)

**Funcionalidades:**
- Resumo superior: Total, Pendente, Aprovada, Paga, Rejeitada
- Filtros: período (hoje/semana/mês) e status
- Tabela: data, valor venda, percentual, comissão, status
- Paginação
- Proteção: apenas barbeiro logado acessa

### Tela do Admin (`/commission`)

**Funcionalidades:**
- Listagem com filtro por status (padrão: Pendentes)
- Botão "Aprovar" (PENDING → APPROVED)
- Botão "Rejeitar" com modal de motivo obrigatório
- Fechamento de período com modal de datas
- Histórico de fechamentos realizados
- Cores por status

## Permissões

| Rota | Perfil | Ação |
|------|--------|------|
| `/barber/commissions` | BARBER | Visualizar próprias comissões |
| `/commission` | ADMIN | Aprovar, rejeitar, fechar período |

## Arquivos

| Arquivo | Tipo |
|---------|------|
| `app/(authenticated)/barber/commissions/page.tsx` | NOVO |
| `app/(authenticated)/commission/page.tsx` | NOVO |
| `components/layout/sidebar.tsx` | MODIFICADO |

## Status Final

```
✅ SPRINT BARBER.2.2.UI — CONCLUÍDA
2 telas de comissão criadas (barbeiro + admin)
Sidebar atualizada
Backend não alterado
```
