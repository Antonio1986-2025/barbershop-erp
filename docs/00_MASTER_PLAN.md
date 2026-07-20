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

---

# 7. Arquitetura Geral do Sistema

## 7.1 Modelo SaaS

O sistema será desenvolvido como uma plataforma SaaS (Software as a Service).

Uma única aplicação atenderá múltiplas empresas, garantindo isolamento completo dos dados entre clientes.

Cada empresa possuirá:

- Usuários próprios.
- Unidades próprias.
- Clientes próprios.
- Profissionais próprios.
- Agenda própria.
- Financeiro próprio.
- Estoque próprio.

Nenhuma empresa poderá acessar dados de outra.

---

# 7.2 Modelo Multiempresa (Multi-tenant)

O sistema utilizará arquitetura multi-tenant.

A estrutura principal será:


Plataforma
↓
Empresa
↓
Unidades
↓
Dados Operacionais


Todos os registros operacionais deverão possuir vínculo obrigatório com uma empresa.

Exemplo:


Empresa
├── Usuários
├── Unidades
├── Clientes
├── Profissionais
├── Serviços
├── Produtos
├── Agenda
├── Comandas
├── Caixa
└── Financeiro


---

# 7.3 Modelo Multiunidade

Uma empresa poderá possuir uma ou várias unidades.

Cada unidade terá:

- Configurações próprias.
- Horário de funcionamento.
- Equipe vinculada.
- Caixa independente.
- Estoque independente.
- Agenda independente.

Exemplo:


Empresa X

Unidade Centro
    ↓
    Agenda
    Caixa
    Estoque

Unidade Shopping
    ↓
    Agenda
    Caixa
    Estoque

---

# 7.4 Separação de Responsabilidades

O sistema será dividido em módulos independentes.

Cada módulo terá responsabilidade própria.

Exemplo:

## Clientes

Responsável por:

- Cadastro.
- Histórico.
- Dados pessoais.

Não é responsável por:

- Pagamentos.
- Estoque.
- Financeiro.

---

## Agenda

Responsável por:

- Horários.
- Reservas.
- Disponibilidade.

Não é responsável por:

- Recebimentos.
- Estoque.

---

## Comanda

Responsável por:

- Registrar atendimento.
- Serviços executados.
- Produtos consumidos.
- Valores cobrados.

---

## Caixa

Responsável por:

- Recebimentos.
- Movimentações financeiras do caixa.

---

## Financeiro

Responsável por:

- Consolidação financeira.
- Receitas.
- Despesas.
- Relatórios.

---

# 7.5 Fluxo Oficial de Dados

O fluxo principal do sistema será:


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


Este fluxo representa a origem oficial das informações financeiras.

Nenhum valor financeiro deverá existir sem origem rastreável.

---

# 7.6 Módulos Principais

O sistema será organizado nos seguintes módulos:

## Administração

- Empresas.
- Unidades.
- Usuários.
- Permissões.
- Configurações.

---

## Operação

- Agenda.
- Clientes.
- Profissionais.
- Serviços.
- Comandas.
- Caixa.

---

## Gestão

- Financeiro.
- Produtos.
- Fornecedores.
- Compras.
- Entrada XML.
- Estoque.
- Inventário.
- Transferências.

---

## Controle

- Auditoria.
- Relatórios.
- Histórico.

---

# 7.7 Princípios Técnicos

A arquitetura deverá seguir:

## Modularidade

Cada módulo deverá possuir baixo acoplamento.

---

## Escalabilidade

Novos módulos poderão ser adicionados sem alterar módulos existentes.

---

## Segurança

Toda operação deverá respeitar:

- autenticação;
- autorização;
- empresa;
- unidade;
- permissões.

---

## Rastreabilidade

Toda operação crítica deverá possuir histórico.

---

# 7.8 Evolução Futura

A arquitetura deverá permitir futuramente:

- Aplicativo mobile.
- Portal do cliente.
- Integração WhatsApp.
- Integração com pagamentos.
- Marketplace.
- Inteligência Artificial.
- BI.

Sem necessidade de reconstrução da base principal.

---

# Fim do Capítulo 2

---

# 8. Estrutura dos Módulos

O sistema será dividido em módulos independentes.

Cada módulo possuirá:

- Objetivo definido.
- Responsabilidades próprias.
- Regras de negócio específicas.
- Dependências documentadas.
- Critérios de aceite.
- Testes próprios.

Nenhum módulo deverá assumir responsabilidades pertencentes a outro.

---

# 8.1 Módulos do Sistema

