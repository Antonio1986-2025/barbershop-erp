# Domínio do Barbeiro — v1.1

**Data:** 25/07/2026
**Status:** 📋 DOCUMENTAÇÃO (pré-implementação)
**Versão alvo:** 1.1.0

---

## 1. Objetivo do Módulo

Criar um domínio específico para o barbeiro, separando sua experiência da do administrador/gerente. Hoje o barbeiro compartilha a mesma interface e permissões dos demais usuários, o que causa:

- Exposição a funcionalidades que o barbeiro não deveria acessar (financeiro, configurações, usuários)
- Dificuldade em calcular comissões (não há vínculo entre venda e profissional)
- Falta de um dashboard específico (o barbeiro só vê a agenda)
- Impossibilidade de o barbeiro gerenciar seu próprio expediente

O módulo do barbeiro vai:

1. Criar um perfil específico com permissões ajustadas
2. Vincular o profissional às vendas para cálculo de comissão
3. Fornecer um dashboard focado no dia a dia do barbeiro
4. Permitir que o barbeiro gerencie sua agenda e comissões

---

## 2. Perfil do Barbeiro

### Quem é o barbeiro?

O barbeiro é o profissional que realiza os atendimentos na barbearia. Ele não é administrador do sistema — sua função é atender clientes, registrar serviços e produtos, e gerenciar sua agenda.

### Como é hoje (v1.0)

- O barbeiro é cadastrado como **Profissional** e também como **Usuário** do sistema
- O perfil atual não diferencia barbeiro de gerente na prática
- O barbeiro vê o mesmo menu que os demais usuários

### Como será na v1.1

- Perfil **BARBER** separado de **ADMIN**, **MANAGER**, **RECEPTIONIST**
- Menu reduzido: apenas as funcionalidades que o barbeiro precisa
- Dashboard próprio com indicadores do dia
- Acesso restrito à própria agenda e às próprias comissões

---

## 3. Permissões Permitidas

O barbeiro na v1.1 poderá:

| Permissão | Justificativa |
|-----------|---------------|
| Visualizar própria agenda | Saber quais clientes agendou |
| Confirmar agendamento próprio | Confirmar presença do cliente |
| Marcar CHECKED_IN | Cliente chegou |
| Iniciar/próprio atendimento | Começar o serviço |
| Concluir próprio atendimento | Finalizar o serviço |
| Adicionar serviços à venda | Serviço extra durante atendimento |
| Adicionar produtos à venda | Vender produtos durante atendimento |
| Visualizar próprias comissões | Acompanhar quanto ganhou |
| Visualizar próprio dashboard | Ver métricas do dia |
| Consultar clientes | Ver histórico do cliente |
| Cadastrar cliente | Novo cliente sem precisar da recepção |
| Encerrar próprio expediente | Parar de receber novos agendamentos |

---

## 4. Permissões Proibidas

O barbeiro NÃO poderá:

| Permissão | Motivo |
|-----------|--------|
| Acessar financeiro | Dados sensíveis da empresa |
| Acessar caixa | Apenas gerente/administrador |
| Fechar caixa | Apenas gerente/administrador |
| Gerenciar usuários | Apenas administrador |
| Gerenciar permissões | Apenas administrador |
| Configurar empresa | Apenas administrador |
| Configurar integrações | Apenas administrador |
| Excluir clientes | Segurança dos dados |
| Cancelar venda sem motivo | Impacto financeiro |
| Aplicar desconto acima do limite | Margem da empresa |
| Ver comissão de outros barbeiros | Privacidade |
| Alterar serviços/produtos | Apenas administrador/gerente |
| Ver relatórios gerenciais | Dados sensíveis |

---

## 5. Fluxo Completo do Barbeiro

