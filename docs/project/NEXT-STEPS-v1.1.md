# NEXT STEPS — v1.1

**Data:** 26/07/2026  
**Baseline:** v1.0.2 (`819638c`)  
**Objetivo:** Organizar a fila de desenvolvimento para a versão 1.1

---

## Critério para Iniciar a v1.1

Conforme definido no `post-release-plan.md`:

- [ ] Uso real do sistema em produção
- [ ] Registro das melhorias solicitadas pelos usuários
- [ ] Priorização das demandas
- [ ] Aprovação do roadmap

---

## PRIORIDADE ALTA

### 1. Comissão dos Profissionais

**Objetivo:** Calcular e registrar comissão de cada barbeiro sobre serviços e produtos vendidos, com aprovação gerencial e controle de pagamento.

**Dependências:**
- Profile BARBER (concluído na Sprint BARBER.1)
- Vinculo User ↔ Professional (concluído)
- Tabela `Commission` (modelo já documentado no `barber-domain.md`)

**Impacto:** Novo módulo (financeiro-operacional)  
**Complexidade:** 🔴 Alta  
**Estimativa:** 20h (3 sprints)

### 2. Portal do Barbeiro

**Objetivo:** Tela exclusiva para o barbeiro acessar seus dados, agendamentos e comissões sem depender do menu administrativo.

**Dependências:**
- Profile BARBER (concluído)
- Comissão (acima)

**Impacto:** Nova interface  
**Complexidade:** 🟡 Média  
**Estimativa:** 8h

---

## PRIORIDADE MÉDIA

### 3. Recebimento Separado de Compras

**Objetivo:** Separar o recebimento de compras do fluxo de venda, permitindo registrar entrada de estoque independente.

**Dependências:**
- Módulo Compras (existente)
- Módulo Estoque (existente)

**Impacto:** Alteração no fluxo de compras  
**Complexidade:** 🟡 Média  
**Estimativa:** 12h

### 4. CustomerScore Persistido

**Objetivo:** Salvar o score do cliente no banco (hoje é calculado sob demanda), permitindo consultas mais rápidas e criação de segmentos.

**Dependências:**
- Módulo CRM (existente)

**Impacto:** Performance + novas queries  
**Complexidade:** 🟡 Média  
**Estimativa:** 6h

### 5. Testes Automatizados

**Objetivo:** Criar suite de testes unitários e de integração para evitar regressões.

**Dependências:**
- Jest + Supertest (já disponíveis no projeto)

**Impacto:** Qualidade e prevenção de regressão  
**Complexidade:** 🟡 Média  
**Estimativa:** 20h

---

## PRIORIDADE BAIXA

### 6. Automações Avançadas

**Objetivo:** Expandir o sistema de automações para suportar triggers condicionais (ex.: "se cliente não volta há 30 dias → enviar WhatsApp").

**Dependências:**
- Módulo Automation (existente)

**Impacto:** CRM  
**Complexidade:** 🟢 Baixa  
**Estimativa:** 10h

### 7. Campanhas Avançadas

**Objetivo:** Segmentação dinâmica de clientes com regras customizadas.

**Dependências:**
- Módulo Campaign (existente)
- CustomerScore persistido (acima)

**Impacto:** Marketing  
**Complexidade:** 🟢 Baixa  
**Estimativa:** 8h

### 8. Relatórios Gerenciais

**Objetivo:** Relatórios exportáveis (PDF/Excel) com dados financeiros, operacionais e de performance.

**Dependências:**
- Todos os módulos operacionais

**Impacto:** Relatórios  
**Complexidade:** 🟢 Baixa  
**Estimativa:** 12h

### 9. CI/CD Pipeline

**Objetivo:** Automatizar build, testes e deploy.

**Dependências:**
- Testes automatizados (acima)

**Impacto:** DevOps  
**Complexidade:** 🟢 Baixa  
**Estimativa:** 6h

### 10. Loading States + Toasts no Frontend

**Objetivo:** Adicionar feedback visual para todas as operações.

**Dependências:**
- Nenhuma

**Impacto:** UX  
**Complexidade:** 🟢 Baixa  
**Estimativa:** 4h

---

## Resumo de Esforço

| Prioridade | Itens | Estimativa total |
|:----------:|:-----:|:----------------:|
| 🔴 Alta | 2 | 28h |
| 🟡 Média | 3 | 38h |
| 🟢 Baixa | 5 | 40h |
| **Total** | **10** | **~106h (~6 semanas)** |

---

*Documento gerado em 26/07/2026 — Próximos passos para v1.1*