## Módulo 01 — Fundação e Infraestrutura

Responsável por:

- Configuração inicial do sistema.
- Ambiente de desenvolvimento.
- Banco de dados.
- Autenticação base.
- Estrutura técnica.

Dependências:

Nenhuma.

---

# Módulo 02 — Empresas

Responsável por:

- Cadastro da empresa.
- Dados administrativos.
- Plano contratado.
- Configurações gerais.

Regras principais:

- Toda empresa possui isolamento de dados.
- O plano contratado controla funcionalidades disponíveis.

Dependências:

- Infraestrutura.

---

# Módulo 03 — Unidades

Responsável por:

- Cadastro de unidades.
- Configurações individuais.
- Horários.
- Dados operacionais.

Dependências:

- Empresas.

---

# Módulo 04 — Usuários e Permissões

Responsável por:

- Usuários do sistema.
- Perfis de acesso.
- Permissões.

Perfis iniciais:

- Administrador da Empresa.
- Gerente.
- Recepcionista.
- Caixa.
- Barbeiro.

Observação:

Usuário e Profissional são entidades diferentes.

Dependências:

- Empresas.
- Unidades.

---

# Módulo 05 — Clientes

Responsável por:

- Cadastro de clientes.
- Histórico de atendimento.
- Dados de contato.

Regra principal:

O telefone será o identificador principal dentro da empresa.

Dependências:

- Empresas.
- Unidades.

---

# Módulo 06 — Profissionais (Barbeiros)

Responsável por:

- Cadastro de barbeiros.
- Comissão.
- Horários.
- Folgas.
- Especialidades.

Um profissional poderá estar vinculado a um usuário do sistema.

Dependências:

- Empresas.
- Unidades.
- Usuários.

---

# Módulo 07 — Serviços

Responsável por:

- Cadastro de serviços.
- Preços.
- Duração.
- Comissão.

Dependências:

- Empresas.
- Unidades.

---

# Módulo 08 — Agenda

Responsável por:

- Agendamentos.
- Disponibilidade.
- Bloqueios.
- Folgas.
- Horários.

Regras:

- Não permitir conflito de horários.
- Respeitar horário da unidade.
- Respeitar bloqueios.

Dependências:

- Clientes.
- Profissionais.
- Serviços.
- Unidades.

---

# Módulo 09 — Comandas

Responsável por:

- Atendimento.
- Serviços realizados.
- Produtos consumidos.
- Valores.
- Histórico.

Regra principal:

Após fechamento, dados tornam-se históricos.

Dependências:

- Agenda.
- Serviços.
- Produtos.
- Clientes.

---

# Módulo 10 — Caixa

Responsável por:

- Abertura.
- Recebimentos.
- Sangrias.
- Suprimentos.
- Fechamento.

Regra principal:

Nenhum pagamento sem caixa aberto.

Dependências:

- Comandas.

---

# Módulo 11 — Financeiro

Responsável por:

- Receitas.
- Despesas.
- Fluxo financeiro.
- Comissões.
- Relatórios.

Dependências:

- Caixa.
- Comandas.

---

# Módulo 12 — Produtos

Responsável por:

Cadastro mestre de produtos.

Não movimenta estoque.

Inclui:

- Nome.
- Categoria.
- Marca.
- Código.
- Preço.
- Unidade de medida.

Dependências:

- Empresas.

---

# Módulo 13 — Fornecedores

Responsável por:

- Cadastro de fornecedores.
- Histórico de relacionamento.

Dependências:

- Empresas.

---

# Módulo 14 — Compras

Responsável por:

- Pedidos.
- Compras.
- Histórico.

Dependências:

- Produtos.
- Fornecedores.

---

# Módulo 15 — Entrada de Mercadorias

Responsável por:

- Entrada manual.
- Importação XML.
- Conferência de notas.

Atualiza:

- Estoque.

Dependências:

- Produtos.
- Fornecedores.
- Compras.

---

# Módulo 16 — Estoque

Responsável por:

- Saldo.
- Movimentações.
- Consumo.
- Baixas.

Regra:

Estoque negativo não permitido.

Dependências:

- Produtos.
- Entradas.
- Comandas.

---

# Módulo 17 — Inventário

Responsável por:

- Contagem física.
- Ajustes.
- Divergências.

Dependências:

- Estoque.

---

# Módulo 18 — Transferências

Responsável por:

- Transferência entre unidades.
- Histórico de movimentação.

Dependências:

- Unidades.
- Estoque.

---

# Módulo 19 — Relatórios

Responsável por:

