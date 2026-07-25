# Perguntas Frequentes — Barbershop ERP v1.0

## Geral

**1. O que é o Barbershop ERP?**
Sistema de gestão para barbearias. Controla agenda, atendimento, vendas, caixa, estoque e relacionamento com clientes.

**2. Quais são os requisitos para rodar o sistema?**
Node.js 18+, PostgreSQL 14+, navegador moderno (Chrome, Firefox, Edge).

**3. O sistema funciona offline?**
Não. É necessário acesso ao servidor (internet ou rede local).

**4. Quantas filiais posso cadastrar?**
Ilimitadas. Cada filial tem caixa e estoque independentes.

**5. Quantos usuários posso criar?**
Ilimitados. Cada usuário tem permissões específicas.

**6. O sistema tem aplicativo mobile?**
Não na versão 1.0. A interface é web responsiva (funciona no celular pelo navegador).

**7. O sistema é multi-empresa?**
Sim. Cada empresa é isolada. Um mesmo servidor pode atender múltiplas barbearias.

**8. Como faço backup?**
O banco PostgreSQL pode ser exportado via pg_dump. Consulte o administrador do servidor.

**9. O sistema emite notas fiscais?**
Não na versão 1.0.

**10. O sistema tem suporte a múltiplos idiomas?**
Não. A interface está em português (pt-BR).

---

## Login e Acesso

**11. Esqueci minha senha. O que faço?**
Peça ao administrador para redefinir sua senha.

**12. Por que aparece "Usuário ou senha inválidos"?**
Email ou senha incorretos. Verifique as informações ou solicite redefinição.

**13. Posso acessar de qualquer lugar?**
Sim, se o servidor estiver acessível pela internet.

**14. Quantas tentativas de login posso fazer?**
Não há limite definido na versão 1.0.

**15. O login expira?**
Sim. O token JWT expira após o período configurado. Você precisará fazer login novamente.

---

## Clientes

**16. Como cadastrar um cliente?**
Clientes > Novo Cliente > informe nome e telefone (com DDD) > Salvar.

**17. Posso cadastrar cliente sem telefone?**
Não. O telefone é obrigatório e usado para evitar duplicatas.

**18. O que acontece se cadastrar um telefone já existente?**
O sistema retorna erro 409 "Já existe um cliente com este telefone". Localize o cliente existente em vez de criar outro.

**19. Como pesquisar um cliente?**
Use a busca por nome ou telefone na tela de Clientes.

**20. Como editar um cliente?**
Clientes > localize o cliente > clique no nome > Editar.

**21. Como excluir um cliente?**
Clientes > localize o cliente > clique em Excluir. A exclusão é lógica (desativa o registro).

**22. O que são as interações do cliente?**
São registros automáticos de eventos: cadastro, agendamento, atendimento, compra, pagamento.

**23. O cliente pode consultar o próprio histórico?**
Não na versão 1.0. Apenas operadores têm acesso.

---

## Agenda e Atendimento

**24. Como criar um agendamento?**
Agenda > clique no horário desejado > selecione cliente e serviço > Salvar.

**25. Posso agendar para qualquer profissional?**
Sim, desde que o profissional esteja ativo e tenha horário disponível.

**26. O que significa cada status do agendamento?**
- SCHEDULED: agendado
- CONFIRMED: confirmado
- CHECKED_IN: cliente chegou
- IN_PROGRESS: em atendimento
- COMPLETED: concluído
- CANCELLED: cancelado

**27. Como cancelar um agendamento?**
Agendamentos > localize > Cancelar.

**28. O que acontece ao concluir um atendimento?**
Uma interação "Atendimento concluído" é registrada e uma tarefa "Lembrete de retorno" é criada para 15 dias depois.

**29. Posso reagendar?**
Sim. Use a opção Reagendar no agendamento.

**30. O que é conflito de horário?**
Quando o profissional já tem outro agendamento no mesmo horário. Escolha outro horário.

---

## Vendas e Pagamentos

**31. Como criar uma venda?**
Ela é criada automaticamente ao agendar. Também pode ser criada manualmente em Vendas > Nova Venda.

**32. Como adicionar produtos à venda?**
Na venda em rascunho, clique em Adicionar Item e selecione o produto.

**33. Como aplicar desconto?**
Na venda, informe o valor do desconto antes de receber o pagamento.

**34. Quais formas de pagamento são aceitas?**
Dinheiro (CASH). Outras formas podem ser implementadas via integração.

