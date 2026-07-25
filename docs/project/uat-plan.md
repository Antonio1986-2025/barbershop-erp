# UAT Plan — Primeira Utilização Real

> Sprint UAT.1 — Nenhuma funcionalidade nova. Somente correções.

## Critério de aceite da UAT

O sistema deve permitir que um dono de barbearia ou loja complete todos os fluxos abaixo sem:
- erros inesperados;
- lentidão perceptível;
- campos ou etapas obrigatórios desnecessários;
- permissões ausentes ou excessivas;
- informações ambíguas na tela.

---

## Fluxo 1 — Primeira empresa

| # | Ação | Validação |
|---|---|---|
| 1.1 | Criar empresa | Formulário aceito, empresa visível |
| 1.2 | Criar unidade | Unidade vinculada à empresa |
| 1.3 | Criar administrador | Login funciona com e-mail + senha |
| 1.4 | Login com JWT | Token gerado, sessão mantida |
| 1.5 | Verificar permissões | Admin tem acesso a todos os módulos |
| 1.6 | Criar segundo usuário com permissões reduzidas | RBAC respeita as restrições |
| 1.7 | Trocar de empresa (se multiempresa) | Dados isolados por empresa |

**Observações:**

---

## Fluxo 2 — Cadastro base

| # | Ação | Validação |
|---|---|---|
| 2.1 | Cadastrar fornecedor | Salvo, listado, editável |
| 2.2 | Cadastrar categoria | Aparece na listagem |
| 2.3 | Cadastrar produto (com categoria, preço, código de barras) | Aparece no estoque |
| 2.4 | Cadastrar serviço (com duração e preço) | Aparece na agenda |
| 2.5 | Cadastrar cliente (com telefone e e-mail) | Aparece no CRM |
| 2.6 | Cadastrar profissional (com unidade) | Aparece na agenda |
| 2.7 | Editar cada registro | Dados persistem |
| 2.8 | Excluir / desativar cada registro | Comportamento esperado |

**Observações:**

---

## Fluxo 3 — Estoque

| # | Ação | Validação |
|---|---|---|
| 3.1 | Criar compra (DRAFT) | Itens adicionáveis, totais corretos |
| 3.2 | Confirmar compra | Estoque atualizado, movimentação registrada |
| 3.3 | Conferir saldo do produto | Quantidade e custo médio corretos |
| 3.4 | Transferir produto entre unidades | Saldo de origem diminui, destino aumenta |
| 3.5 | Fazer inventário | Diferenças detectadas |
| 3.6 | Ajustar estoque manualmente | Movimentação do tipo ADJUSTMENT registrada |
| 3.7 | Verificar relatórios (kardex, giro, valuation) | Dados coerentes |
| 3.8 | Verificar alertas | Estoque baixo/zerado aparece |
| 3.9 | Verificar dashboard de estoque | Indicadores condizentes |

**Observações:**

---

## Fluxo 4 — PDV

| # | Ação | Validação |
|---|---|---|
| 4.1 | Abrir caixa | Caixa aberto, saldo inicial correto |
| 4.2 | Criar venda (DRAFT) | Itens adicionáveis, totais calculados |
| 4.3 | Aplicar cupom de desconto | Desconto aplicado, total recalculado |
| 4.4 | Abrir venda (OPEN) | Status alterado |
| 4.5 | Receber pagamento em dinheiro | Caixa atualizado, transação registrada |
| 4.6 | Receber pagamento em PIX | Transação registrada |
| 4.7 | Conferir estoque após venda | Quantidade reduzida corretamente |
| 4.8 | Conferir financeiro | Conta a receber criada |
| 4.9 | Conferir cashback gerado (se cliente) | Saldo de cashback do cliente aumentou |
| 4.10 | Conferir pontos de fidelidade | Pontos do cliente aumentaram |
| 4.11 | Cancelar venda | Estoque revertido, financeiro estornado |
| 4.12 | Reembolsar venda | Movimentações compensatórias |
| 4.13 | Fechar caixa | Diferença calculada, fechamento registrado |
| 4.14 | Verificar dashboard de vendas | Métricas consistentes |

**Observações:**

---

## Fluxo 5 — CRM