- Indicadores.
- Relatórios operacionais.
- Relatórios financeiros.

Dependências:

Todos os módulos.

---

# Módulo 20 — Auditoria

Responsável por:

- Logs.
- Histórico.
- Rastreamento.

Dependências:

Todos os módulos críticos.

---

# 8.2 Ordem Estratégica de Desenvolvimento

A ordem definida é:


01 Fundação

↓

02 Empresas

↓

03 Unidades

↓

04 Usuários e Permissões

↓

05 Clientes

↓

06 Profissionais

↓

07 Serviços

↓

08 Agenda

↓

09 Comandas

↓

10 Caixa

↓

11 Financeiro

↓

12 Produtos

↓

13 Fornecedores

↓

14 Compras

↓

15 Entrada XML

↓

16 Estoque

↓

17 Inventário

↓

18 Transferências

↓

19 Relatórios

↓

20 Auditoria


---

# Fim do Capítulo 3

---

# 9. Regras Globais do Sistema

Estas regras são obrigatórias para todos os módulos.

Elas definem comportamentos que não podem ser alterados por implementações específicas.

---

# 9.1 Caixa

## RG001 — Caixa obrigatório

Não é permitido receber pagamentos sem caixa aberto.

Comportamento:

- Bloquear pagamento.
- Exibir:

"Abra o caixa antes de receber pagamentos."

---

## RG002 — Apenas um caixa aberto

Cada unidade poderá possuir apenas um caixa aberto por dia.

---

## RG003 — Fechamento do caixa

Não é permitido fechar o caixa com comandas pendentes.

O sistema deverá apresentar as pendências.

---

## RG004 — Caixa fechado

Após o fechamento não é permitido:

- Receber pagamentos.
- Registrar retiradas.
- Registrar suprimentos.

---

## RG005 — Reabertura

Caixas fechados não podem ser reabertos.

Correções deverão utilizar ajustes financeiros.

---

# 9.2 Comandas

## RG006 — Origem

Toda comanda deve possuir origem rastreável.

Origem principal:

Agendamento.

---

## RG007 — Criação

A comanda será criada automaticamente quando o agendamento for confirmado.

Status inicial:

ABERTA.

---

## RG008 — Fechamento

Após fechada, uma comanda não retorna para ABERTA.

---

## RG009 — Histórico

Após fechamento não é permitido alterar:

- preço;
- quantidade;
- barbeiro;
- comissão;
- pagamento.

Os dados tornam-se históricos.

---

## RG010 — Estoque

Produtos somente baixam estoque após fechamento da comanda.

---

# 9.3 Agenda

## RG011 — Sobreposição

Não pode existir conflito de horário para o mesmo barbeiro.

---

## RG012 — Bloqueios

Não permitir agendamento durante:

- folgas;
- bloqueios;
- horários indisponíveis.

---

## RG013 — Horário da unidade

Não permitir agendamento fora do horário configurado.

---

## RG014 — Duração

Alteração de duração deve validar conflitos.

---

## RG015 — Cancelamento

Ao cancelar um agendamento:

- liberar horário;
- cancelar comanda vinculada;
- registrar auditoria.

---

## RG016 — Não comparecimento

Quando marcado como não compareceu:

- atualizar status;
- cancelar comanda;
- liberar horário.

---

# 9.4 Atendimento e Caixa

## RG017 — Independência do barbeiro após abertura da comanda

Após a criação da comanda, o fluxo poderá continuar pelo caixa.

O caixa poderá:

- conferir atendimento;
- finalizar comanda;
- receber pagamento.

O barbeiro não precisa obrigatoriamente concluir uma etapa no sistema para permitir o pagamento.

---

## RG018 — Fluxo oficial


Agenda

↓

Chegada

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


---

# 9.5 Financeiro

## RG019 — Receita

Receitas somente existem após fechamento da comanda.

---

## RG020 — Comissão

Comissões são calculadas no fechamento da comanda.

---

## RG021 — Despesas

Despesas nunca são apagadas fisicamente.

Utilizar:

- cancelamento;
- estorno;
- ajuste.

---

# 9.6 Estoque

## RG022 — Estoque negativo

O sistema nunca permitirá estoque negativo.

---

## RG023 — Baixa

A baixa ocorre somente através de movimentação oficial.

Exemplos:

- venda;
- ajuste;
- entrada;
- transferência.

---

## RG024 — Produtos vendidos

Produtos utilizados em histórico de venda não podem ser excluídos.

Somente inativados.

---

# 9.7 Clientes

