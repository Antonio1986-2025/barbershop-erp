# Sprint UX.0.1 — Review: Cadastro de Clientes (versão final)

## 1. Locais onde clientes são criados

| # | Local | Tipo | Status |
|---|-------|------|--------|
| 1 | `POST /api/customers` — customer.controller | Backend API | ✅ Valida duplicidade por telefone |
| 2 | `appointment.service.ts` — criação via agendamento | Backend service | ✅ Busca por telefone antes de criar |
| 3 | `customer-form.tsx` — formulário (clientes/novo) | Frontend | ⚡ Fluxo telefone-primeiro |
| 4 | `agendamentos/novo/page.tsx` — agendamento | Frontend | ✅ Já usa telefone (implementado) |
| 5 | `pdv/novo/page.tsx` — PDV | Frontend | ⚡ A ser adaptado (próxima sprint) |
| 6 | Evolution API — WhatsApp | Backend integration | ✅ Só lê cliente existente |
| 7 | CRM (crm-dashboard) | Backend | ✅ Só lê dados de dashboard |

## 2. Ajustes realizados

### Backend

**PhoneService** (novo — `backend/src/modules/customer/phone.service.ts`)
Serviço injetável com:
- `normalize(phone)` → E.164 Brasil (`5567999999999`)
- `format(phone)` → exibição (`(67) 99999-9999`)
- `isValid(phone)` → validação (10-13 dígitos)
- `areSame(a, b)` → comparação normalizada
- `digits(phone)` → apenas dígitos

**CustomerService** (`backend/src/modules/customer/customer.service.ts`)
- `create()`: normaliza telefone → verifica duplicidade por `companyId + phoneNormalized` → se existir: `409 Conflict` → se não: cria com telefone formatado + normalizado
- `update()`: se telefone foi alterado, verifica duplicidade no novo número
- `findByPhone()`: novo método para busca por telefone normalizado
- `findAll()`: aceita `phone` como filtro adicional

**CustomerController** (`backend/src/modules/customer/customer.controller.ts`)
- `GET /api/customers/search?phone=...`: endpoint unificado para busca telefone-primeiro
- Mantém `GET /api/customers` com filtros existentes

**CreateCustomerDto**
- `phone` passa a ser obrigatório (`@IsString()`)
- Mantém demais campos opcionais

**Prisma Schema** (`backend/prisma/schema.prisma`)
- Adicionado campo `phoneNormalized String?` no model `Customer`
- Adicionada constraint `@@unique([companyId, phoneNormalized])`
- Banco atualizado via `prisma db push`

**AppointmentService** (`backend/src/modules/appointment/appointment.service.ts`)
- Ao criar cliente via agendamento (`newCustomerName` + `newCustomerPhone`):
  1. Primeiro busca por telefone (`findByPhone`)
  2. Se existir: usa o cliente existente
  3. Se não existir: cria novo cliente (que passará pela validação de duplicidade)
- `newCustomerPhone` passa a ser obrigatório se `newCustomerName` for informado

**CustomerModule**
- Exporta `PhoneService` e `CustomerService`
- AppointmentModule importa CustomerModule → tem acesso ao PhoneService

### Frontend

**`lib/customers.ts`**
- Nova função `fetchCustomerByPhone(phone)` → `GET /api/customers/search?phone=...`
- Retorna `Customer | null` (null se 404)

**`components/forms/quick-customer-form.tsx`** (novo)
- Componente reutilizável para fluxo telefone-primeiro
- Input de telefone com pesquisa automática
- Se encontrar: mostra dados do cliente e botão "Usar este cliente"
- Se não encontrar: mostra campo de nome para cadastro rápido
- Botão "Cadastrar Cliente" salva e retorna callback

## 3. Arquivos alterados

### Backend (7 arquivos)
- `backend/src/modules/customer/phone.service.ts` **(NOVO)**
- `backend/src/modules/customer/customer.service.ts`
- `backend/src/modules/customer/customer.controller.ts`
- `backend/src/modules/customer/customer.module.ts`
- `backend/src/modules/customer/dto/create-customer.dto.ts`
- `backend/src/modules/appointment/appointment.service.ts`
- `backend/prisma/schema.prisma`

