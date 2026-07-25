# Regras do Projeto — Barbershop ERP

## Sprint Freeze Policy

A partir da Sprint UX.0.1, toda sprint funcional concluída e aprovada será considerada **CONGELADA**.

### Regras

1. **Não adicionar novas funcionalidades** em módulos congelados.
2. **Apenas corrigir bugs** encontrados durante a UAT (User Acceptance Testing).
3. **Melhorias de UX ou novas ideias** ficam para a versão 1.1 ou superior.
4. **Evitar retrabalho** e mudanças desnecessárias após o congelamento.
5. **Prioridade absoluta:** finalizar todas as funcionalidades principais do sistema (versão 1.0).

### Módulos Congelados

| Módulo | Sprint | Status | Data |
|---|---|---|---|
| Clientes (Regra de Domínio) | UX.0.1 | ✅ CONGELADO | 2026-07-24 |

### Módulos em Andamento / Pendentes

| Módulo | Sprint | Status |
|---|---|---|
| Agendamento | — | 🔍 Auditoria |
| Produtos | — | Pendente |
| Estoque | — | Pendente |
| PDV / Comanda | — | Pendente |
| Ordem de Serviço | — | Pendente |
| Financeiro | — | Pendente |
| CRM | — | Pendente |

---

## Política de Aplicação dos PADRÕES-BR

Os **PADRÕES-BR** (`C:\Users\Admin\ferramentas\PADROES-BR.md`) são uma biblioteca de boas práticas reutilizada em vários projetos. Neste Barbershop ERP, eles **não devem ser aplicados automaticamente**.

### Checklist de Análise (obrigatório antes de implementar)

Antes de implementar qualquer padrão, responder:

1. **O padrão já existe no sistema?**
   - Sim / Não / Parcialmente
2. **O padrão precisa apenas ser padronizado?** (ex.: campo de preço sem máscara → aplicar máscara)
   - Sim / Não
3. **O padrão cria funcionalidade nova?** (ex.: criar comanda automática, cancelamento por no-show)
   - Sim / Não
4. **Qual o impacto na arquitetura?** (nova injeção de dependência, novo módulo, novo fluxo)
   - Descrever
5. **Qual o impacto na UAT?** (testes existentes quebram, novos testes necessários)
   - Descrever

### Regras de Decisão

1. Se o padrão **apenas melhora UX ou padroniza comportamento** sem alterar regras de negócio → pode ser sugerido e implementado com aprovação.
2. Se o padrão **cria novas regras de negócio, novas automações ou novos fluxos** → apenas documentar e aguardar aprovação em sprint planning.
3. Se o padrão **altera módulo já CONGELADO** → não implementar, documentar para versão futura.
4. Toda implementação deve ser precedida de uma **análise por escrito** (pode ser nesta conversa) com os 5 pontos acima, seguida de aprovação explícita do usuário.