## RG025 — Identificação

O telefone é o identificador principal do cliente dentro da empresa.

---

## RG026 — Exclusão

Clientes não podem ser excluídos.

Somente inativados.

---

## RG027 — Histórico

Histórico de atendimento nunca pode ser apagado.

---

# 9.8 Profissionais

## RG028 — Exclusão

Barbeiros com histórico não podem ser excluídos.

---

## RG029 — Comissão

Alterações futuras não alteram históricos.

---

## RG030 — Usuário e barbeiro

Um barbeiro pode possuir diferentes permissões.

Exemplos:

- Dono + barbeiro.
- Gerente + barbeiro.
- Administrador + barbeiro.

---

# 9.9 Auditoria

## RG031 — Operações auditadas

Devem gerar registro:

- pagamento;
- cancelamento;
- fechamento de caixa;
- alteração financeira;
- alteração de comissão;
- alterações críticas.

---

## RG032 — Dados da auditoria

Registrar:

- usuário;
- data;
- hora;
- operação;
- registro afetado;
- valores anteriores;
- valores posteriores.

---

# 9.10 Integridade dos Dados

## RG033 — Exclusão física

Não permitido excluir:

- clientes;
- profissionais;
- agendamentos;
- comandas;
- movimentações financeiras.

---

## RG034 — Snapshot histórico

Valores históricos nunca dependem do cadastro atual.

Exemplos:

- preço;
- comissão;
- produto;
- serviço.

---

## RG035 — Alteração de preço

Novos preços afetam somente novos registros.

---

## RG036 — Troca de barbeiro

Permitida somente antes do encerramento.

Deve respeitar conflitos de agenda.

---

# 9.11 Segurança

## RG037 — Permissões

Toda ação deve validar permissão do usuário.

---

## RG038 — Autenticação

Operações críticas exigem usuário autenticado.

---

## RG039 — Rastreabilidade financeira

Todo valor financeiro deve possuir origem:


Agendamento

↓

Comanda

↓

Pagamento

↓

Caixa

↓

Financeiro

↓

Relatórios


---

# Fim do Capítulo 4

---

# 10. Premissas Arquiteturais

Estas premissas definem as diretrizes técnicas obrigatórias do sistema.

Elas devem ser respeitadas durante todo o desenvolvimento.

---

# 10.1 Integridade Transacional

Toda operação crítica deverá ocorrer dentro de uma transação de banco de dados.

Exemplos:

- Criar agendamento e comanda.
- Receber pagamento e atualizar caixa.
- Fechar comanda e atualizar estoque.
- Fechar caixa e gerar resumo financeiro.

Regra:

Caso uma etapa falhe, toda a operação deverá ser revertida.

Nunca poderão existir dados parcialmente gravados.

---

# 10.2 Histórico Imutável

Dados históricos não podem ser alterados.

Exemplos:

- preço;
- comissão;
- forma de pagamento;
- valor recebido;
- serviço executado;
- produto vendido.

Correções deverão utilizar:

- ajustes;
- estornos;
- novos lançamentos.

---

# 10.3 Exclusão Lógica

Registros operacionais não devem ser removidos fisicamente.

Utilizar status.

Exemplos:

- Ativo.
- Inativo.
- Cancelado.

Aplicável a:

- clientes;
- profissionais;
- produtos;
- serviços;
- usuários;
- agendamentos;
- movimentações.

---

# 10.4 Auditoria Obrigatória

Toda operação crítica deve gerar auditoria.

O registro deve possuir:

- usuário;
- data;
- hora;
- módulo;
- ação;
- registro afetado;
- valores anteriores;
- valores posteriores;
- motivo quando necessário.

---

# 10.5 Arquitetura Multi-tenant

O sistema deverá suportar múltiplas empresas.

Todos os dados deverão possuir vínculo obrigatório com a empresa.

Regra:

Nenhuma empresa poderá acessar informações de outra.

---

# 10.6 Segurança

O sistema deverá utilizar controle baseado em permissões.

Toda funcionalidade deverá validar:

- usuário autenticado;
- empresa;
- unidade;
- perfil;
- permissão.

---

# 10.7 Performance

Objetivos iniciais:

Dashboard:
até 2 segundos.

Agenda:
até 2 segundos.

Pesquisa de clientes:
até 1 segundo.

Abertura de comanda:
até 1 segundo.

Consultas deverão ser otimizadas conforme crescimento do volume de dados.

---

# 10.8 Escalabilidade

A arquitetura deverá permitir novos módulos sem reconstrução.

Exemplos futuros:

