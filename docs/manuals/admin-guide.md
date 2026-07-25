# Manual do Administrador — Barbershop ERP v1.0

## Visão Geral do Sistema

O Barbershop ERP é um sistema de gestão para barbearias com suporte a múltiplas unidades (filiais). Ele cobre o fluxo operacional completo: agendamento de clientes, atendimento, venda de serviços e produtos, pagamentos, controle de caixa, financeiro, estoque e CRM.

### Arquitetura

- **Backend:** NestJS (Node.js) + Prisma ORM + PostgreSQL
- **Frontend:** Next.js 14 (React) + Tailwind CSS
- **Autenticação:** JWT com refresh token
- **Tempo real:** WebSocket (Socket.IO) para notificações
- **API:** RESTful, todas as rotas protegidas por JWT

---

## 2. Configuração Inicial

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Gerenciador de pacotes (npm ou yarn)

### Passo a passo

1. Clone o repositório
2. Configure o arquivo `.env` na pasta `backend/` com `DATABASE_URL` apontando para o PostgreSQL
3. Execute `npx prisma migrate deploy` para criar as tabelas
4. Execute `npx prisma db seed` para popular dados iniciais
5. Inicie o backend com `npm run start:dev` (porta 3001)
6. Inicie o frontend com `npm run dev` na pasta `frontend/` (porta 3000)
7. Acesse `http://localhost:3000` e faça login com admin@demo.com / 123456

### Usuário padrão

| Campo | Valor |
|-------|-------|
| Email | admin@demo.com |
| Senha | 123456 |
| Perfil | Administrador |

---

## 3. Empresa

### Objetivo
Configurar os dados da barbearia que aparecerão em notas, relatórios e na interface.

### Quando utilizar
Apenas na implantação ou quando houver alteração de dados cadastrais.

### Passo a passo
1. Acesse **Configurações > Empresa**
2. Preencha: nome, documento (CNPJ/CPF), telefone, endereço
3. Salve as alterações

### Boas práticas
- Mantenha o CNPJ correto para emissão de relatórios fiscais
- O telefone da empresa é usado em notificações enviadas a clientes

---

## 4. Unidades (Filial)

### Objetivo
Gerenciar as filiais da barbearia. Cada unidade tem seu próprio caixa e estoque.

### Quando utilizar
Ao abrir uma nova filial.

### Passo a passo
1. Acesse **Configurações > Unidades**
2. Clique em **Nova Unidade**
3. Informe: nome, código, telefone, endereço, cidade, estado
4. Marque como **Ativa** para uso imediato

### Boas práticas
- Crie ao menos uma unidade antes de cadastrar profissionais e serviços
- O código da unidade é usado internamente para identificar a filial

### Erros comuns
- **"Unidade não encontrada"** ao tentar abrir caixa — verifique se a unidade existe e está ativa

---

## 5. Usuários

### Objetivo
Gerenciar quem pode acessar o sistema.

### Quando utilizar
Ao contratar novo funcionário ou quando alguém sair da barbearia.

### Passo a passo
1. Acesse **Configurações > Usuários**
2. Clique em **Novo Usuário**
3. Informe: nome, email, senha, telefone
4. Associe a unidade(s) de trabalho
5. Atribua permissões (papéis)

### Boas práticas
- Cada funcionário deve ter seu próprio login
- Desative usuários que não trabalham mais na barbearia (não exclua)
- Use senhas fortes (mínimo 8 caracteres)

---

## 6. Permissões (RBAC)

### Objetivo
Controlar o que cada usuário pode fazer no sistema.

### Quando utilizar
Na criação de usuário ou quando houver mudança de função.

### Perfis disponíveis
- **Administrador** — acesso total ao sistema
- **Gerente** — acesso a relatórios e gerenciamento
- **Barbeiro** — acesso a agenda, atendimento e venda
- **Recepcionista** — acesso a agenda e cadastro de clientes

### Boas práticas
- Conceda apenas as permissões necessárias para a função
- Revise permissões periodicamente

---

## 7. Profissionais

### Objetivo
Cadastrar os profissionais que realizam atendimentos na barbearia.

### Quando utilizar
Ao contratar um novo barbeiro.

### Passo a passo
1. Acesse **Profissionais**
2. Clique em **Novo Profissional**
3. Informe: nome, telefone, email, especialidade
4. Associe a unidade(s) de atendimento
5. Defina a comissão (quando disponível na versão)
6. Marque como **Ativo** para aparecer na agenda

### Boas práticas
- Mantenha os dados de contato atualizados
- A especialidade ajuda na hora de agendar o serviço certo

