# Glossário — Barbershop ERP v1.0

## A

**Agendamento**
Compromisso de um cliente com um profissional para um serviço em data e hora específicas. Passa por status: SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED.

**Atendimento**
Execução do serviço no cliente. Inicia quando o cliente chega e termina quando o barbeiro conclui o trabalho.

**Auditoria**
Registro imutável de todas as operações realizadas no sistema (quem fez o quê e quando).

**Automação**
Regra que executa uma ação automaticamente quando um evento acontece. Ex: ao finalizar venda, criar tarefa de follow-up.

---

## C

**Caixa**
Controle do dinheiro em espécie na barbearia. Inclui abertura, fechamento, suprimento e retirada.

**Cashback**
Valor creditado ao cliente como benefício: 5% do total da venda. Fica disponível para próximas compras.

**CashTransaction**
Registro individual de movimentação no caixa (entrada ou saída). Criada automaticamente para cada pagamento em dinheiro.

**Comanda**
Ordem de serviço associada a um agendamento. Contém os itens (serviços e produtos) que serão cobrados.

**Compra**
Pedido de compra de produtos para um fornecedor. Após confirmada, dá entrada no estoque.

**Conta a Receber**
Registro financeiro gerado automaticamente ao finalizar uma venda. Representa o valor que a barbearia tem a receber.

**CRM (Customer Relationship Management)**
Conjunto de funcionalidades para gerenciar o relacionamento com clientes: perfil, score, segmentos, interações, cashback, fidelidade.

**Custo Médio**
Média ponderada do custo de aquisição de um produto. Recalculado automaticamente a cada entrada no estoque.

**CustomerInteraction**
Registro de interação com o cliente (cadastro, agendamento, atendimento, venda, pagamento). Criada automaticamente pelo sistema.

---

## D

**Dashboard**
Tela com indicadores de desempenho: faturamento, agendamentos, vendas, estoque.

**Desconto**
Redução no valor total da venda, aplicada antes do pagamento.

---

## E

**Entrada**
Movimentação de entrada de produto no estoque (compra, ajuste positivo, transferência recebida).

**Estoque**
Controle de quantidade e valor dos produtos disponíveis para venda.

---

## F

**Fidelidade (Loyalty)**
Programa de pontos acumulados por valor gasto em vendas.

**FinancialAccount**
Conta financeira gerada a cada venda (tipo: RECEIVABLE). Acompanha o status do recebimento.

**Follow-up**
Tarefa de acompanhamento pós-venda. Criada automaticamente com prazo de 7 dias.

---

## I

**Interação**
Veja **CustomerInteraction**.

**Inventário**
Contagem física do estoque para conferência. Quando aprovado, gera ajustes automáticos.

---

## J

**JWT (JSON Web Token)**
Token de autenticação usado para acessar a API. Gerado no login e válido por tempo limitado.

---

## K

**Kardex**
Histórico completo de movimentações de um produto: data, tipo (entrada/saída), quantidade, saldo anterior, saldo posterior, custo médio.

---

## L

**Lembrete de Retorno**
Tarefa automática criada ao concluir um atendimento. Prazo: 15 dias. Objetivo: lembrar de agendar o retorno do cliente.

**Login**
Autenticação no sistema com email e senha.

**Loyalty**
Veja **Fidelidade**.

---

## M

**Multi-empresa**
Capacidade de um mesmo servidor atender múltiplas barbearias, cada uma com seus próprios dados.

**Multi-unidade**
Capacidade de uma barbearia ter múltiplas filiais, cada uma com caixa e estoque independentes.

---

## N

**Notificação**
Mensagem enviada ao usuário ou cliente sobre eventos: confirmação de agendamento, venda concluída, aniversário.

---

## P

**Pagamento Parcial**
Recebimento de parte do valor da venda. A venda só é finalizada quando o valor total for pago.

**PAID**
Status de venda finalizada. Todos os pagamentos foram recebidos e as integrações executadas.

**Perfil**
Conjunto de permissões que define o que um usuário pode acessar (Administrador, Gerente, Barbeiro, Recepcionista).

**Profissional**
Barbeiro ou outro profissional que realiza atendimentos na barbearia.

---

## R

**RBAC (Role-Based Access Control)**
Sistema de controle de acesso baseado em papéis (perfis). Cada usuário tem um perfil que define suas permissões.

**Retirada**
Operação de retirar dinheiro do caixa (ex: pagamento de despesa).

---

## S

**Saída**
Movimentação de saída de produto do estoque (venda, consumo, perda, transferência enviada).

**SCORE**
Pontuação do cliente de 0 a 100. Calculada com base em frequência de compras, ticket médio, recência, cashback e cancelamentos.

**Segmento**
Classificação automática de clientes por regras. Ex: "Ativo" para clientes com pelo menos 1 compra.

**Service Order**
Registro detalhado dos serviços executados no cliente.

**Suprimento**
Operação de adicionar dinheiro ao caixa (ex: troco extra).

---

## T

**Tag**
Etiqueta para organização de clientes.

**Tarefa (Task)**
Lembrete automático criado pelo sistema: follow-up pós-venda (7 dias) e lembrete de retorno (15 dias).

**Transferência**
Movimentação de produto entre duas unidades.

---

## U

**Unidade (Filial)**
Cada filial da barbearia. Possui caixa e estoque próprios.

**Usuário**
Pessoa que acessa o sistema (Administrador, Gerente, Barbeiro, Recepcionista).

---

## V

**Valuation**
Relatório de valor total do estoque: quantidade × custo médio por produto, com total geral.

**Venda DRAFT**
Venda em rascunho, ainda não finalizada. Permite adicionar/remover itens e aplicar desconto.

---

## W

**Webhook**
Notificação enviada para um sistema externo quando um evento acontece (ex: venda finalizada).

**WebSocket**
Canal de comunicação em tempo real entre o servidor e o navegador. Usado para notificações instantâneas.

**WillComplete**
Condição que indica se o pagamento atual vai completar o valor total da venda. Quando verdadeiro, executa as integrações de finalização.

---

*Glossário — Versão 1.0 | 55 termos*