- WhatsApp;
- aplicativo;
- fidelidade;
- marketplace;
- BI;
- inteligência artificial.

---

# 10.9 Integrações Externas

Integrações não devem bloquear operações principais.

Exemplos:

- WhatsApp;
- e-mail;
- pagamentos;
- APIs externas.

Em caso de falha:

- registrar erro;
- manter operação principal;
- realizar nova tentativa quando aplicável.

---

# 10.10 Consistência Financeira

Todo valor financeiro deverá possuir origem rastreável.

Fluxo oficial:


Agendamento

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


Nenhuma receita ou despesa poderá surgir sem origem.

---

# 10.11 Padrão das Entidades

Todas as tabelas deverão possuir:

- ID único;
- Empresa;
- Data de criação;
- Data de atualização;
- Usuário responsável;
- Status.

Quando necessário:

- Data de exclusão lógica;
- Usuário responsável;
- Motivo.

---

# 10.12 Design System

Todo sistema deverá utilizar padrão visual único.

Abrange:

- botões;
- tabelas;
- formulários;
- modais;
- menus;
- cores;
- tipografia;
- ícones;
- espaçamentos;
- responsividade.

---

# 10.13 Documentação Obrigatória

Nenhuma funcionalidade será considerada concluída sem:

- documentação atualizada;
- regras revisadas;
- testes realizados;
- validação funcional;
- aprovação.

---

# 10.14 Backup e Recuperação

O sistema deverá possuir:

- backups automáticos;
- restauração controlada;
- registro de falhas;
- plano de recuperação.

---

# 10.15 Observabilidade

O sistema deverá registrar eventos importantes.

Exemplos:

- erros;
- falhas de integração;
- problemas de autenticação;
- lentidão;
- exceções.

Os registros não devem expor dados sensíveis.

---

# Fim do Capítulo 5

---

# 11. Fluxos Operacionais Oficiais

Esta seção define os fluxos oficiais do sistema.

Todos os módulos deverão respeitar estes processos.

---

# 11.1 Fluxo Principal — Atendimento Completo

Objetivo:

Representar o ciclo completo de atendimento.


Cliente

↓

Agendamento

↓

Confirmação

↓

Chegada

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

# 11.2 Fluxo de Agendamento


Cliente solicita horário

↓

Selecionar serviço

↓

Selecionar barbeiro

↓

Validar disponibilidade

↓

Horário disponível?

Não
  ↓
Informar conflito

Sim
  ↓

Criar agendamento

↓

Criar comanda ABERTA

↓

Aguardar atendimento


Regras:

- Não permitir conflito de horários.
- Respeitar horário da unidade.
- Respeitar folgas e bloqueios.

---

# 11.3 Fluxo de Atendimento


Cliente chega

↓

Atendimento iniciado

↓

Serviço realizado

↓

Adicionar produtos (opcional)

↓

Finalizar atendimento

↓

Enviar para caixa


---

# 11.4 Continuidade pelo Caixa

Após a criação da comanda, o fluxo não depende obrigatoriamente do barbeiro.

Situação:

O barbeiro iniciou outro atendimento sem registrar a conclusão no sistema.

Comportamento:

O caixa poderá:

- localizar a comanda;
- conferir serviços;
- ajustar informações permitidas;
- finalizar atendimento;
- receber pagamento.

Regra:

A comanda aberta permite continuidade operacional independente do barbeiro.

---

# 11.5 Fluxo de Cancelamento


Cancelar agendamento

↓

Existe comanda?

Não
↓
Liberar horário

Sim
↓
Cancelar comanda

↓

Registrar auditoria


---

# 11.6 Fluxo de Não Comparecimento


Horário expirado

↓

Cliente compareceu?

Não

↓

Status:
Não Compareceu

↓

Cancelar comanda

↓

Liberar horário

↓

Registrar histórico


---

# 11.7 Venda de Produto sem Agendamento


Cliente no balcão

↓

Selecionar produtos

↓

Criar comanda de venda

↓

Verificar caixa aberto

↓

Receber pagamento

↓

Baixar estoque

↓

Registrar financeiro


---

# 11.8 Fluxo de Abertura do Caixa


Início do expediente

↓

Verificar caixa aberto

↓

Existe?

Sim
↓
Bloquear nova abertura

Não
↓

Informar valor inicial

↓

Abrir caixa

↓

Registrar auditoria


---

# 11.9 Fluxo de Fechamento do Caixa


Solicitar fechamento

↓

Verificar comandas abertas

↓

Existem?