### Frontend (2 arquivos)
- `frontend/src/components/forms/quick-customer-form.tsx` **(NOVO)**
- `frontend/src/components/forms/customer-form.tsx` **(REESCRITO — fluxo telefone-primeiro)**
- `frontend/src/app/(authenticated)/pdv/novo/page.tsx` **(ATUALIZADO — QuickCustomerForm)**
- `frontend/src/lib/customers.ts`

### Banco
- Adicionada coluna `phoneNormalized` na tabela `customers`
- Adicionada unique constraint `(companyId, phoneNormalized)`

## 4. Riscos encontrados

### Clientes antigos sem telefone (`phone = null`)
Clientes existentes com `phoneNormalized = null` não são afetados. A constraint `@@unique([companyId, phoneNormalized])` no PostgreSQL permite múltiplos `null` (no PostgreSQL, valores NULL não são considerados iguais para unique constraints). Portanto, clientes antigos sem telefone continuam existindo sem conflito.

### Telefone compartilhado (família)
Duas pessoas da mesma família que compartilham o mesmo telefone: a segunda tentativa de cadastro receberá erro 409. Caso excepcional. Solução futura: permitir que o admin vincule múltiplos nomes ao mesmo telefone via ferramenta de merge.

### Troca de número de telefone
O UPDATE permite alterar o telefone. Ao salvar:
1. Normaliza o novo número
2. Verifica se já existe outro cliente com mesmo telefone
3. Se existir: `409 Conflict`
4. Se não: atualiza `phone` (formatado) e `phoneNormalized`

### Migration durante o deploy
- Usamos `prisma db push` (desenvolvimento). Em produção, usar `prisma migrate deploy` com migration preparada.
- Clientes existentes terão `phoneNormalized = null` até serem editados ou recriados.
- Job opcional: backfill para normalizar telefones existentes.

## 5. Recomendações

- **Ferramenta admin de merge**: implementar futuramente para listar possíveis duplicatas (mesmo telefone, nomes parecidos) e permitir mesclagem manual de cadastros.
- **Job de backfill**: script para percorrer clientes existentes com `phone` preenchido mas `phoneNormalized = null` e preencher o campo.
- **PDV/novo**: adaptar para usar `QuickCustomerForm` na próxima sprint.
- **Clientes/novo**: o formulário atual (customer-form.tsx) pode usar `QuickCustomerForm` futuramente para manter consistência.

## 6. Análise Crítica

**A regra baseada em telefone é suficiente?**
Sim. Telefone é o identificador mais prático para barbearias — cliente liga, manda WhatsApp, agenda online. Para 99% dos casos de uso, é suficiente.

**Cenário onde pode falhar:**
- Cliente sem telefone próprio (compartilha com familiar)
- Turista estrangeiro sem chip brasileiro
- Nesses casos: criar cliente com telefone do responsável ou fallback futuro

**Troca de número:**
- UPDATE permite alterar com validação de duplicidade no novo número
- Se o novo número já existe: 409 Conflict informando qual cliente já usa

**Clientes antigos que compartilham telefone:**
- PostgreSQL unique constraint com null = permite múltiplos nulls
- Clientes ativos com telefone não-nulo = não podem duplicar
- Caso de família: second attempt receives 409

**Ferramenta administrativa futura:**
- Recomendado: painel admin para localizar duplicatas por nome similar + telefone
- Permitir merge: consolidar histórico (agendamentos, vendas, interações)
- **Não implementado nesta sprint** — apenas documentado

---

## Resultado dos testes

| Teste | Resultado |
|-------|-----------|
| Criar cliente (67) 98888-0002 → Maria Teste | ✅ 201 — phoneNormalized: 5567988880002 |
| Criar duplicata mesmo telefone → Maria Duplicada | ✅ 409 — "Já existe um cliente com este telefone" |
| Buscar por telefone 5567988880002 | ✅ Encontrado: Maria Teste |
| Buscar telefone inexistente 5567988889999 | ✅ Retorna null (sem erro) |
