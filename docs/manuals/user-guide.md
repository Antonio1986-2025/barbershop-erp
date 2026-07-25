# Manual do Usuário — Barbershop ERP v1.0

## Como usar este manual

Este guia foi criado para o dia a dia da barbearia. Ele mostra o passo a passo de cada operação, na ordem em que acontecem durante o expediente.

---

## Início do Expediente

### 1. Fazer login

1. Abra o navegador e acesse o endereço do sistema
2. Digite seu **email** e **senha**
3. Clique em **Entrar**

> Se aparecer "Usuário ou senha inválidos", verifique se digitou corretamente ou peça ao administrador para redefinir sua senha.

### 2. Abrir o caixa

1. No menu lateral, clique em **Caixa**
2. Clique em **Abrir Caixa**
3. Informe o valor inicial (troco que está no caixa)
4. Confirme

> O caixa precisa estar aberto para receber pagamentos em dinheiro.
> Se o caixa já estiver aberto, você verá o saldo atual.

### 3. Verificar a agenda do dia

1. Clique em **Agenda** no menu lateral
2. Selecione a data de hoje
3. Veja os agendamentos do dia, organizados por profissional

---

## Durante o Expediente

### 4. Cadastrar um cliente novo

1. Clique em **Clientes** no menu lateral
2. Clique em **Novo Cliente**
3. Preencha:
   - **Nome** (obrigatório)
   - **Telefone** (obrigatório — informe com DDD, ex: 67 99999-0001)
   - **Email** (opcional)
   - **Data de nascimento** (opcional)
4. Clique em **Salvar**

> Se o telefone já estiver cadastrado, o sistema avisa. Nesse caso, procure o cliente existente em vez de criar outro.

### 5. Agendar um horário

1. Na **Agenda**, clique no horário desejado
2. Selecione o **cliente**
3. Selecione o **serviço** (corte, barba, etc.)
4. Confirme o horário de início e fim
5. Clique em **Salvar**

> O sistema cria automaticamente uma comanda (venda) para o cliente.
> O cliente recebe uma notificação de confirmação.

### 6. Confirmar o agendamento

1. Na lista de agendamentos, clique no agendamento
2. Clique em **Confirmar**
3. O status muda para "Confirmado"

> Confirme os agendamentos com antecedência para garantir que o cliente virá.

### 7. Iniciar o atendimento

Quando o cliente chegar na barbearia:

1. Localize o agendamento do cliente
2. Clique em **Iniciar Atendimento**
3. O status muda para "Em Andamento"

### 8. Concluir o atendimento

Após terminar o serviço:

1. Clique em **Concluir Atendimento**
2. O sistema registra o atendimento como concluído
3. Automaticamente:
   - Uma **tarefa de lembrete de retorno** é criada (prazo: 15 dias)
   - Uma **interação** é registrada no CRM do cliente

---

## Venda e Pagamento

### 9. Finalizar a venda

Se o agendamento criou uma comanda automática:

1. Acesse **Vendas**
2. Localize a venda do cliente (status "Rascunho")
3. Confira os itens: serviços e produtos
4. Se precisar adicionar produtos, clique em **Adicionar Item**
5. Se precisar aplicar desconto, informe o valor
6. Confira o total

### 10. Receber o pagamento

1. Com a venda aberta, clique em **Receber Pagamento**
2. Selecione o **caixa** (deve estar aberto)
3. Informe o **valor recebido**
4. Selecione a **forma de pagamento** (Dinheiro)
5. Confirme

> Se o cliente pagar com valor maior que a conta, o sistema calcula o troco.
> Pagamentos parciais são permitidos — a venda só é finalizada quando o total for pago.

### O que acontece quando a venda é finalizada?

- ✅ O cliente ganha **5% de cashback** sobre o valor
- ✅ O cliente acumula **pontos de fidelidade**
- ✅ Os produtos vendidos são **baixados do estoque**
- ✅ Uma **tarefa de follow-up** é criada (prazo: 7 dias)
- ✅ O cliente recebe uma **notificação de confirmação**
- ✅ Uma **conta a receber** é gerada no financeiro
- ✅ Tudo é **registrado na auditoria**

---

## Encerramento do Expediente

### 11. Conferir o caixa

1. Acesse **Caixa**
2. Veja o saldo atual
3. Confira as entradas (vendas do dia) e saídas (se houver)
4. Verifique se o número de transações está correto

### 12. Fechar o caixa

1. No **Caixa**, clique em **Fechar Caixa**
2. Informe o valor final que está no caixa
3. Adicione uma observação se necessário (ex: "Fechamento do dia")
4. Confirme

> O caixa fechado não pode ser reaberto — apenas um novo caixa pode ser aberto no dia seguinte.

---

## Consultas do Dia a Dia

### Como ver o histórico de um cliente?

1. Acesse **Clientes**
2. Localize o cliente (busca por nome ou telefone)
3. Clique no nome do cliente
4. Você verá:
   - Compras realizadas
   - Agendamentos anteriores
   - Cashback disponível
   - Pontos de fidelidade
   - Score de relacionamento

### Como ver o estoque de um produto?

1. Acesse **Estoque**
2. Veja na tela inicial os cards com valor total, produtos e alertas
3. Clique em **Relatórios** para ver o estoque completo
4. Clique em **Movimentações** para ver o histórico de entrada e saída

### Como ver as tarefas pendentes?

As tarefas (follow-up, lembrete de retorno) são criadas automaticamente pelo sistema. Para consultá-las, acesse o módulo de CRM (em desenvolvimento na versão 1.0 — acompanhe pelo menu).

---

## Dicas Rápidas

| Situação | O que fazer |
|----------|-------------|
| Cliente quer agendar | Vá na **Agenda**, clique no horário, selecione cliente e serviço |
| Cliente chegou | Marque como **Iniciar Atendimento** |
| Cliente vai embora | **Conclua o atendimento** e **receba o pagamento** |
| Precisa de troco | Use **Suprimento** no Caixa |
| Precisa pagar uma conta | Use **Retirada** no Caixa |
| Produto acabou | Faça uma **Compra** no Estoque |
| Cliente não veio | Cancele o agendamento |

---

## Quando chamar o administrador

- **Esqueci minha senha** — o administrador pode redefinir
- **Erro no sistema** — tire um print e envie para o administrador
- **Precisa de um novo usuário** — o administrador cria
- **Configuração de serviços e produtos** — o administrador cadastra

---

*Manual do Usuário — Versão 1.0*