Sim
↓
Apresentar pendências

Não
↓

Conferir valores

↓

Informar dinheiro contado

↓

Existe diferença?

Sim
↓
Solicitar justificativa

↓

Fechar caixa

↓

Registrar auditoria


---

# 11.10 Fluxo de Comissão


Comanda fechada

↓

Calcular comissão

↓

Disponibilizar para profissional

↓

Selecionar período

↓

Confirmar pagamento

↓

Registrar financeiro

↓

Auditoria


---

# 11.11 Fluxo de Estorno/Reembolso

Quando permitido pela política da empresa.


Selecionar comanda

↓

Pagamento confirmado?

Não
↓
Encerrar

Sim
↓

Solicitar estorno

↓

Administrador aprova?

Não
↓
Encerrar

Sim
↓

Registrar estorno

↓

Atualizar caixa

↓

Atualizar financeiro

↓

Auditoria


---

# 11.12 Fluxo de Remarcação

Remarcação não é cancelamento.


Selecionar agendamento

↓

Alterar data/hora

↓

Validar disponibilidade

↓

Atualizar agendamento

↓

Manter histórico

↓

Registrar auditoria


---

# 11.13 Fluxo de Troca de Barbeiro

Permitido somente antes do encerramento.


Solicitar troca

↓

Validar disponibilidade

↓

Alterar barbeiro

↓

Atualizar comissão conforme regra

↓

Registrar auditoria


---

# 11.14 Fluxo de Bloqueio de Horário


Selecionar barbeiro

↓

Selecionar período

↓

Existem agendamentos?

Sim
↓
Solicitar confirmação

Não
↓

Criar bloqueio

↓

Atualizar agenda


---

# 11.15 Princípio Geral dos Fluxos

Todo processo deve possuir:

- origem identificada;
- responsável;
- validações;
- histórico;
- auditoria.

Nenhuma operação crítica poderá ocorrer sem rastreabilidade.

---

# Fim do Capítulo 6

---

# 12. Usuários, Perfis e Permissões

Este capítulo define como o sistema controla acesso e responsabilidades.

---

# 12.1 Conceito Principal

Usuário e Profissional são entidades diferentes.

## Usuário

Representa uma pessoa que acessa o sistema.

Possui:

- login;
- senha;
- permissões;
- perfil de acesso.

---

## Profissional (Barbeiro)

Representa uma pessoa que executa serviços.

Possui:

- agenda;
- serviços realizados;
- comissão;
- histórico de atendimentos.

---

Um usuário poderá estar vinculado a um profissional.

Exemplo:


João

Usuário:
Administrador

Profissional:
Barbeiro


---

# 12.2 Acúmulo de Funções

O sistema deverá permitir múltiplas funções para o mesmo usuário.

Exemplos:

## Proprietário

Pode ser:

- Administrador da empresa.
- Barbeiro.

---

## Gerente

Pode ser:

- Gerente.
- Barbeiro.

---

## Administrador

Pode ser:

- Administrador.
- Barbeiro.

---

## Regra

A permissão de acesso não deve depender da função executada como profissional.

Ela deve ser controlada pelo módulo de permissões.

---

# 12.3 Perfis Iniciais

## Administrador da Plataforma

Responsável pelo sistema SaaS.

Pode:

- Gerenciar plataforma.
- Gerenciar planos.
- Administrar empresas.
- Controlar recursos globais.

---

## Administrador da Empresa

Responsável pela empresa contratante.

Pode:

- Gerenciar unidades.
- Criar usuários.
- Configurar permissões.
- Visualizar todos os dados da empresa.
- Gerenciar configurações.

Observação:

Criação de unidades depende do plano contratado.

---

## Gerente

Responsável pela operação da unidade.

Pode:

- Gerenciar agenda.
- Acompanhar equipe.
- Gerenciar clientes.
- Visualizar relatórios permitidos.
- Operar processos da unidade.

---

## Recepcionista

Responsável pelo atendimento inicial.

Pode:

- Cadastrar clientes.
- Criar agendamentos.
- Alterar agendamentos permitidos.
- Consultar agenda.

---

## Caixa

Responsável pela operação financeira do caixa.

Pode:

- Abrir caixa.
- Receber pagamentos.
- Registrar movimentações permitidas.
- Fechar caixa conforme permissão.

---

## Barbeiro

Responsável pela execução dos serviços.

Pode:

- Visualizar sua agenda.
- Consultar seus atendimentos.
- Atualizar etapas permitidas do atendimento.

---

# 12.4 Permissões