| # | Ação | Validação |
|---|---|---|
| 5.1 | Abrir perfil 360° do cliente | Todos os campos (financeiro, agenda, fidelização, relacionamento) aparecem |
| 5.2 | Verificar CustomerScore | Score entre 0 e 100 |
| 5.3 | Criar segmento com regra | Cliente aparece no segmento |
| 5.4 | Atribuir tag ao cliente | Tag aparece no perfil |
| 5.5 | Criar interação (tipo WHATSAPP) | Interação aparece no histórico |
| 5.6 | Criar tarefa para o cliente | Tarefa aparece na listagem |
| 5.7 | Concluir tarefa | Status alterado, completedAt preenchido |
| 5.8 | Criar campanha | Campanha em DRAFT |
| 5.9 | Verificar indicação de aniversário | Notificação (se aplicável) |
| 5.10 | Verificar automação de follow-up | Tarefa criada após venda |
| 5.11 | Verificar automação de cliente inativo | Tarefa criada (após 180 dias) |
| 5.12 | Verificar dashboard CRM | Indicadores consistentes |

**Observações:**

---

## Fluxo 6 — Integrações

| # | Ação | Validação |
|---|---|---|
| 6.1 | Configurar integração Evolution | Integration salva com credentials |
| 6.2 | Enviar mensagem WhatsApp via conversa | IntegrationLog OUTBOUND registrado |
| 6.3 | Receber webhook Evolution | IntegrationLog INBOUND + CustomerInteraction criados |
| 6.4 | Configurar integração Google Calendar | Integration salva |
| 6.5 | Criar agendamento → evento no Google | externalCalendarId preenchido |
| 6.6 | Cancelar agendamento → evento removido | externalCalendarId mantido (delete lógico) |
| 6.7 | Configurar Mercado Pago | Integration salva |
| 6.8 | Webhook Mercado Pago | Payment status atualizado |

**Observações:**

---

---

## Fluxo 7 — Recuperação de Erros

| # | Cenário | O que observar |
|---|---|---|
| 7.1 | Desligar PostgreSQL durante uma operação de venda | Mensagem clara de erro de conexão, nenhum dado parcial persistido |
| 7.2 | Simular timeout da Evolution API ao enviar mensagem | IntegrationLog FAILED registrado, usuário informado |
| 7.3 | Simular timeout do Mercado Pago ao criar cobrança | IntegrationLog FAILED, venda não trava |
| 7.4 | Simular falha do Google Calendar ao criar evento | externalCalendarId não preenchido, agendamento mantido |
| 7.5 | Tentar salvar registro duplicado (CPF, e-mail, código) | Mensagem específica, não erro 500 |
| 7.6 | Tentar excluir categoria com produtos vinculados | Bloqueado com mensagem explicativa |
| 7.7 | Usar token JWT expirado | Redirecionado para login sem crash |
| 7.8 | Recarregar a página durante uma venda em andamento | Estado recuperável ou mensagem clara |
| 7.9 | Perder conexão com a internet durante operação | Mensagem sem dados inconsistentes |
| 7.10 | Tentar pagar venda já paga | Bloqueado com mensagem |

**Observações:**

---

## Fluxo 8 — Concorrência

| # | Cenário | O que observar |
|---|---|---|
| 8.1 | Dois usuários vendendo o mesmo produto simultaneamente | Estoque não fica negativo (a menos que permitido) |
| 8.2 | Dois usuários ajustando o estoque ao mesmo tempo | Saldo final consistente |
| 8.3 | Dois caixas tentando abrir na mesma unidade | Segundo é bloqueado |
| 8.4 | Dois atendentes respondendo a mesma conversa | Mensagens não se perdem, ordem cronológica mantida |
| 8.5 | Dois usuários editando o mesmo cadastro | Último salvamento prevalece (sem corrupção) |
| 8.6 | Múltiplos webhooks simultâneos do Mercado Pago | Idempotência respeitada, pagamento não duplicado |

**Observações:**

---

## Fluxo 9 — UX e Interface

