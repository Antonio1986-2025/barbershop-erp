# Post-Release Plan — v1.0

**Data:** 25/07/2026
**Status:** ✅ EM PRODUÇÃO CONTROLADA

---

## 1. Status Atual do Projeto

| Item | Valor |
|------|-------|
| **Versão atual** | 1.0 |
| **Data da certificação** | 25/07/2026 |
| **Último commit** | `014ce4b` (v1.0.1 — Estabilização) |
| **Branch principal** | `main` |
| **Status operacional** | ✅ Certificado para uso operacional |
| **Repositório** | [github.com/Antonio1986-2025/barbershop-erp](https://github.com/Antonio1986-2025/barbershop-erp) |

---

## 2. Política de Manutenção

Enquanto a versão 1.0 estiver em uso, o projeto seguirá as seguintes regras:

### ✅ Permitido
- **Correções de bugs** — qualquer bug que impeça o uso normal do sistema
- **Melhorias pequenas de UX** — textos confusos, botões sem feedback, alinhamento, cores
- **Melhorias de performance** — queries lentas, carregamentos demorados, sem alteração arquitetural
- **Correções de segurança** — **prioridade máxima**, implementação imediata
- **Atualização de dependências** — apenas correções de segurança (CVEs)

### ❌ Bloqueado
- **Novas funcionalidades** — não implementar nada não documentado
- **Alteração de arquitetura** — não reestruturar módulos, não refatorar camadas
- **Alteração de banco de dados** — exceto para corrigir bug crítico
- **Alteração de regras de negócio** — cashback, fidelidade, desconto, etc.

### Processo de aprovação rápida
Correções de segurança e bugs críticos podem ser implementados **sem aguardar sprint**.
Demais correções podem ser agrupadas em patches semanais.

---

## 3. Classificação de Chamados

| Tipo | Prioridade | Exemplo |
|------|:----------:|---------|
| **SEGURANÇA** | 🔴 Crítica | Vazamento de dados, autenticação quebrada, injeção |
| **BUG** | 🟠 Alta | Fluxo quebrado, dado inconsistente, tela em branco |
| **PERFORMANCE** | 🟡 Média | Query lenta (> 2s), dashboard demorado |
| **UX** | 🟢 Baixa | Texto confuso, botão sem feedback, estado vazio |
| **REGRA DE NEGÓCIO** | 🟡 Média | Comportamento incorreto mas funcional |
| **NOVA FUNCIONALIDADE** | 🔵 Planejamento | Adiada para v1.1 |

---

## 4. Processo de Correção

```
1. REGISTRAR
   Identificar o problema, documentar no chamado.
   Incluir: o que acontece × o que deveria acontecer.

       ↓

2. REPRODUZIR
   Executar o fluxo afetado para confirmar o bug.
   Registrar passo-a-passo da reprodução.

       ↓

3. CORRIGIR
   Aplicar a menor correção possível.
   Não alterar arquitetura.
   Não adicionar funcionalidades.

       ↓

4. TESTAR
   Reexecutar o fluxo completo afetado.
   Verificar que a correção não quebrou outros fluxos.

       ↓

5. ATUALIZAR DOCUMENTAÇÃO
   Registar a correção no relatório de versão.
   Commit com descrição clara do problema e da solução.

       ↓

6. LIBERAR PATCH
   Push para main.
   Atualizar versão (v1.0.x).
```

---

## 5. Versionamento

```
v1.0.1  — 25/07/2026  —  Estabilização pós-certificação
                         (catches silenciosos → logging)

v1.0.2  —  (próximo)   —  [chamados reportados]

v1.0.3  —  (futuro)    —  [chamados reportados]

v1.1.0  —  (planejado)  —  Novas funcionalidades
```

### Convenção
- **Patch** (`v1.0.x`): correção de bug, segurança, UX, performance
- **Minor** (`v1.1.0`): novas funcionalidades
- **Major** (`v2.0.0`): quebra de compatibilidade ou reescrita

---

## 6. Roadmap da Versão 1.1

As seguintes funcionalidades estão documentadas e aprovadas como candidatas para v1.1:

| Funcionalidade | Origem | Complexidade |
|---------------|--------|:------------:|
| **Comissão dos profissionais** | Relatório de auditoria | Média |
| **Portal/Tela do barbeiro** | Relatório de auditoria | Alta |
| **Recebimento separado de compras** | ALT-03 (review-stock-flow) | Média |
| **CustomerScore persistido** | REG-01 (review-crm-flow) | Baixa |
| **Campanhas avançadas** | REG-02 (review-crm-flow) | Média |
| **Automações avançadas** | REG-03 (review-crm-flow) | Média |
| **Relatórios gerenciais** | Release v1.0 | Alta |

### Prioridade sugerida (pela complexidade)
1. CustomerScore persistido (baixa complexidade, alto valor)
2. Recebimento separado de compras (média, completa fluxo de estoque)
3. Campanhas e automações (média, complementa CRM)
4. Comissão (média, depende de definição de regras)
5. Portal do barbeiro (alta, nova interface)
6. Relatórios gerenciais (alta, depende de dados históricos)

---

## 7. Critério para Iniciar a Versão 1.1

A versão 1.1 **somente poderá começar** após:

1. ✅ **Uso real do sistema** — o ERP precisa estar rodando em produção, com dados reais
2. ✅ **Registro das melhorias** — bugs e pedidos reportados pelos usuários reais
3. ✅ **Priorização das demandas** — o dono do projeto (Antonio) define a ordem
4. ✅ **Aprovação do roadmap** — revisão e aprovação do plano para v1.1

### Gatilho formal
Um novo documento `docs/planning/v1.1-plan.md` deve ser criado antes do início da sprint v1.1.

---

## Status do Projeto

```
╔══════════════════════════════════════════════╗
║                                              ║
║         EM PRODUÇÃO CONTROLADA               ║
║                                              ║
║   Versão atual: 1.0                          ║
║   Certificada em: 25/07/2026                 ║
║   Último patch: v1.0.1                       ║
║                                              ║
║   Mantenimento ativo até início da v1.1      ║
║                                              ║
╚══════════════════════════════════════════════╝

Próxima versão planejada: v1.1.0
```

---

*Documento gerado automaticamente por Hermes Agent — Post-Release Plan v1.0*