As permissões serão baseadas em ações.

Exemplo:


Módulo
↓
Funcionalidade
↓
Ação


Exemplo:


Agenda

Visualizar agenda
Criar agendamento
Alterar agendamento
Cancelar agendamento

---

# 12.5 Permissões Customizadas

O sistema deverá permitir criar permissões adicionais.

Exemplo:

Um barbeiro pode receber:

- acesso ao caixa;
- acesso a relatórios;
- acesso ao cadastro de clientes.

Sem alterar seu perfil principal.

---

# 12.6 Regra por Plano Contratado

Algumas funcionalidades poderão depender do plano contratado.

Exemplo:

Plano básico:

- 1 unidade.

Plano profissional:

- múltiplas unidades.

Plano avançado:

- recursos adicionais.

A permissão deverá considerar:


Plano contratado

↓

Permissão do usuário

↓

Acesso permitido


---

# 12.7 Hierarquia de Acesso

Modelo:


Administrador Plataforma

    ↓

Administrador Empresa

    ↓

Gerente

    ↓

Operadores

    ↓

Barbeiros


---

# 12.8 Segurança

Toda ação deverá validar:

- usuário autenticado;
- empresa;
- unidade;
- permissão;
- plano contratado.

---

# 12.9 Auditoria

Alterações de permissões devem gerar auditoria.

Registrar:

- quem alterou;
- data;
- usuário afetado;
- permissão anterior;
- nova permissão;
- motivo.

---

# Fim do Capítulo 7

---

# 13. Planos, Assinaturas e Limitações

Este capítulo define como o sistema SaaS controla recursos conforme o plano contratado pela empresa.

---

# 13.1 Conceito de Plano

Um plano representa o conjunto de recursos e limites disponíveis para uma empresa.

Cada empresa estará vinculada a um plano ativo.

Exemplo:


Empresa

↓

Plano Contratado

↓

Recursos Liberados

↓

Limites Aplicados


---

# 13.2 Objetivos

O sistema deverá permitir:

- Diferentes níveis de contratação.
- Liberação de funcionalidades.
- Controle de limites.
- Evolução de planos.
- Crescimento do cliente.

---

# 13.3 Estrutura do Plano

Um plano poderá possuir:

- Nome.
- Descrição.
- Valor.
- Periodicidade.
- Status.
- Recursos liberados.
- Limites.

---

# 13.4 Exemplos de Limitações

Os planos poderão controlar:

## Unidades

Exemplo:

Plano básico:

- 1 unidade.

Plano profissional:

- múltiplas unidades.

---

## Usuários

Exemplo:

Plano básico:

- quantidade limitada.

Plano avançado:

- usuários ilimitados.

---

## Recursos

Exemplo:

Plano básico:

- Agenda.
- Clientes.
- Serviços.

Plano avançado:

- Estoque.
- Financeiro.
- Relatórios avançados.

---

# 13.5 Regra de Acesso

A permissão final deverá considerar:


Plano contratado

Permissão do usuário

Configuração da empresa

=

Acesso permitido


---

# 13.6 Criação de Unidades

A criação de unidades deverá respeitar o plano contratado.

Fluxo:


Administrador Empresa

↓

Solicita nova unidade

↓

Sistema verifica limite do plano

↓

Permitido?

Sim
↓
Criar unidade

Não
↓
Informar necessidade de upgrade


---

# 13.7 Alteração de Plano

Alterações de plano deverão preservar os dados existentes.

Exemplo:

Upgrade:

- Libera novos recursos.

Downgrade:

- Bloqueia novos recursos.
- Mantém dados históricos.

---

# 13.8 Bloqueios por Plano

O sistema nunca deverá apagar dados devido a alteração de plano.

Exemplo:

Empresa possui 5 unidades.

Plano reduzido permite 1 unidade.

Comportamento:

- Manter unidades existentes.
- Bloquear novas operações incompatíveis.
- Solicitar regularização.

---

# 13.9 Assinaturas

O sistema deverá estar preparado para futuras integrações de cobrança.

Possíveis integrações:

- Gateway de pagamento.
- Cartão recorrente.
- PIX recorrente.

---

# 13.10 Status da Assinatura

Exemplos:


Ativa

↓

Em atraso

↓

Suspensa

↓

Cancelada


---

# 13.11 Auditoria

Alterações de plano deverão gerar registro:

- empresa;
- plano anterior;
- novo plano;
- usuário responsável;
- data;
- motivo.

---

# 13.12 Evolução Futura

O modelo deverá permitir futuramente:

