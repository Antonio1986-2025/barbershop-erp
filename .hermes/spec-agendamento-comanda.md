## Spec: Agendamento + Comanda + Novo Cliente

**Problema:** Ao criar um agendamento, o usuário precisa:
1. Poder cadastrar um cliente novo sem sair da tela
2. Que seja aberta automaticamente uma comanda (venda) com o serviço agendado

**Abordagem:** Sem gambiarra — integração limpa entre os módulos existentes.

### O que muda

**Backend — `appointment.service.ts`:**
- Adicionar flag opcional `createSale: boolean` no `CreateAppointmentDto`
- Quando `createSale = true`, após criar o agendamento, criar também uma `Sale` com status `OPEN` contendo o serviço como item, vinculada ao mesmo cliente, unidade e empresa

**Backend — `CreateAppointmentDto`:**
- Adicionar campos opcionais `newCustomerName` e `newCustomerPhone`
- Quando preenchidos, criar o cliente automaticamente antes de criar o agendamento

**Frontend — `agendamentos/novo/page.tsx`:**
- Adicionar um toggle "Cliente existente" / "Novo cliente"
- No modo "Novo cliente": inputs de nome e telefone (sem select)
- Checkbox "Abrir comanda" marcado por padrão
- Ao submeter: se for novo cliente, chama POST /api/customers primeiro, depois cria agendamento com `createSale: true`

### Critérios de aceite
- [ ] Botão "Novo Cliente" ao lado do select de cliente
- [ ] Modo novo cliente mostra inputs de nome + telefone
- [ ] Checkbox "Abrir comanda" no formulário
- [ ] Ao salvar com novo cliente + comanda: cliente é criado, agendamento é criado, venda aparece no PDV
- [ ] Ao salvar com cliente existente + comanda: venda aparece no PDV
- [ ] Ao salvar sem comanda: apenas agendamento (comportamento atual)
- [ ] Tudo via chamadas de API, sem gambiarra de página estática

### Arquivos que serão alterados
1. `backend/src/modules/appointment/dto/create-appointment.dto.ts`
2. `backend/src/modules/appointment/appointment.service.ts`
3. `backend/src/modules/appointment/appointment.controller.ts`
4. `frontend/src/lib/appointments.ts` (tipos/types)
5. `frontend/src/app/(authenticated)/agendamentos/novo/page.tsx`