```
                   LOGIN
                     │
                     ▼
              MINHA AGENDA
        (visão do dia, apenas seus
         agendamentos)
                     │
                     ▼
         CONFIRMAR CHEGADA DO CLIENTE
        (CHECKED_IN — cliente presente)
                     │
                     ▼
           INICIAR ATENDIMENTO
        (IN_PROGRESS — mão na tesoura)
                     │
                     ▼
        ┌──────────────────────────┐
        │  ADICIONAR SERVIÇOS      │
        │  (se o cliente pedir     │
        │   algo extra)            │
        └──────────────────────────┘
                     │
        ┌──────────────────────────┐
        │  ADICIONAR PRODUTOS      │
        │  (se o cliente comprar   │
        │   shampoo, pomada, etc)  │
        └──────────────────────────┘
                     │
                     ▼
           FINALIZAR ATENDIMENTO
        (COMPLETED — serviço feito)
                     │
                     ▼
         ┌──────────────────────┐
         │    GERAR VENDA       │
         │  (se não foi gerada  │
         │   automaticamente)   │
         └──────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  RECEBER COMISSÃO    │
         │  (calculada ao       │
         │   finalizar venda    │
         │   com base nas       │
         │   regras definidas)  │
         └──────────────────────┘
                     │
                     ▼
           ENCERRAR EXPEDIENTE
        (marca como indisponível
         para novos agendamentos)
```

### Detalhamento do fluxo

#### 5.1 Login
O barbeiro faz login com email e senha. O sistema identifica o perfil BARBER e redireciona para o dashboard específico.

**Regras:**
- Login padrão JWT (já implementado)
- Redirecionamento por perfil (novo)

#### 5.2 Minha Agenda
Visão do dia mostrando apenas os agendamentos do barbeiro logado.

**Regras:**
- Filtrar por `professionalId = userId.professionalId`
- Mostrar data, horário, cliente, serviço, status
- Botões de ação por status

#### 5.3 Confirmar Chegada do Cliente
Quando o cliente chega na barbearia, o barbeiro marca como CHECKED_IN.

**Regras:**
- Apenas agendamentos SCHEDULED ou CONFIRMED podem virar CHECKED_IN
- Notifica a recepção/gerente (se houver)

#### 5.4 Iniciar Atendimento
O barbeiro inicia o serviço.

**Regras:**
- Apenas CHECKED_IN pode virar IN_PROGRESS
- Registra o horário de início

#### 5.5 Adicionar Serviços
Se o cliente pedir um serviço extra (ex: barba após o corte), o barbeiro adiciona à venda.

**Regras:**
- Apenas serviços ativos
- Adiciona à service order / venda em aberto
- O preço é o do serviço cadastrado

#### 5.6 Adicionar Produtos
Se o cliente comprar um produto (shampoo, pomada, etc.), o barbeiro adiciona à venda.

**Regras:**
- Apenas produtos com estoque disponível
- Verifica estoque antes de adicionar
- Baixa é feita apenas na finalização da venda

#### 5.7 Finalizar Atendimento
O barbeiro conclui o serviço.

**Regras:**
- Status muda para COMPLETED
- Registra horário de fim
- Dispara interação CRM (já implementado)
- Dispara automação de lembrete de retorno (já implementado)

#### 5.8 Gerar Venda
Se a venda não foi gerada automaticamente no agendamento, o barbeiro gera agora.

**Regras:**
- Reaproveitar lógica já existente de criação de venda
- Vincular `professionalId` à venda (NOVO — necessário para comissão)
- Incluir todos os serviços e produtos adicionados

#### 5.9 Receber Comissão
Ao finalizar a venda, o sistema calcula a comissão do barbeiro.

**Regras:**
- Calculada com base nas regras de comissão configuradas
- Registrada em tabela própria (Commission)
- Visível no dashboard do barbeiro
- Não interfere no fluxo de pagamento do cliente

#### 5.10 Encerrar Expediente
O barbeiro marca que encerrou o turno.

**Regras:**
- Não recebe mais agendamentos novos
- Agendamentos existentes permanecem
- Pode ser reaberto no mesmo dia

---

## 6. Comissão

### Modelos Possíveis

#### 6.1 Percentual por Serviço

```
comissão = preço_do_serviço × percentual
Ex: Corte R$50 × 50% = R$25 para o barbeiro
```

**Quando usar:** Quando o barbeiro ganha um percentual sobre cada serviço.

**Configuração:** Percentual por serviço ou por categoria de serviço.

#### 6.2 Percentual por Produto

```
comissão = preço_do_produto × percentual
Ex: Pomada R$30 × 10% = R$3 para o barbeiro
```

**Quando usar:** Quando o barbeiro ganha um percentual sobre produtos que vende.

#### 6.3 Valor Fixo

```
comissão = valor_fixo_por_atendimento
Ex: R$10 por cliente atendido
```

**Quando usar:** Quando o barbeiro ganha um valor fixo independente do serviço.

#### 6.4 Comissão por Barbeiro

