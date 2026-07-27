# Release v1.0.6 — Estabilidade, Segurança e Preparação para v1.1

**Data:** 27/07/2026

---

## Resumo

Versão de estabilização com foco em correção de bugs críticos, reforço de segurança, novo módulo de WorkSchedule (feriados + ausências), testes automatizados e preparação do repositório para o ciclo v1.1.

## Bugs Corrigidos

| # | Bug | Gravidade | Arquivo | Causa Raiz |
|---|-----|:---------:|---------|------------|
| 1 | Comandas: "The string did not match" | 🔴 | `service-orders/page.tsx` | `localStorage.getItem('token')` — chave errada (`token` vs `barbershop_access_token`) |
| 2 | Barber pages: token nulo | 🔴 | 6 páginas `barber/*` | Mesmo bug da chave errada |
| 3 | Commission/Admin pages: token nulo | 🔴 | `commission`, `admin/system` | Mesmo bug |
| 4 | Usuários: token hardcoded | 🔴 | `usuarios/novo`, `usuarios/[id]` | `getToken()` não utilizado |
| 5 | PermissionsGuard ausente | 🟡 | 16 controllers | Controllers sem proteção de permissões |
| 6 | Middleware incompleto | 🟡 | `proxy.ts` | Rotas `/commission`, `/barber`, `/ajuda` etc. sem proteção |
| 7 | Backend logs versionados | 🟢 | `backend.log` | Adicionado ao `.gitignore` |

## Melhorias

| Área | Mudança |
|------|---------|
| **WorkSchedule** | Novo módulo: `Holiday` (feriados) + `ProfessionalAbsence` (ausências: férias, folga, bloqueio) |
| **Availability** | Feriados e ausências integrados ao cálculo de disponibilidade |
| **Segurança** | `PermissionsGuard` adicionado em 16 controllers |
| **Proxy** | Rotas faltantes adicionadas ao middleware |
| **Frontend libs** | `commission.ts` + `service-orders.ts` (token centralizado) |
| **Testes** | `schedule-availability.spec.ts` — 21 casos de teste |
| **Limpeza** | `.gitignore` expandido, logs removidos do versionamento |

## Arquivos Alterados

### Backend (16 arquivos)
- `prisma/schema.prisma` — +Holiday, +ProfessionalAbsence
- `src/app.module.ts` — +WorkScheduleModule
- `src/modules/work-schedule/` — 🆕 Novo módulo (controller, service, 2 DTOs)
- `src/modules/schedule/schedule.service.ts` — Integração feriados/ausências
- `src/modules/*.controller.ts` — 16 controllers com PermissionsGuard

### Frontend (12 arquivos)
- `src/app/(authenticated)/service-orders/page.tsx` — Fix token
- `src/app/(authenticated)/barber/*/page.tsx` — 6 páginas com fix token
- `src/app/(authenticated)/commission/page.tsx` — Fix token
- `src/app/(authenticated)/admin/system/page.tsx` — Fix token
- `src/app/(authenticated)/usuarios/*/page.tsx` — 2 páginas com fix token
- `src/proxy.ts` — Rotas protegidas adicionadas
- `src/lib/commission.ts` — 🆕 Lib de comissões
- `src/lib/service-orders.ts` — 🆕 Lib de service-orders
- `next.config.ts` — Configuração atualizada

### Infraestrutura
- `.gitignore` — Expandido (logs, cache, IDE, OS)
- `backend/test/unit/schedule/schedule-availability.spec.ts` — 🆕 21 testes

## Build

```
Backend:  0 erros ✅
Frontend: 0 erros ✅
Prisma:   Sincronizado ✅
```

## Fluxos Certificados

| Fluxo | Status |
|-------|:------:|
| Login ADMIN | ✅ |
| Abrir/Fechar Caixa | ✅ |
| CRUD Clientes | ✅ |
| CRUD Profissionais | ✅ |
| CRUD Serviços | ✅ |
| CRUD Produtos | ✅ |
| Agendamento + Slots | ✅ |
| Atendimento (fluxo completo) | ✅ |
| Comanda → Venda → Pagamento | ✅ |
| Comissão (cálculo, aprovação, fechamento) | ✅ |
| Barber Dashboard | ✅ |
| Barber Comissões | ✅ |
| Segurança (403 em rotas admin) | ✅ |
| Disponibilidade (feriados, ausências) | ✅ |

## Pendências para v1.1

- Frontend de configuração de expediente
- Frontend de bloqueios
- Frontend de feriados
- Dashboard analítico
- Relatórios exportáveis
- PWA otimizado
