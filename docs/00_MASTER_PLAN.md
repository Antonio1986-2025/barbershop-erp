# Sistema de Gestão para Barbearias (ERP)

## Documento Mestre - MASTER PLAN

Versão: 0.1.0  
Status: Em Planejamento  

---

# 1. Visão Geral

O Sistema de Gestão para Barbearias (ERP) tem como objetivo centralizar e automatizar todos os processos operacionais, administrativos e financeiros de uma barbearia.

O sistema será desenvolvido como uma plataforma SaaS, permitindo que diferentes empresas utilizem a solução com isolamento completo dos seus dados.

A plataforma deverá atender desde pequenas barbearias até redes com múltiplas unidades, mantendo uma arquitetura escalável, segura e preparada para futuras expansões.

---

# 2. Objetivos do Projeto

## Objetivo Principal

Criar um ERP especializado no segmento de barbearias, cobrindo todo o ciclo operacional:


Cliente
↓
Agendamento
↓
Atendimento
↓
Comanda
↓
Pagamento
↓
Caixa
↓
Financeiro
↓
Comissão
↓
Relatórios


---

## Objetivos Específicos

O sistema deverá permitir:

- Gestão de empresas e unidades.
- Gestão de usuários e permissões.
- Gestão de profissionais (barbeiros).
- Gestão de clientes.
- Controle completo de agenda.
- Gestão de serviços.
- Gestão de comandas.
- Controle de caixa.
- Gestão financeira.
- Controle de produtos.
- Gestão de fornecedores.
- Compras.
- Entrada de mercadorias por XML.
- Controle de estoque.
- Inventário.
- Transferência entre unidades.
- Relatórios gerenciais.
- Auditoria completa das operações.

---

# 3. Público-Alvo

O sistema será destinado a:

- Barbearias individuais.
- Barbearias com equipe.
- Barbearias premium.
- Redes de barbearias.
- Franquias (futuro).

---

# 4. Escopo Inicial

O sistema inicial contemplará:

## Operação

- Agenda.
- Atendimento.
- Comanda.
- Pagamento.
- Caixa.

## Gestão

- Clientes.
- Profissionais.
- Serviços.
- Produtos.
- Estoque.
- Financeiro.

## Administração

- Empresas.
- Unidades.
- Usuários.
- Permissões.
- Auditoria.
- Configurações.

---

# 5. Fora do Escopo Inicial

Funcionalidades futuras:

- Aplicativo próprio para clientes.
- Marketplace.
- Programa de fidelidade.
- Assinaturas.
- Inteligência Artificial.
- BI avançado.
- Integrações adicionais.
- Emissão fiscal completa.

Essas funcionalidades poderão ser adicionadas futuramente sem alterar a arquitetura principal.

---

# 6. Filosofia do Projeto

## P001 - Documentação como fonte oficial

A documentação aprovada representa a verdade do projeto.

Qualquer alteração de comportamento deverá primeiro ser registrada e aprovada na documentação antes da implementação.

---

## P002 - Desenvolvimento orientado por módulos

O sistema será desenvolvido em módulos independentes.

Cada módulo deverá possuir:

- Especificação.
- Regras de negócio.
- Fluxos.
- Critérios de aceite.
- Testes.
- Revisão.

---

## P003 - Qualidade acima de velocidade

O projeto prioriza uma base sólida.

Decisões rápidas que comprometam manutenção ou escalabilidade deverão ser evitadas.

---

## P004 - Sistema configurável

O sistema deverá atender diferentes tipos de barbearias através de configurações.

Evitar customizações específicas por cliente.

---

## P005 - Histórico preservado

Informações históricas nunca deverão ser sobrescritas.

Correções deverão utilizar ajustes, mantendo rastreabilidade.

---

## P006 - Auditoria obrigatória

Operações críticas deverão gerar registros de auditoria.

Exemplos:

- pagamentos;
- cancelamentos;
- alterações financeiras;
- alterações de comissão;
- fechamento de caixa.

---

## P007 - Arquitetura preparada para crescimento

O sistema deverá permitir evolução futura sem necessidade de reconstrução.

---

## P008 - Separação entre Usuário e Profissional

Usuário do sistema e profissional (barbeiro) são entidades diferentes.

Um usuário poderá estar vinculado a um profissional, porém suas permissões serão independentes.

Exemplos:

- Proprietário pode ser administrador e barbeiro.
- Gerente pode ser gerente e barbeiro.
- Barbeiro pode possuir acesso limitado ao sistema.

---

# Fim do Capítulo 1
