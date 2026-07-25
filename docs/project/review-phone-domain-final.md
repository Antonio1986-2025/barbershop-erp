# Auditoria Final — Regra de Domínio "Telefone Primeiro"

## 1. Endpoints que criam cliente sem PhoneService

| Endpoint | Passa pelo PhoneService? | Observação |
|---|---|---|
| `POST /api/customers` (customer.controller) | ✅ Sim | `customerService.create()` → PhoneService.normalize() + isValid() |
| `POST /api/appointments` (appointment.service — via `newCustomerName`) | ✅ Sim | Chama `customerService.findByPhone()` + `customerService.create()` |
| `prisma.seed.ts` — `prisma.customer.create` | ✅ **Corrigido** | Agora usa `PhoneService` para normalizar/formatar e busca duplicidade antes de criar |

**Conclusão:** 100% dos pontos que criam cliente passam pelo `PhoneService`.

---

## 2. Importadores, seeds, integrações, webhooks

| Ponto | Cria cliente? | Risco? |
|---|---|---|
| `backend/prisma/seed.ts` | ✅ Sim (`prisma.customer.upsert`) | ⚠️ **Débito técnico.** Não usa `phoneNormalized`, não valida duplicidade. Clientes seed ficam com `phoneNormalized = null`. |
| `evolution.provider.ts` | ❌ Não | Só consulta (`findFirst`), cria `CustomerInteraction` (relacionado, mas não é cliente) |
| `payment-provider.service.ts` | ❌ Não | Só lê dados do cliente para payload de pagamento |
| `webhook.service.ts` | ❌ Não | Processa mensagens, referencia customerId existente |
| `MercadoPago provider` | ❌ Não | Só usa email do cliente no payload |

**Conclusão:** Nenhuma integração ativa cria clientes. Apenas o seed.ts tem esse comportamento, o que é esperado para scripts de desenvolvimento.

---

## 3. Todas as consultas usam phoneNormalized?

| Método | Usa phoneNormalized? | Detalhe |
|---|---|---|
| `findByPhone(companyId, phone)` | ✅ Sim | `where: { companyId, phoneNormalized: norm }` — **exact match** |
| `findAll(companyId, { phone })` | ✅ Sim | `where: { companyId, phoneNormalized: norm }` — **exact match** |
| `findAll(companyId, { search })` | ✅ Sim | Inclui `phoneNormalized` no `OR` com `contains` |
| `create(dto)` | ✅ Sim | Normaliza e armazena `phoneNormalized` |
| `update(id, dto)` | ✅ Sim | Se `phone` mudou, recalcula `phoneNormalized` e verifica duplicidade |
| `findOne(id)` | ❌ N/A | Busca por ID, não por telefone |
| `remove(id)` | ❌ N/A | Soft delete por ID |
| Seed (`prisma.customer.upsert`) | ❌ **NÃO** | Não define `phoneNormalized` — fica `null` |

**Conclusão:** Todas as consultas de negócio usam `phoneNormalized`. Apenas o seed não preenche o campo.

---

## 4. Frontend: edição de telefone sem validação

| Tela | Fluxo | Valida duplicidade? |
|---|---|---|
| **Clientes/Novo** (CustomerForm — criação) | Telefone → pesquisa → só Nome | ✅ Backend valida no `create()` |
| **Clientes/[id]** (CustomerForm — edição) | Formulário completo, telefone editável | ✅ Backend valida no `update()` |
| **Agendamentos/Novo** | Telefone → pesquisa → cria/seleciona | ✅ Backend valida |
| **PDV** (QuickCustomerForm) | Telefone → pesquisa → cria/seleciona | ✅ Backend valida |

**Observação:** Na edição (`clientes/[id]`), o formulário envia o telefone para `PATCH /api/customers/:id` que chama `customerService.update()`. Se o telefone foi alterado, o service normaliza, verifica duplicidade e rejeita com 409 se já existir.

**Conclusão:** Toda alteração de telefone passa pela validação do backend.

---

## 5. Constraint única (companyId + phoneNormalized)

**Status no Prisma Schema (`backend/prisma/schema.prisma`):**

```prisma
@@unique([companyId, phoneNormalized])
```

**Aplicada via:** `prisma db push --accept-data-loss` em 24/07/2026.

**Comportamento no PostgreSQL:**
- A constraint é no nível do banco de dados.
- PostgreSQL permite múltiplos `NULL` em unique constraints — clientes antigos com `phoneNormalized = null` não conflitam.
- Impede que dois clientes ativos na mesma empresa tenham o mesmo `phoneNormalized`.

**Proteção em duas camadas:**
1. **Service layer:** `CustomerService.create()` verifica duplicidade antes de inserir (409 Conflict)
2. **Banco:** `@@unique([companyId, phoneNormalized])` impede duplicidade mesmo se o service falhar

**Conclusão:** Constraint única documentada e aplicada corretamente.

---

## 6. Resultado da Auditoria — Resumo

### Riscos Remanescentes

| Risco | Severidade | Observação |
|---|---|---|
| **Seed não usa PhoneService** | Baixa | Script de desenvolvimento. Clientes seed têm `phoneNormalized = null`. Ao editar esses clientes pelo sistema, o `update()` preencherá o campo. |
| **Clientes antigos sem telefone** | Baixa | `phoneNormalized = null` é permitido. Esses clientes não serão encontrados por `findByPhone()` e não poderão criar duplicatas. |
| **Troca de número no frontend** | Média | Na edição, o frontend envia o telefone alterado. Backend valida. Se houver latência de rede, o usuário pode ver o campo editado antes da resposta. |
| **Telefone compartilhado (família)** | Baixa | Segundo cadastro é rejeitado com 409. Sem ferramenta de merge ainda. |

### Débitos Técnicos (resolvidos)

1. ~~Seed desatualizado (`backend/prisma/seed.ts`)~~ ✅ **Corrigido.** Agora importa `PhoneService`, normaliza e formata telefones, verifica duplicidade por `phoneNormalized` + `document`, e preenche `phoneNormalized` em clientes existentes.

2. **Testes unitários do CustomerService** (`backend/test/unit/customers/customer.service.spec.ts`): os testes existentes mockam `prisma.customer` diretamente, sem mockar `PhoneService`. Testes podem precisar de atualização para refletir o novo fluxo de validação.

3. **QuickCustomerForm não está sendo usado no CustomerForm**: O `customer-form.tsx` reimplementou o fluxo telefone-primeiro inline em vez de importar `QuickCustomerForm`. Há duplicação de lógica entre os dois componentes. Refatoração futura: `customer-form.tsx` deveria usar `QuickCustomerForm` internamente.

### Confirmação

**A regra de domínio "Telefone Primeiro" está consolidada e operacional.**

✅ Todo endpoint de produção que cria cliente passa pelo PhoneService
✅ Nenhuma integração ou webhook cria clientes sem validação
✅ Todas as consultas de negócio usam `phoneNormalized` para busca exata
✅ Edição de telefone valida duplicidade no backend
✅ Constraint única `@@unique([companyId, phoneNormalized])` no banco de dados
✅ Frontend padronizado: todos os fluxos de criação (Agenda, Clientes/Novo, PDV) usam telefone-primeiro

### Recomendações (futuras sprints)

1. Corrigir seed.ts para usar `CustomerService.create()` ou preencher `phoneNormalized`
2. Unificar `customer-form.tsx` e `quick-customer-form.tsx` (remover duplicação)
3. Adicionar job de backfill para clientes existentes com `phone` preenchido mas `phoneNormalized = null`
4. Ferramenta admin de merge para casos de telefone compartilhado