---

## 8. Serviços

### Objetivo
Cadastrar os serviços oferecidos (corte, barba, hidratação, etc.).

### Quando utilizar
Ao adicionar um novo serviço no cardápio.

### Passo a passo
1. Acesse **Serviços**
2. Clique em **Novo Serviço**
3. Informe: nome, descrição, duração (minutos), preço
4. Associe a uma categoria (ex: "Corte", "Barba", "Capilar")
5. Marque como **Ativo** para aparecer nos agendamentos

### Boas práticas
- A duração em minutos é usada para evitar conflitos de horário
- Preços muito abaixo do mercado podem desvalorizar o serviço

### Erros comuns
- **"Serviço não encontrado"** ao criar agendamento — verifique se o serviço está ativo

---

## 9. Produtos

### Objetivo
Cadastrar produtos vendidos na barbearia (shampoo, condicionador, pomada, bebidas, etc.).

### Quando utilizar
Ao adicionar um novo produto ao estoque.

### Passo a passo
1. Acesse **Produtos**
2. Clique em **Novo Produto**
3. Informe: nome, código de barras, preço de venda, preço de custo
4. Associe a uma categoria
5. Associe a um fornecedor (opcional)
6. Marque como **Ativo**

### Boas práticas
- O código de barras facilita a consulta no PDV
- O preço de custo é usado para calcular margem no relatório de valuation
- Produtos inativos não aparecem na venda

---

## 10. Categorias

### Objetivo
Organizar serviços e produtos em grupos para facilitar a navegação.

### Quando utilizar
Na configuração inicial ou ao adicionar nova linha de serviço/produto.

### Passo a passo
1. Acesse **Configurações > Categorias**
2. Informe: nome, tipo (Serviço ou Produto)
3. Salve

### Boas práticas
- Crie categorias objetivas: "Cortes", "Barba", "Capilar", "Bebidas", "Cosméticos"

---

## 11. Fornecedores

### Objetivo
Cadastrar fornecedores de produtos para controle de compras.

### Quando utilizar
Ao iniciar a compra de produtos de um novo fornecedor.

### Passo a passo
1. Acesse **Fornecedores**
2. Clique em **Novo Fornecedor**
3. Informe: nome, documento, telefone, email, contato
4. Salve

### Boas práticas
- Mantenha os dados de contato atualizados para fazer pedidos

---

## 12. Agenda

### Objetivo
Gerenciar agendamentos de clientes com profissionais.

### Quando utilizar
Diariamente, para organizar os atendimentos.

### Fluxo de status
`SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`

### Cancelamento
`SCHEDULED` ou `CONFIRMED` → `CANCELLED`

### Passo a passo
1. Acesse **Agenda** ou **Agendamentos**
2. Selecione a data e o profissional
3. Clique em um horário vazio ou em **Novo Agendamento**
4. Selecione o cliente (ou cadastre um novo)
5. Selecione o serviço
6. Confirme o horário de início e fim
7. Salve

### Ações no agendamento
- **Confirmar** — envia notificação ao cliente
- **Iniciar** — marca o início do atendimento
- **Concluir** — registra interação CRM e cria tarefa de lembrete de retorno

### Boas práticas
- Confirme agendamentos com antecedência
- Use o status "CHECKED_IN" quando o cliente chegar
- Conclua o agendamento após o término do atendimento

### Erros comuns
- **"Conflito de horário"** — o profissional já tem outro agendamento no mesmo horário
- **"Cliente não encontrado"** — o cliente foi removido ou desativado

---

## 13. Atendimento

### Objetivo
Registrar a execução do serviço no cliente.

### Quando utilizar
Durante o atendimento, para controlar o status e gerar a venda.

### Fluxo
1. Agendamento criado → Confirmado → Cliente chega → Iniciar atendimento → Concluir

### Integrações
- Ao **concluir** o atendimento: interação CRM (VISIT) e tarefa de lembrete de retorno são criadas automaticamente
- Uma comanda (venda) pode ser gerada automaticamente ao criar o agendamento

---

## 14. Service Order

### Objetivo
Registrar detalhadamente os serviços executados no cliente, vinculados a um agendamento.

### Quando utilizar
Para controle interno do que foi realizado.

### Passo a passo
1. Acesse a venda ou agendamento
2. Os serviços aparecem como itens na venda
3. É possível adicionar produtos e serviços adicionais

---

## 15. Vendas

### Objetivo
Registrar a venda de serviços e produtos para o cliente.