| # | Aspecto | O que observar |
|---|---|---|
| 9.1 | Layout desktop (1920×1080) | Sem quebras, scroll, elementos sobrepostos |
| 9.2 | Layout tablet (768×1024) | Menu adaptado, formulários usáveis |
| 9.3 | Layout mobile (375×667) | Navegação por toque funcional |
| 9.4 | Menu lateral | Itens visíveis, submenus funcionam |
| 9.5 | Breadcrumb | Mostra caminho atual, links funcionam |
| 9.6 | Paginação | Botões anterior/próximo, número de páginas correto |
| 9.7 | Busca | Resultados filtrados, tempo aceitável |
| 9.8 | Filtros | Combináveis, reset limpa |
| 9.9 | Ordenação | Colunas ordenáveis, direção alterna |
| 9.10 | Estados de carregamento | Spinner/skeleton visível durante requisição |
| 9.11 | Mensagens de sucesso | Feedback positivo após operação |
| 9.12 | Mensagens de erro | Texto claro, não "erro interno" |
| 9.13 | Tela vazia | Mensagem amigável quando não há dados |
| 9.14 | Tela de erro 404 | Design consistente, link para voltar |
| 9.15 | Tela de erro 403 | Explica falta de permissão |

**Observações:**

---

## Critérios de Performance

| Requisito | Limite |
|---|---|
| Login | < 2s |
| Listagem paginada (20 itens) | < 1s |
| Perfil 360° do cliente | < 3s |
| Fechamento de caixa | < 2s |
| Dashboard (cards + charts) | < 5s |
| Webhook processing | < 1s |

---

## Registro de Problemas

| # | Fluxo | Problema | Gravidade | Status |
|---|---|---|---|---|
| | | | | |

**Gravidade:** BAIXA | MÉDIA | ALTA | BLOQUEANTE
**Status:** ABERTO | CORRIGIDO | AGUARDANDO

---

---

## Organização das Sessões

Dividir a execução em sessões curtas. Cada sessão gera uma lista de problemas encontrados e corrigidos antes de avançar.

| Sessão | Fluxos | Cenários | Duração estimada |
|---|---|---|---|
| 1 | Fluxo 1 — Primeira empresa + Fluxo 2 — Cadastro base | 15 | 30 min |
| 2 | Fluxo 3 — Estoque | 9 | 30 min |
| 3 | Fluxo 4 — PDV | 14 | 45 min |
| 4 | Fluxo 5 — CRM | 12 | 30 min |
| 5 | Fluxo 6 — Integrações | 8 | 30 min |
| 6 | Fluxo 7 — Recuperação de erros | 10 | 20 min |
| 7 | Fluxo 8 — Concorrência | 6 | 15 min |
| 8 | Fluxo 9 — UX e Interface | 15 | 20 min |

**Total:** ~3h40 de execução (excluindo correções).

---

## Critérios para Aprovação da UAT

| # | Critério | Obrigatório |
|---|---|---|
| 1 | 100% dos cenários executados | ✅ |
| 2 | 0 bugs bloqueantes | ✅ |
| 3 | 0 bugs de gravidade ALTA | ✅ |
| 4 | Máximo de 5 bugs MÉDIA (com plano de correção) | ✅ |
| 5 | Bugs BAIXA documentados e aceitos | ✅ |
| 6 | Performance dentro dos limites definidos | ✅ |
| 7 | Todos os testes automatizados passando | ✅ |
| 8 | Build de produção gerado com sucesso | ✅ |

A UAT só é considerada concluída quando todos os 8 critérios forem atendidos.

---

## Checklist Final

### Sessão 1 — Empresa + Cadastros
- [ ] Fluxo 1 — Primeira empresa (7 passos)
- [ ] Fluxo 2 — Cadastro base (8 passos)

### Sessão 2 — Estoque
- [ ] Fluxo 3 — Estoque (9 passos)

### Sessão 3 — PDV
- [ ] Fluxo 4 — PDV (14 passos)

### Sessão 4 — CRM
- [ ] Fluxo 5 — CRM (12 passos)

### Sessão 5 — Integrações
- [ ] Fluxo 6 — Integrações (8 passos)

### Sessão 6 — Recuperação de Erros
- [ ] Fluxo 7 — Recuperação de Erros (10 cenários)

### Sessão 7 — Concorrência
- [ ] Fluxo 8 — Concorrência (6 cenários)

### Sessão 8 — UX
- [ ] Fluxo 9 — UX e Interface (15 aspectos)

### Globais
- [ ] Performance dentro dos limites
- [ ] Nenhum erro 500 inesperado
- [ ] Navegação responsiva (mobile testado)
- [ ] Build limpo
- [ ] Testes automatizados passando
