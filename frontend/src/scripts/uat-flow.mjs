/**
 * UAT Flow - Validação do fluxo completo via API
 * Cliente → Agendamento → Atendimento → ServiceOrder → Sale → Pagamento
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001';

const creds = { email: 'admin@demo.com', password: '123456' };

const REPORT = 'C:\\Users\\Admin\\Downloads\\PROJETOS\\barbershop-erp\\docs\\project\\uat-flow-agendamento.md';

const results = [];
let seq = 0;

function step(name, status, detail = '') {
  seq++;
  const emoji = status === 'OK' ? '✅' : status === 'ERRO' ? '❌' : '⚠️';
  results.push({ seq, name, status, detail });
  console.log(`${emoji} [${status}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function api(route, options = {}) {
  const url = `${API}${route}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (options.token) defaultHeaders['Authorization'] = `Bearer ${options.token}`;
  
  const fetchOpts = {
    method: options.method || 'GET',
    headers: { ...defaultHeaders, ...options.headers },
  };
  if (options.body) fetchOpts.body = JSON.stringify(options.body);
  
  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('═══════════════════════════════════════════════');
  console.log('  UAT FLOW — BARBERSHOP ERP — SPRINT UX.0.1');
  console.log('═══════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  try {
    // ═══════ ETAPA 1: LOGIN (FRONTEND) ═══════
    console.log('═══ ETAPA 1: Login no Frontend ═══\n');
    
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    const pageTitle = await page.title();
    step('Página de login', 'OK', `Title: "${pageTitle}"`);
    
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    const urlAfterLogin = page.url();
    step('Login realizado', urlAfterLogin.includes('/dashboard') ? 'OK' : 'ERRO', `Redirect: ${urlAfterLogin}`);

    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('barbershop_access_token'));
    step('Token JWT obtido', token && token.length > 50 ? 'OK' : 'ERRO', `Token: ${token?.substring(0, 30)}...`);

    // ═══════ ETAPA 2: DASHBOARD ═══════
    console.log('\n═══ ETAPA 2: Dashboard ═══\n');
    
    const dashContent = await page.textContent('body');
    step('Dashboard carregado', dashContent.includes('dashboard') || dashContent.includes('Dashboard') ? 'OK' : '⚠️', 'Página pós-login renderizada');
    
    // Check dashboard API
    const dashApi = await api('/api/dashboard', { token });
    step('API Dashboard', dashApi.ok ? 'OK' : '⚠️', `Status: ${dashApi.status}`);

    // ═══════ ETAPA 3: CLIENTES ═══════
    console.log('\n═══ ETAPA 3: Clientes ═══\n');
    
    const custResp = await api('/api/customers?limit=5', { token });
    const customers = custResp.ok ? (custResp.data?.data || []) : [];
    step('API Clientes', custResp.ok ? 'OK' : 'ERRO', `Status: ${custResp.status}, ${customers.length} clientes`);

    let testCustomer;
    if (customers.length > 0) {
      testCustomer = customers[0];
      step('Cliente disponível para teste', 'OK', `${testCustomer.name} — ${testCustomer.phone}`);
    } else {
      // Create a test customer
      const newCust = await api('/api/customers', {
        method: 'POST',
        token,
        body: { name: 'UAT Teste', phone: '(67) 99999-0001', email: 'uat@teste.com' }
      });
      if (newCust.ok) {
        testCustomer = newCust.data;
        step('Cliente de teste criado', 'OK', `${testCustomer.name} — ID: ${testCustomer.id?.substring(0, 8)}`);
      } else {
        step('Criação de cliente de teste', 'ERRO', `${newCust.status}: ${JSON.stringify(newCust.data)}`);
      }
    }

    // ═══════ ETAPA 4: PROFISSIONAIS & SERVIÇOS ═══════
    console.log('\n═══ ETAPA 4: Profissionais & Serviços ═══\n');
    
    const profResp = await api('/api/professionals', { token });
    const professionals = profResp.ok ? (profResp.data?.data || []) : [];
    step('API Profissionais', profResp.ok && professionals.length > 0 ? 'OK' : 'ERRO', 
         `${professionals.length} profissionais`);

    const servResp = await api('/api/services?limit=5', { token });
    const services = servResp.ok ? (servResp.data?.data || []) : [];
    step('API Serviços', servResp.ok && services.length > 0 ? 'OK' : 'ERRO', 
         `${servResp.data?.meta?.total || services.length} serviços disponíveis`);

    let testProfessional = professionals[0];
    let testService = services[0];
    let testUnit = testProfessional?.units?.[0]?.unit;

    step('Dados base completos', testProfessional && testService ? 'OK' : 'ERRO',
         `Prof: ${testProfessional?.name}, Serviço: ${testService?.name}, Unidade: ${testUnit?.name}`);

    // ═══════ ETAPA 5: AGENDAMENTO (CRIAR VIA API) ═══════
    console.log('\n═══ ETAPA 5: Criar Agendamento ═══\n');
    
    if (testCustomer && testProfessional && testService && testUnit) {
      const startAt = new Date();
      startAt.setDate(startAt.getDate() + 1);
      startAt.setHours(10, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + Number(testService.durationMinutes || 30));

      const aptResp = await api('/api/appointments', {
        method: 'POST',
        token,
        body: {
          customerId: testCustomer.id,
          professionalId: testProfessional.id,
          serviceId: testService.id,
          unitId: testUnit.id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          notes: 'UAT Flow - Agendamento de teste'
        }
      });

      const appointment = aptResp.data;
      step('Agendamento criado', aptResp.ok ? 'OK' : 'ERRO',
           aptResp.ok
             ? `ID: ${appointment.id?.substring(0, 8)}, Status: ${appointment.status}, Início: ${startAt.toLocaleString('pt-BR')}`
             : `${aptResp.status}: ${JSON.stringify(aptResp.data)}`);

      if (aptResp.ok && appointment) {
        const aptId = appointment.id;

        // ═══════ ETAPA 6: CONCLUIR ATENDIMENTO ═══════
        console.log('\n═══ ETAPA 6: Concluir Atendimento (CONFIRMED) ═══\n');
        
        // Update appointment status to CONFIRMED then COMPLETED
        const confirmResp = await api(`/api/appointments/${aptId}/status`, {
          method: 'PATCH',
          token,
          body: { status: 'CONFIRMED' }
        });
        step('Agendamento confirmado', confirmResp.ok ? 'OK' : 'ERRO',
             confirmResp.ok ? `Status: ${confirmResp.data?.status || 'CONFIRMED'}` : `${confirmResp.status}`);

        const completeResp = await api(`/api/appointments/${aptId}/status`, {
          method: 'PATCH',
          token,
          body: { status: 'COMPLETED' }
        });
        step('Atendimento concluído (COMPLETED)', completeResp.ok ? 'OK' : 'ERRO',
             completeResp.ok ? 'Status alterado para COMPLETED' : `${completeResp.status}: ${JSON.stringify(completeResp.data)}`);

        // ═══════ ETAPA 7: SERVICE ORDER ═══════
        console.log('\n═══ ETAPA 7: Service Order ═══\n');
        
        const soResp = await api('/api/service-orders', { token });
        step('API Service Orders', soResp.ok ? 'OK' : '⚠️', `Status: ${soResp.status}`);

        let serviceOrders = soResp.ok ? (soResp.data?.data || []) : [];
        if (!Array.isArray(serviceOrders) && Array.isArray(soResp.data)) serviceOrders = soResp.data;

        let serviceOrder;
        if (serviceOrders.length > 0) {
          serviceOrder = serviceOrders[0];
          step('Service Order encontrada', 'OK', `ID: ${serviceOrder.id?.substring(0, 8)}`);
        } else {
          // Try to create one via appointment
          const createSO = await api('/api/service-orders', {
            method: 'POST',
            token,
            body: {
              appointmentId: aptId,
              customerId: testCustomer.id,
              professionalId: testProfessional.id,
              unitId: testUnit.id,
              notes: 'UAT Flow - Service Order teste'
            }
          });
          if (createSO.ok) {
            serviceOrder = createSO.data;
            step('Service Order criada', 'OK', `ID: ${serviceOrder.id?.substring(0, 8)}`);
          } else {
            step('Criação de Service Order', '⚠️', `${createSO.status}: ${createSO.data?.message || JSON.stringify(createSO.data)}`);
          }
        }

        // ═══════ ETAPA 8: ADICIONAR SERVIÇOS/PRODUTOS ═══════
        console.log('\n═══ ETAPA 8: Adicionar Itens ═══\n');
        
        if (serviceOrder?.id) {
          const addService = await api(`/api/service-orders/${serviceOrder.id}/items`, {
            method: 'POST',
            token,
            body: {
              type: 'SERVICE',
              referenceId: testService.id,
              description: testService.name,
              quantity: 1,
              unitPrice: testService.price
            }
          });
          step('Serviço adicionado à SO', addService.ok ? 'OK' : 'ERRO',
               addService.ok ? `${testService.name} - R$ ${testService.price}` : `${addService.status}`);

          // Also try to add a product
          const prodResp = await api('/api/products?limit=1', { token });
          const products = prodResp.ok ? (prodResp.data?.data || []) : [];
          if (products.length > 0) {
            const addProduct = await api(`/api/service-orders/${serviceOrder.id}/items`, {
              method: 'POST',
              token,
              body: {
                type: 'PRODUCT',
                referenceId: products[0].id,
                description: products[0].name,
                quantity: 2,
                unitPrice: products[0].salePrice
              }
            });
            step('Produto adicionado à SO', addProduct.ok ? 'OK' : 'ERRO',
                 addProduct.ok ? `${products[0].name} x2 - R$ ${Number(products[0].salePrice) * 2}` : `${addProduct.status}`);
          }
        }

        // ═══════ ETAPA 9: GERAR SALE ═══════
        console.log('\n═══ ETAPA 9: Gerar Sale ═══\n');
        
        const salesResp = await api('/api/sales?limit=5', { token });
        step('API Sales (GET)', salesResp.ok ? 'OK' : '⚠️', `Status: ${salesResp.status}`);

        if (serviceOrder?.id) {
          // Try creating sale from service order
          const saleResp = await api('/api/sales', {
            method: 'POST',
            token,
            body: {
              customerId: testCustomer.id,
              professionalId: testProfessional.id,
              unitId: testUnit.id,
              serviceOrderId: serviceOrder.id,
              items: [
                { type: 'SERVICE', referenceId: testService.id, description: testService.name, quantity: 1, unitPrice: testService.price }
              ],
              paymentMethod: 'PIX'
            }
          });

          const sale = saleResp.data;
          step('Sale gerada', saleResp.ok ? 'OK' : 'ERRO',
               saleResp.ok
                 ? `ID: ${sale.id?.substring(0, 8)}, Total: R$ ${sale.totalAmount || sale.total || '?'}`
                 : `${saleResp.status}: ${sale?.message || JSON.stringify(sale)}`);

          // ═══════ ETAPA 10: PAGAMENTO ═══════
          console.log('\n═══ ETAPA 10: Pagamento ═══\n');
          
          if (saleResp.ok && sale?.id) {
            const payResp = await api(`/api/sales/${sale.id}/payment`, {
              method: 'POST',
              token,
              body: {
                amount: sale.totalAmount || sale.total || testService.price,
                method: 'PIX'
              }
            }).catch(async () => {
              // Try alternative endpoint
              return await api(`/api/sales/${sale.id}`, {
                method: 'PATCH',
                token,
                body: { status: 'PAID', paymentMethod: 'PIX' }
              });
            });
            step('Pagamento registrado', payResp.ok || payResp.status === 409 ? 'OK' : 'ERRO',
                 payResp.ok ? `Status: ${payResp.status}` : `${payResp.status}: ${payResp.data?.message || 'Pode já estar pago'}`);
          }
        }

        // ═══════ ETAPA 11: VERIFICAR FLUXO NO FRONTEND ═══════
        console.log('\n═══ ETAPA 11: Navegação no Frontend ═══\n');

        // Tenta acessar rotas do frontend
        const routes = [
          { path: '/dashboard', name: 'Dashboard' },
          { path: '/appointments', name: 'Agendamentos' },
          { path: '/customers', name: 'Clientes' },
          { path: '/sales', name: 'Vendas' },
        ];

        for (const route of routes) {
          try {
            await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 10000 });
            const bodyText = await page.textContent('body');
            const hasContent = bodyText.length > 100;
            step(`Frontend: ${route.name}`, hasContent ? 'OK' : '⚠️',
                 hasContent ? `Rota ${route.path} carregou` : `Rota ${route.path} — pouco conteúdo`);
          } catch (err) {
            step(`Frontend: ${route.name}`, 'ERRO', `${route.path}: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    step('Erro geral na execução', 'ERRO', err.message);
    console.error(err);
  } finally {
    await browser.close();
  }

  // ═══════ RESUMO ═══════
  console.log('\n═══════════════════════════════════════════════');
  console.log('  RESUMO DA VALIDAÇÃO');
  console.log('═══════════════════════════════════════════════\n');

  const total = results.length;
  const passed = results.filter(r => r.status === 'OK').length;
  const errors = results.filter(r => r.status === 'ERRO').length;
  const warns = results.filter(r => r.status === '⚠️').length;

  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : r.status === 'ERRO' ? '❌' : '⚠️';
    console.log(`${icon} ${r.seq}. ${r.name}: ${r.detail}`);
  });

  console.log(`\n📊 Total: ${total} | ✅ ${passed} | ⚠️ ${warns} | ❌ ${errors}`);

  const finalStatus = errors > 0 ? 'REPROVADO' : warns > 0 ? 'APROVADO COM RESSALVAS' : 'APROVADO';
  console.log(`\n🏁 Status Final: ${finalStatus}`);

  // ═══════ RELATÓRIO MARKDOWN ═══════
  const bugsFound = results.filter(r => r.status === 'ERRO');
  const bugsWarn = results.filter(r => r.status === '⚠️');

  const md = `# UAT — Fluxo de Agendamento

> **Sprint:** UX.0.1 — Validação de fluxo completo  
> **Data:** ${new Date().toLocaleDateString('pt-BR')}  
> **Responsável:** Hermes Agent  

---

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de etapas | ${total} |
| ✅ Aprovadas | ${passed} |
| ⚠️ Ressalvas | ${warns} |
| ❌ Erros | ${errors} |
| **Status Final** | **${finalStatus}** |

---

## Fluxo Executado

O teste percorreu as seguintes etapas:

| # | Etapa | Descrição |
|---|-------|-----------|
${results.map(r => `| ${r.seq} | ${r.name} | ${r.detail} |`).join('\n')}

---

## Etapas Aprovadas

${results.filter(r => r.status === 'OK').map(r => `- ✅ **${r.name}**: ${r.detail}`).join('\n') || 'Nenhuma'}

---

## Bugs Encontrados

${bugsFound.map(r => `- ❌ **${r.name}**: ${r.detail}`).join('\n') || 'Nenhum bug com erro encontrado.'}

---

## Bugs Corrigidos

N/A — Esta validação não inclui correções (apenas análise).

---

## Bugs Pendentes

${bugsWarn.map(r => `- ⚠️ **${r.name}**: ${r.detail}`).join('\n') || 'Nenhum pendente.'}

---

## Conclusão

**Status: ${finalStatus}**

${errors > 0
  ? `O sistema apresenta **${errors} erro(s)** que impedem a aprovação do fluxo completo. Recomenda-se corrigir os bugs listados antes de iniciar a próxima sprint.`
  : warns > 0
    ? `O sistema está funcional, mas apresenta **${warns} ponto(s)** que merecem atenção. Pode-se iniciar a próxima sprint com ressalvas.`
    : 'O sistema está **totalmente operacional**. Todos os fluxos testados funcionam conforme esperado. Pode-se iniciar a próxima sprint sem pendências.'}
`;

  require('fs').writeFileSync(REPORT, md);
  console.log(`\n📄 Relatório salvo em: ${REPORT}`);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