### Quando utilizar
Sempre que um cliente for atendido e/ou comprar produtos.

### Passo a passo
1. Acesse **Vendas** ou crie a partir do agendamento
2. Adicione itens: serviços (com duração e preço) e/ou produtos (com quantidade e preço)
3. Aplique desconto se necessário
4. Confira o total
5. Siga para o pagamento

### Regras
- A venda começa como **DRAFT**
- Só é finalizada após o pagamento completo
- Serviços sem produto não alteram o estoque
- Produtos têm baixa automática no estoque ao finalizar a venda

### Boas práticas
- Revise os itens antes de finalizar
- Descontos podem ser aplicados antes do pagamento

---

## 16. Pagamentos

### Objetivo
Registrar o recebimento do valor da venda.

### Quando utilizar
Após a venda estar pronta, para receber do cliente.

### Meios de pagamento
- **Dinheiro (CASH)** — gera CashTransaction no caixa

### Fluxo
1. Selecione o caixa aberto
2. Informe o valor recebido
3. O sistema calcula o troco se necessário
4. O pagamento é registrado como PAID
5. Se o valor total for atingido, a venda é finalizada como **PAID**

### Integrações automáticas (ao completar a venda)
- **Cashback:** 5% do valor é creditado como cashback para o cliente
- **Loyalty:** Pontos de fidelidade são acumulados
- **Estoque:** Produtos são baixados do estoque
- **Automação:** Tarefa de follow-up é criada
- **Notificação:** Cliente recebe confirmação
- **Financeiro:** Conta a receber é gerada
- **Auditoria:** Log de pagamento e operações

### Boas práticas
- O caixa deve estar aberto antes de receber pagamentos em dinheiro
- Pagamentos parciais são permitidos (a venda só finaliza quando o total for atingido)

### Erros comuns
- **"Caixa não está aberto"** — abra o caixa antes de receber
- **"Valor excede o saldo restante"** — o total já foi pago

---

## 17. Caixa

### Objetivo
Controlar o dinheiro que entra e sai diariamente.

### Quando utilizar
Todos os dias, na abertura e fechamento do expediente.

### Operações

#### Abertura
1. Acesse **Caixa**
2. Informe o valor inicial (troco)
3. Caixa é aberto

#### Suprimento
1. Adicione dinheiro ao caixa (ex: troco extra)
2. Informe o valor e motivo

#### Retirada
1. Retire dinheiro do caixa (ex: pagamento de despesa)
2. Informe o valor e motivo

#### Fechamento
1. Confira o saldo atual
2. Informe o valor final em caixa
3. O sistema calcula a diferença
4. Caixa é fechado

### Integrações
- Pagamentos em dinheiro geram automático lançamentos de entrada (CashTransaction)
- O fechamento gera registro financeiro

### Boas práticas
- Abra o caixa no início do expediente
- Feche ao final do dia
- Confira o valor antes de fechar
- Use suprimento e retirada para movimentações que não são vendas

---

## 18. Financeiro

### Objetivo
Gerenciar contas a receber geradas pelas vendas.

### Quando utilizar
Para acompanhamento financeiro e relatórios.

### Funcionalidades
- **Contas a Receber:** geradas automaticamente ao finalizar venda
- **Status:** OPEN → PAID (baixado no pagamento)
- **Categorias:** vendas, aluguel, etc.

### Boas práticas
- As contas a receber são criadas automaticamente — não é necessário lançamento manual
- Consulte o relatório financeiro para verificar o fluxo de caixa

---

## 19. Estoque

### Objetivo
Controlar a entrada e saída de produtos.

### Operações

#### Compra
1. Acesse **Compras**
2. Selecione fornecedor e unidade
3. Adicione produtos com quantidade e custo unitário
4. Salve como rascunho
5. Confirme a compra para dar entrada no estoque

#### Ajuste Manual
1. Acesse **Estoque > Movimentações**
2. Use o ajuste para corrigir divergências
3. Informe quantidade (positiva para entrada, negativa para saída)

#### Transferência
1. Acesse **Estoque > Transferências**
2. Informe origem, destino, produto e quantidade
3. Aprove → Envie → Receba (estoque é movimentado no recebimento)

#### Inventário
1. Acesse **Estoque > Inventário**
2. Crie uma contagem (uma por unidade)
3. Adicione itens com quantidade contada
4. Revise e aprove — ajustes são gerados automaticamente

### Relatórios
- **Estoque Atual:** quantidade e valor por produto/unidade
- **Kardex:** histórico completo de movimentações por produto
- **Valuation:** valor total do estoque (por produto ou por unidade)
- **Giro:** taxa de rotatividade do estoque
- **Estoque Baixo:** produtos com quantidade zerada