Cada barbeiro pode ter regras diferentes:

```
Barbeiro A: 50% sobre serviços
Barbeiro B: 40% sobre serviços + 10% sobre produtos
Barbeiro C: R$15 fixo por atendimento
```

#### 6.5 Comissão por Empresa

A empresa define a regra global, mas pode sobrescrever por barbeiro.

```
Regra padrão: 45% sobre serviços
Barbeiro A (exceção): 50%
```

#### 6.6 Pagamento Parcial

Se a venda for paga em parcelas, a comissão pode ser:

- **Opção A:** integral no primeiro pagamento (barbeiro recebe tudo de uma vez)
- **Opção B:** proporcional a cada pagamento (barbeiro recebe conforme o caixa recebe)

**Recomendação v1.1:** Opção A (integral no primeiro pagamento) — mais simples e evita retrabalho.

#### 6.7 Cancelamentos

Se a venda for cancelada:

- **Comissão já paga:** Deve ser estornada (registro negativo)
- **Comissão não paga:** Não é gerada
- O estorno da venda já reverte cashback, loyalty e estoque — a comissão deve seguir o mesmo fluxo

#### 6.9 Estornos

Se a venda for estornada (reembolso):

- A comissão correspondente deve ser estornada
- O barbeiro vê o estorno no extrato de comissões

### Comportamento da Versão 1.1

| Item | Decisão v1.1 |
|------|-------------|
| Modelo inicial | Percentual por serviço (configurável por barbeiro) |
| Percentual padrão | 50% sobre serviços (configurável) |
| Comissão em produtos | Opcional, percentual configurável |
| Valor fixo | Não implementado na v1.1 |
| Pagamento parcial | Integral no primeiro pagamento |
| Cancelamento | Estorno automático da comissão |
| Estorno | Estorno automático da comissão |
| Visibilidade | Barbeiro vê apenas as próprias comissões |
| Extrato | Histórico de comissões pagas e estornadas |
| Aprovação | Gerente precisa aprovar o pagamento da comissão |

### Regras de cálculo

```
comissão_serviço = somatório(serviços × percentual_barbeiro)
comissão_produto = somatório(produtos × percentual_produto_barbeiro)
comissão_total   = comissão_serviço + comissão_produto

Percentuais são definidos por barbeiro (profissional).
Se o barbeiro não tiver regra específica, usa a regra padrão da empresa.
```

---

## 7. Dashboard do Barbeiro

### Cards do Dia

| Card | Descrição |
|------|-----------|
| Agendamentos Hoje | Total de agendamentos do dia |
| Atendimentos Realizados | Quantos concluiu |
| Faturamento Gerado | Soma das vendas que participou |
| Comissão do Dia | Comissão calculada nas vendas do dia |
| Comissão do Mês | Comissão acumulada no mês |
| Comissão Pendente | Comissões não pagas |

### Gráficos

- **Atendimentos por dia da semana** (últimos 30 dias)
- **Faturamento × Comissão** (últimos 30 dias)
- **Serviços mais realizados** (ranking pessoal)

### Listagens

- **Próximos agendamentos** (os 5 próximos)
- **Últimas comissões** (as 5 mais recentes)
- **Clientes frequentes** (os que mais atendem com ele)

---

## 8. Relatórios

### Para o Barbeiro

| Relatório | Descrição |
|-----------|-----------|
| Minhas Comissões | Período, valor, status (pendente/pago/estornado) |
| Meus Atendimentos | Cliente, serviço, data, valor, comissão |
| Meu Faturamento | Faturamento gerado vs comissão recebida |
| Minha Produtividade | Atendimentos por dia, ticket médio |

### Para o Gerente/Administrador

| Relatório | Descrição |
|-----------|-----------|
| Comissões por Barbeiro | Período, total, pendente, pago |
| Aprovar Comissões | Lista de comissões pendentes de aprovação |
| Ranking de Barbeiros | Faturamento, atendimentos, ticket médio |
| Custo de Comissões | Percentual da receita comprometido com comissões |
| Extrato de Pagamentos | Histórico de pagamentos de comissões realizados |

---

## 9. Regras de Segurança

### Autenticação

- O barbeiro faz login com email e senha (mesmo fluxo JWT atual)
- O perfil BARBER é atribuído pelo administrador

### Autorização

