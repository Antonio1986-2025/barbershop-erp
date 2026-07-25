# Guia Rápido — Barbershop ERP v1.0

## 1. Login

```
Email: admin@demo.com
Senha: 123456
```

---

## 2. Fluxo do Dia

```
ABRIR CAIXA
  → Caixa > Abrir Caixa > informar valor inicial

AGENDAR CLIENTE
  → Agenda > clicar no horário > selecionar cliente + serviço > Salvar

CONFIRMAR AGENDAMENTO
  → Agendamentos > Confirmar

INICIAR ATENDIMENTO
  → Agendamentos > Iniciar Atendimento

CONCLUIR ATENDIMENTO
  → Agendamentos > Concluir Atendimento

RECEBER PAGAMENTO
  → Vendas > abrir venda > Receber Pagamento > informar valor > Confirmar

FECHAR CAIXA
  → Caixa > Fechar Caixa > informar valor final > Confirmar
```

---

## 3. Cadastros Rápidos

### Novo Cliente
`Clientes > Novo Cliente` → Nome + Telefone (com DDD)

### Novo Serviço
`Serviços > Novo Serviço` → Nome + Duração (min) + Preço

### Novo Produto
`Produtos > Novo Produto` → Nome + Preço de venda

### Novo Profissional
`Profissionais > Novo Profissional` → Nome + Telefone

---

## 4. Consultas Rápidas

| O que quer ver? | Onde clicar |
|----------------|-------------|
| Agenda do dia | **Agenda** |
| Clientes | **Clientes** |
| Estoque | **Estoque** |
| Vendas | **Vendas** |
| Caixa | **Caixa** |
| Financeiro | **Financeiro** |
| Produtos | **Produtos** |
| Serviços | **Serviços** |
| Profissionais | **Profissionais** |
| Compras | **Estoque > Compras** |
| Fornecedores | **Fornecedores** |

---

## 5. O que acontece automaticamente

| Quando | O sistema faz |
|--------|---------------|
| Cliente cadastrado | Registra interação "Cliente cadastrado" |
| Agendamento criado | Cria comanda (venda) + notificação ao cliente |
| Agendamento confirmado | Notifica o cliente |
| Atendimento concluído | Cria interação "Atendimento concluído" + tarefa "Lembrete de retorno" (15 dias) |
| Venda finalizada | Baixa estoque + cashback 5% + pontos fidelidade + tarefa "Follow-up" (7 dias) + notificação + conta a receber |
| Pagamento em dinheiro | Registra entrada no caixa |
| Venda cancelada | Reverte estoque + cashback + pontos |

---

## 6. Atalhos e Dicas

- **Telefone:** sempre com DDD (ex: 67 99999-0001)
- **Caixa:** precisa estar aberto para vender
- **Pagamento parcial:** pode receber em quantas vezes precisar
- **Desconto:** aplique antes de receber o pagamento
- **Estoque:** confira antes de vender produtos

---

## 7. Erros Comuns

| Mensagem | O que fazer |
|----------|-------------|
| "Caixa não está aberto" | Abra o caixa |
| "Conflito de horário" | Escolha outro horário |
| "Telefone inválido" | Informe com DDD |
| "Já existe um cliente" | Use o cliente existente |
| "Estoque insuficiente" | Compre mais ou ajuste |

---

*Guia Rápido — Versão 1.0 | Ideal para impressão*
