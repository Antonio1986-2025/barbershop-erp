# Sprint AGENDA.1 — Motor Profissional de Disponibilidade

**Data:** 27/07/2026  
**Status:** ✅ CONCLUÍDA

---

## O que foi implementado

### Schema
- `BusinessHour.professionalId` — Horário específico por profissional (opcional)
- Removido `@@unique([unitId, dayOfWeek])` — Permite múltiplos períodos por dia
- Adicionado `@@index([professionalId])` — Performance de consulta

### Motor de Disponibilidade
- Horários do profissional sobrescrevem horários da unidade (mais restritivo)
- Validação de duração total: serviço inteiro precisa caber no expediente
- Mensagens de erro específicas por condição
- Intervalos de 15min entre slots
- Bloqueios e conflitos verificados por período inteiro

### Mensagens de Erro
| Condição | Mensagem |
|----------|---------|
| Unidade sem expediente | "A unidade não abre neste dia" |
| Serviço maior que expediente | "O serviço selecionado (N min) não cabe no expediente disponível (HH:MM-HH:MM)" |
| Conflito com outro agendamento | "Existe outro atendimento neste horário" |
| Todos ocupados | "Todos os horários estão ocupados" |

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `schema.prisma` | +professionalId, -unique constraint, +index |
| `schedule.service.ts` | Motor reescrito: prof hours, duração total, mensagens |
| `create-business-hour.dto.ts` | +professionalId opcional |

## UAT

| Teste | Resultado |
|-------|:---------:|
| Segunda com expediente | ✅ 8 slots (37 - conflitos) |
| Domingo sem expediente | ✅ "A unidade não abre neste dia" |
| Serviço encaixa no período | ✅ Validação duração total |
| Conflitos detectados | ✅ Mensagem específica |
| Bloqueios respeitados | ✅ |
| Build backend | ✅ 0 erros |

## Pendências (fora do escopo)

- Tela frontend de configuração de expediente
- Tela de bloqueios
- Feriados e datas especiais
- Intervalo de almoço