- Guards existentes (`JwtAuthGuard`, `RolesGuard`) devem ser estendidos para reconhecer o perfil BARBER
- Endpoints específicos do barbeiro devem validar que o `professionalId` do token corresponde ao recurso acessado
- Um barbeiro não pode ver a agenda de outro barbeiro
- Um barbeiro não pode ver a comissão de outro barbeiro

### Dados Sensíveis

- Comissão de outros barbeiros é dado sensível — nunca exposta
- Faturamento total da empresa não é exibido para o barbeiro (apenas o próprio)
- Valor de comissão pendente vs pago é visível apenas para o barbeiro e gerente

---

## 10. Dependências com Módulos Existentes

| Módulo | Dependência | O que precisa mudar |
|--------|-------------|---------------------|
| **Professional** | Alta | Vincular `professionalId` ao `userId`. Adicionar campo `commissionRate` |
| **User** | Alta | Adicionar perfil `BARBER` ao enum de perfis |
| **Appointment** | Média | Já vincula profissional — precisa garantir que o barbeiro só veja os próprios |
| **Sale** | Alta | Adicionar `professionalId` na venda (quem atendeu) |
| **SaleItem** | Alta | Adicionar `professionalId` no item (quem realizou aquele serviço) |
| **Payment** | Baixa | Nenhuma — pagamento não depende de quem atendeu |
| **Commission** | **NOVO** | Nova tabela para registrar comissões |
| **Cashback** | Baixa | Nenhuma — cashback é do cliente, independente do barbeiro |
| **Loyalty** | Baixa | Nenhuma — loyalty é do cliente |
| **CRM** | Média | Interações devem incluir o profissional que atendeu |
| **Automation** | Baixa | Nenhuma — automações são por evento, não por profissional |
| **Dashboard** | Alta | Novo dashboard específico + filtro por profissional nos existentes |
| **Stock** | Baixa | Nenhuma — baixa de estoque independe de quem vendeu |

---

## 11. Impacto no Banco de Dados

### Novas Tabelas

```prisma
model Commission {
  id        String   @id @default(uuid())
  companyId String
  saleId    String
  professionalId String
  customerId String?

  // Valores
  saleAmount     Decimal @db.Decimal(10, 2)  // Valor da venda
  commissionRate Decimal @db.Decimal(5, 2)   // Percentual aplicado
  commissionAmount Decimal @db.Decimal(10, 2) // Valor da comissão

  // Classificação
  type CommissionType  // SERVICE, PRODUCT, FIXED
  status CommissionStatus // PENDING, APPROVED, PAID, CANCELLED

  // Controle
  approvedBy String?
  approvedAt DateTime?
  paidAt     DateTime?
  cancelledBy String?
  cancelledAt DateTime?
  cancelReason String?

  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company     Company     @relation(fields: [companyId], references: [id])
  sale        Sale        @relation(fields: [saleId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])
  customer    Customer?   @relation(fields: [customerId], references: [id])

  @@index([companyId])
  @@index([professionalId])
  @@index([saleId])
  @@index([status])
  @@map("commissions")
}
```

### Novos Enums

```prisma
enum CommissionType {
  SERVICE
  PRODUCT
  FIXED
}

enum CommissionStatus {
  PENDING    // Calculada, aguardando aprovação
  APPROVED   // Aprovada pelo gerente
  PAID       // Paga ao barbeiro
  CANCELLED  // Cancelada (venda estornada)
}
```

### Alterações em Tabelas Existentes

| Tabela | Campo | Tipo | Descrição |
|--------|-------|------|-----------|
| `Professional` | `commissionRate` | `Decimal?` | Percentual padrão de comissão do barbeiro |
| `Professional` | `commissionProductRate` | `Decimal?` | Percentual sobre produtos (opcional) |
| `Professional` | `userId` | `String?` | Vincular profissional ao usuário do sistema |
| `Sale` | `professionalId` | `String?` | Profissional principal que atendeu |
| `SaleItem` | `professionalId` | `String?` | Profissional que realizou o item |
| `User` | `professionalId` | `String?` | Vincular usuário ao profissional |
| `User` | `role` | Adicionar `BARBER` | Novo perfil no enum de roles |

---

## 12. Plano de Implementação

O módulo do barbeiro será implementado em **3 sprints**:

### Sprint 1 — Base (v1.1.0-alpha)

**Objetivo:** Vincular profissional ao usuário e à venda.