- planos personalizados;
- módulos adicionais;
- cobrança por uso;
- usuários extras;
- unidades extras;
- marketplace;
- integrações premium.

---

# Fim do Capítulo 8

---

# 14. Modelo de Dados e Integridade

Este capítulo define os princípios de organização dos dados do sistema.

O objetivo é garantir:

- consistência;
- rastreabilidade;
- histórico;
- segurança;
- evolução futura.

---

# 14.1 Princípio Geral

O banco de dados deverá representar fielmente as regras do negócio.

Nenhum dado crítico deverá existir sem relacionamento ou origem identificada.

---

# 14.2 Identificação dos Registros

Toda entidade deverá possuir:

- identificador único;
- empresa vinculada;
- data de criação;
- data de atualização;
- usuário responsável;
- status.

---

# 14.3 Estrutura Multiempresa

Todos os dados operacionais deverão possuir vínculo obrigatório com uma empresa.

Exemplo:


Empresa

↓

Unidades

↓

Clientes

↓

Agendamentos

↓

Comandas

↓

Financeiro


Regra:

Nenhuma consulta poderá retornar dados de outra empresa.

---

# 14.4 Estrutura Multiunidade

Quando aplicável, os registros deverão possuir vínculo com uma unidade.

Exemplos:

- agenda;
- caixa;
- estoque;
- profissionais;
- movimentações.

---

# 14.5 Entidades Principais

## Empresa

Representa o cliente SaaS.

Possui:

- dados cadastrais;
- plano contratado;
- configurações.

---

## Unidade

Representa uma loja física.

Possui:

- endereço;
- horários;
- equipe;
- configurações.

---

## Usuário

Representa acesso ao sistema.

Possui:

- autenticação;
- permissões;
- histórico.

---

## Profissional

Representa o barbeiro.

Possui:

- comissão;
- agenda;
- serviços executados.

---

## Cliente

Representa o consumidor final.

Possui:

- dados pessoais;
- histórico de atendimento.

---

## Serviço

Representa serviços oferecidos.

Possui:

- nome;
- duração;
- preço;
- comissão.

---

## Produto

Representa itens comercializados.

Possui:

- cadastro;
- preço;
- informações comerciais.

---

## Fornecedor

Representa origem das mercadorias.

---

## Agendamento

Representa uma reserva de horário.

Relaciona:

- cliente;
- profissional;
- serviço;
- unidade.

---

## Comanda

Representa o atendimento financeiro.

Relaciona:

- cliente;
- serviços;
- produtos;
- profissional;
- pagamento.

---

## Caixa

Representa movimentação financeira operacional.

Relaciona:

- abertura;
- recebimentos;
- retiradas;
- fechamento.

---

## Financeiro

Representa consolidação financeira.

Origem:


Comanda

↓

Pagamento

↓

Caixa

↓

Financeiro


---

# 14.6 Snapshot Histórico

Dados históricos devem ser armazenados no momento do evento.

Exemplo:

Serviço cadastrado:


Corte

Preço atual:
R$ 50


Atendimento realizado:


Comanda

Serviço:
Corte

Preço aplicado:
R$ 45


Alterações futuras não podem modificar históricos.

---

# 14.7 Integridade Financeira

Todo lançamento financeiro deverá possuir:

- origem;
- valor;
- data;
- usuário;
- referência.

Exemplo:


Financeiro

↓

Pagamento

↓

Comanda

↓

Cliente


---

# 14.8 Movimentação de Estoque

O estoque deverá ser controlado por movimentações.

Nunca alterar saldo diretamente.

Exemplo:


Entrada XML

Venda

Transferência

Ajuste

=

Saldo Atual


---

# 14.9 Exclusão de Dados

Não será permitida exclusão física de registros críticos.

Aplicar:

- status;
- cancelamento;
- inativação.

---

# 14.10 Auditoria dos Dados

Alterações importantes deverão registrar:

- usuário;
- data;
- ação;
- registro afetado;
- valores anteriores;
- valores novos.

---

# 14.11 Consistência entre Módulos

Os módulos deverão se comunicar através de regras oficiais.

Exemplo:

Agenda:

cria atendimento.

↓

Comanda:

registra execução.

↓

Pagamento:

registra recebimento.

↓

Caixa:

movimenta valores.

↓

Financeiro:

consolida.

---

# 14.12 Preparação para Evolução

O modelo deverá permitir futuras expansões:

- aplicativo cliente;
- franquias;
- integrações;
- BI;
- IA;
- novos módulos.

---

# Fim do Capítulo 9