### Custo Médio
O custo médio é calculado automaticamente a cada entrada (compra, ajuste positivo, transferência recebida). Saídas registram o custo médio do momento como snapshot histórico.

### Boas práticas
- Faça inventário periódico para conferir o estoque físico
- Use transferências para movimentar produtos entre filiais
- Ajustes manuais devem ter descrição clara do motivo

---

## 20. CRM

### Objetivo
Gerenciar o relacionamento com clientes.

### Funcionalidades

#### Perfil do Cliente
- **Score:** pontuação de 0 a 100 baseada em frequência, ticket médio, recência
- **Segmentos:** classificação automática por regras (ex: "Ativo", "Inativo")
- **Tags:** etiquetas para organização
- **Finanças:** total gasto, ticket médio, maior compra
- **Agendamentos:** histórico completo

#### Interações
Registro automático de:
- Cliente cadastrado
- Agendamento criado
- Atendimento concluído
- Venda concluída
- Pagamento confirmado

#### Cashback
- 5% do valor da venda é creditado como cashback
- O cliente pode consultar o saldo
- Cashback expira após período (configurável)

#### Fidelidade (Loyalty)
- Pontos acumulados por valor gasto
- Configurável: pontos por real, valor mínimo
- Reversão automática no cancelamento da venda

#### Automações
- **Venda concluída:** cria tarefa de follow-up pós-venda (prazo: 7 dias)
- **Atendimento concluído:** cria tarefa de lembrete de retorno (prazo: 15 dias)

### Boas práticas
- Mantenha os dados do cliente atualizados
- Use as interações para histórico de relacionamento
- Acompanhe as tasks de follow-up para não perder oportunidades

---

## 21. Integrações

### Objetivo
Conectar o ERP com serviços externos.

### Disponíveis na v1.0
- **Google Agenda:** sincronização bidirecional de agendamentos
- **Webhooks:** notificação de eventos para sistemas externos
- **Mercado Pago:** processamento de pagamentos (em implantação)

### Observações
Integrações são opcionais e configuradas por unidade.

---

## 22. Auditoria

### Objetivo
Manter um log de todas as operações realizadas no sistema.

### Quando utilizar
Para investigar alterações, identificar quem fez o quê e quando.

### O que é registrado
- Criação, alteração e exclusão de registros
- Login de usuários
- Pagamentos e operações financeiras
- Movimentações de estoque

### Boas práticas
- Consulte os logs em caso de divergência
- Logs não podem ser alterados ou excluídos

---

## 23. Dashboards

### Objetivo
Visualizar indicadores de desempenho da barbearia.

### Dashboards disponíveis

#### Dashboard Principal
- Faturamento do dia/mês
- Agendamentos do dia
- Clientes atendidos
- Ticket médio

#### Dashboard de Estoque
- Valor total em estoque
- Produtos com estoque baixo/zerado
- Compras do mês
- Giro médio
- Produtos inativos

#### Dashboard CRM
- Total de clientes ativos
- Clientes inativos (180+ dias sem compra)
- Saldo de cashback e loyalty

### Observações
Dashboards consultam dados em tempo real.

---

## 24. Configurações

### Objetivo
Ajustar parâmetros do sistema.

### Disponíveis
- **Empresa:** dados cadastrais
- **Unidades:** filiais
- **Usuários:** funcionários e permissões
- **Categorias:** grupos de serviços e produtos
- **Loyalty:** configuração do programa de fidelidade (pontos por real, valor mínimo)
- **Integrações:** chaves de API e webhooks

---

## Erros Comuns — Referência Rápida

| Erro | Causa | Solução |
|------|-------|---------|
| "Caixa não está aberto" | Caixa fechado | Abra o caixa na unidade |
| "Conflito de horário" | Profissional ocupado | Escolha outro horário ou profissional |
| "Cliente não encontrado" | ID inválido | Verifique o cliente na listagem |
| "Valor excede o saldo" | Venda já paga | Verifique o status da venda |
| "Estoque insuficiente" | Produto sem quantidade | Ajuste o estoque ou compre mais |
| "Venda não encontrada" | ID incorreto | Use o ID completo da listagem |
| "Telefone inválido" | Formato incorreto | Informe com DDD (ex: 67 99999-0001) |
| "Já existe um cliente com este telefone" | Duplicata | Reative o cliente existente |

---

*Manual do Administrador — Versão 1.0*