| Tarefa | Esforço | Dependências |
|--------|:-------:|-------------|
| Adicionar campo `userId` na tabela `Professional` | 1h | Nenhuma |
| Adicionar campo `professionalId` na tabela `User` | 1h | Nenhuma |
| Adicionar campo `professionalId` na tabela `Sale` | 2h | Nenhuma |
| Adicionar campo `professionalId` na tabela `SaleItem` | 2h | Nenhuma |
| Adicionar perfil `BARBER` no enum de roles | 1h | Nenhuma |
| Vincular profissional à venda no momento do agendamento | 3h | Sale.professionalId |
| Vincular profissional aos itens da venda | 3h | SaleItem.professionalId |
| Migrations + seed | 2h | Todas as anteriores |

**Total estimado:** 15h

### Sprint 2 — Comissão (v1.1.0-beta)

**Objetivo:** Calcular e registrar comissões.

| Tarefa | Esforço | Dependências |
|--------|:-------:|-------------|
| Criar modelo `Commission` + enums | 2h | Sprint 1 |
| Criar `CommissionModule` com service + controller | 4h | Modelo Commission |
| Implementar cálculo de comissão na finalização da venda | 4h | CommissionService |
| Implementar estorno de comissão no cancelamento da venda | 2h | CommissionService |
| Dashboard de comissões (backend) | 3h | CommissionService |
| Relatório de comissões | 3h | CommissionService |
| Regras de segurança (RBAC) | 2h | CommissionService |

**Total estimado:** 20h

### Sprint 3 — Interface do Barbeiro (v1.1.0-rc)

**Objetivo:** Criar a experiência do barbeiro.

| Tarefa | Esforço | Dependências |
|--------|:-------:|-------------|
| Dashboard do barbeiro (frontend) | 8h | Sprint 1, Sprint 2 |
| Minha Agenda (filtrada) | 4h | Sprint 1 |
| Adicionar serviços/produtos na venda | 4h | Sprint 1 |
| Extrato de comissões | 4h | Sprint 2 |
| Encerrar expediente | 2h | Sprint 1 |
| Aprovação de comissões (gerente) | 4h | Sprint 2 |
| Testes de integração | 6h | Todas as anteriores |

**Total estimado:** 32h

### Cronograma sugerido

```
Sprint 1: Base         → 15h → semana 1
Sprint 2: Comissão     → 20h → semana 2
Sprint 3: Interface    → 32h → semanas 3-4
────────────────────────────────────────
Total: 67h (~4 semanas)
```

---

## Diagrama de Integração

```
                     ┌─────────────────────────────────────────────────────────────┐
                     │                    MÓDULO BARBEIRO v1.1                      │
                     └─────────────────────────────────────────────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
            ▼                             ▼                             ▼
   ┌─────────────────┐         ┌─────────────────────┐       ┌───────────────────┐
   │    AGENDA       │         │    ATENDIMENTO       │       │    PROFISSIONAL    │
   │                 │         │                      │       │                    │
   │ Filtra por      │◄────────│ Barbeiro inicia,     │──────►│ commissionRate     │
   │ professionalId  │         │ conclui, adiciona    │       │ commissionProduct  │
   │                 │         │ serviços/produtos    │       │ userId vinculado   │
   └────────┬────────┘         └──────────┬───────────┘       └───────────────────┘
            │                             │
            │                             │
            ▼                             ▼
   ┌─────────────────┐         ┌─────────────────────┐
   │  SERVICE ORDER  │         │       VENDA          │
   │                 │         │                      │
   │ Vinculada ao    │────────►│ professionalId       │
   │ agendamento     │         │ items[].professional │
   │                 │         │ total, desconto       │
   └─────────────────┘         └──────────┬───────────┘
                                          │
                                          ▼
                                 ┌─────────────────────┐
                                 │     PAGAMENTO        │
                                 │                      │
                                 │ CashTransaction      │
                                 │ FinancialAccount     │
                                 │ (já implementado)    │
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                    ┌─────────────────────┐
                                    │     COMISSÃO         │
                                    │                      │
                                    │ Commission (NOVA)    │
                                    │ professionalId       │
                                    │ saleId, amount, rate │
                                    │ status (PENDING/     │
                                    │ APPROVED/PAID/       │
                                    │ CANCELLED)           │
                                    └─────────────────────┘
```

---

*Documento gerado automaticamente por Hermes Agent — Domínio do Barbeiro v1.1*