**35. Posso receber pagamento parcelado?**
Sim. Faça pagamentos parciais até completar o valor total.

**36. O que é "willComplete"?**
É quando o pagamento atinge o valor total da venda. Nesse momento, a venda é finalizada e as integrações são executadas (cashback, estoque, etc.).

**37. Preciso ter caixa aberto para vender?**
Sim. Pagamentos em dinheiro exigem caixa aberto.

**38. O que acontece se tentar pagar uma venda já paga?**
O sistema retorna "Venda não aceita pagamentos. Status: PAID".

---

## Caixa

**39. Como abrir o caixa?**
Caixa > Abrir Caixa > informe o valor inicial.

**40. Como fechar o caixa?**
Caixa > Fechar Caixa > informe o valor final.

**41. Posso fechar o caixa e abrir outro no mesmo dia?**
Sim.

**42. O que é suprimento?**
Adicionar dinheiro ao caixa (ex: troco extra).

**43. O que é retirada?**
Retirar dinheiro do caixa (ex: pagamento de despesa).

**44. Como vejo o histórico do caixa?**
Caixa > Histórico.

---

## Estoque

**45. Como dar entrada em um produto?**
Compras > Nova Compra > adicione produtos e quantidades > Confirme.

**46. Como ajustar o estoque manualmente?**
Estoque > Movimentações > Ajuste > informe produto, quantidade e motivo.

**47. O que é custo médio?**
É a média ponderada do custo de compra do produto, recalculada a cada entrada.

**48. O que é kardex?**
Histórico completo de movimentações de um produto (entradas e saídas) com saldos.

**49. Como transferir produtos entre filiais?**
Estoque > Transferências > informe origem, destino, produto e quantidade.

**50. O que é inventário?**
Contagem física do estoque para conferir se o sistema reflete a realidade.

**51. A venda baixa o estoque automaticamente?**
Sim. Ao finalizar a venda, os produtos são baixados do estoque.

**52. O cancelamento da venda reverte o estoque?**
Sim. O estoque é estornado automaticamente.

---

## CRM

**53. O que é o score do cliente?**
Nota de 0 a 100 calculada com base em frequência, ticket médio, recência, cashback e cancelamentos.

**54. Como o cliente acumula cashback?**
5% do valor de cada venda é creditado como cashback.

**55. O cashback expira?**
Sim. Transações com status "EXPIRED" aparecem no histórico.

**56. Como o cliente acumula pontos de fidelidade?**
Pontos são calculados conforme configuração (pontos por real gasto).

**57. O que são as tasks (tarefas)?**
São lembretes automáticos criados pelo sistema: follow-up pós-venda (7 dias) e lembrete de retorno (15 dias).

---

## Financeiro

**58. O que é uma conta a receber?**
Registro financeiro gerado automaticamente ao finalizar uma venda.

**59. Preciso lançar contas manualmente?**
Não. As contas a receber de vendas são automáticas.

**60. Como vejo o financeiro?**
Financeiro > Contas.

---

## Auditoria

**61. O que é registrado na auditoria?**
Todas as operações: criação, alteração, exclusão, login, pagamento.

**62. Posso apagar um log de auditoria?**
Não. Logs são imutáveis.

---

## Segurança

**63. Como criar um novo usuário?**
Configurações > Usuários > Novo Usuário.

**64. O que fazer quando um funcionário sai?**
Desative o usuário em Configurações > Usuários. Não o exclua.

**65. Posso controlar o que cada usuário vê?**
Sim. Use os perfis de permissão (Administrador, Gerente, Barbeiro, Recepcionista).

**66. Minhas senhas são armazenadas com segurança?**
Sim. As senhas são armazenadas com hash (bcrypt).

---

## Solução de Problemas

**67. A página não carrega. O que fazer?**
Verifique se o servidor está rodando. Tente atualizar a página (F5).

**68. Uma listagem está vazia. É normal?**
Pode ser. O sistema mostra apenas dados da sua empresa.

**69. Recebi um erro 500. O que significa?**
Erro interno do servidor. Informe o administrador com o horário e a operação que estava fazendo.

**70. O sistema está lento. O que pode ser?**
Consultas com muitos dados. Tente usar filtros (datas, busca).

**71. Como reportar um bug?**
Registre o problema com: o que fez, o que esperava, o que aconteceu, horário e print da tela.

---

*FAQ — Versão 1.0 | 71 perguntas*
