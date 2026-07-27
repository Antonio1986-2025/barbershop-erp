'use client';

import { useState, useMemo } from 'react';

const VERSION = 'v1.0.6';

// ── SIMPLE SECTIONS DATA ──
interface Section { id: string; title: string; icon: string; content: string }
const SECTIONS: Section[] = [
  { id: 'primeiros-passos', title: 'Primeiros Passos', icon: '🚀', content: `
**🚀 Primeiros Passos**

Bem-vindo ao Barbershop ERP! Este guia vai te ajudar a configurar e começar a usar o sistema rapidamente.

**1. Acesse o Sistema**

Abra o navegador e acesse o endereço fornecido. Faça login com seu email e senha.

> 💡 Use o perfil correto: Admin para configuração, Barbeiro para atendimento.

**2. Configuração Inicial**

Como administrador, siga estes passos:

1. **Crie a empresa** — Acesse Empresas e cadastre os dados da sua barbearia
2. **Crie unidades** — Cadastre cada filial
3. **Configure o expediente** — Defina horários (Agenda ▶ Horários)
4. **Cadastre profissionais** — Barbeiros com especialidades e taxa de comissão
5. **Cadastre serviços** — Preço e duração
6. **Cadastre produtos** — Para venda no balcão
7. **Crie usuários** — Contas para recepcionistas e barbeiros

**3. Abra o Caixa**

Todo dia começa abrindo o caixa. Acesse Caixa, selecione a unidade, informe o valor de abertura.

> ⚠️ O caixa precisa estar aberto para pagamentos em dinheiro.

**4. Fluxo Resumido**

Agendamento → Atendimento → Comanda → Venda → Pagamento → Comissão → Financeiro

**5. Encerramento**

Ao final do dia, feche o caixa e confira os relatórios.
`},
  { id: 'guia-admin', title: 'Guia do Administrador', icon: '👑', content: `
**👑 Guia do Administrador**

O administrador tem acesso total ao sistema.

**Dashboard** — Visão geral do dia com atendimentos, faturamento e comissões.

**Empresa** — Cadastre razão social, CNPJ, endereço.

**Unidades** — Filiais com expediente e caixa próprios.

**Usuários e Permissões** — Perfis: Admin (total), Barbeiro (próprio), Operador (PDV+caixa), Visualizador (consulta).

**Comissões** — Calculadas automaticamente no pagamento. O admin aprova, rejeita (com motivo) e fecha o período.

> 💡 Priority Chain: Taxa do Serviço → Taxa do Profissional → Taxa da Empresa.

**Backup** — Use scripts/backup.sh ou o painel do banco.
`},
  { id: 'guia-recepcao', title: 'Guia da Recepcionista', icon: '💁', content: `
**💁 Guia da Recepcionista — Dia Completo**

**☀️ 08:00** — Faça login no sistema
**💰 08:05** — Abra o Caixa (informe valor inicial)
**👤 08:10** — Cadastre cliente novo (nome + telefone)
**📅 08:15** — Crie agendamento (cliente ▶ profissional ▶ serviço ▶ horário)
**✅ 08:30** — Confirme a chegada do cliente (status CONFIRMED)
**✂️ 08:35** — Inicie o atendimento (status IN_PROGRESS)
**📋 09:00** — Gere a comanda com serviços e produtos
**🛒 09:20** — Gere a venda
**💳 09:25** — Receba o pagamento (dinheiro/cartão/PIX)
**🌙 18:00** — Feche o caixa

> ✅ Boa prática: Nunca deixe o caixa aberto ao final do expediente.
`},
  { id: 'guia-barber', title: 'Guia do Barbeiro', icon: '✂️', content: `
**✂️ Guia do Barbeiro**

**Dashboard** — Seu resumo pessoal: atendimentos hoje, próximo cliente, serviços, valor vendido.

**Minha Agenda** — Seus agendamentos com filtro por status.

**Atendimento** — Fluxo: Confirmar ▶ Iniciar ▶ Concluir.

**Minhas Comandas** — Comandas vinculadas a você.

**Minhas Vendas** — Vendas dos seus atendimentos.

**Minhas Comissões** — PENDING (aguardando), APPROVED, PAID, REJECTED.

**Meu Perfil** — Seus dados e taxa de comissão.
`},
  { id: 'agenda', title: 'Agenda', icon: '📅', content: `
**📅 Agenda**

A agenda gerencia todos os agendamentos, horários dos profissionais e disponibilidade.

**Status:** PENDING (pendente) → SCHEDULED (agendado) → CONFIRMED (confirmado) → IN_PROGRESS (em andamento) → COMPLETED (concluído) | CANCELLED | NO_SHOW

**Horários:** O sistema gera slots baseado no expediente da unidade, duração do serviço, bloqueios e conflitos.

**Como criar:** Cliente ▶ Profissional ▶ Serviço ▶ Data ▶ Horário ▶ Confirmar.

> ✅ Confirme a presença antes de iniciar o atendimento.
`},
  { id: 'atendimento', title: 'Atendimento', icon: '✅', content: `
**✅ Atendimento**

Fluxo: Agendamento → CONFIRMED (chegou) → IN_PROGRESS (iniciou) → COMPLETED (concluiu).

O atendimento gera uma comanda, que vira venda, que recebe pagamento.
`},
  { id: 'comandas', title: 'Comandas', icon: '📋', content: `
**📋 Comandas (Service Orders)**

Registro intermediário entre atendimento e venda. Contém serviços e produtos consumidos.

**Fluxo:** Agendamento → Atendimento → Comanda → Venda → Pagamento → Comissão

**Como usar:** Selecione cliente e profissional, adicione serviços e produtos, feche e gere a venda.

> 💡 Produtos na comanda dão baixa no estoque automaticamente.
`},
  { id: 'vendas', title: 'Vendas', icon: '🛒', content: `
**🛒 Vendas**

Registro financeiro final. Consolida itens da comanda e gerencia o pagamento.

**Pagamentos:** Dinheiro (atualiza caixa), Cartão (financeiro), PIX, Parcial (comissão só no total).

**Cancelamento:** Vira CANCELLED, comissão CANCELLED, estoque revertido, cashback estornado.

> ⚠️ O histórico nunca é apagado — a venda continua com status CANCELLED para auditoria.
`},
  { id: 'caixa', title: 'Caixa', icon: '💰', content: `
**💰 Caixa**

Controla o dinheiro físico. Operaçōes: Abrir, Suprimento (colocar), Sangria (retirar), Fechar.

**Diferença Caixa × Financeiro:** Caixa = dinheiro físico. Financeiro = todas as contas (incluindo cartão).
`},
  { id: 'financeiro', title: 'Financeiro', icon: '📊', content: `
**📊 Financeiro**

Receitas, despesas, fluxo de caixa e fechamento mensal.

**Contas:** Receitas (vendas), Despesas (aluguel, água), Categorias.

**Fluxo de Caixa:** Entradas e saídas previstas vs. realizadas.
`},
  { id: 'estoque', title: 'Estoque', icon: '📦', content: `
**📦 Estoque**

**Operações:** Compra, Entrada, Saída, Transferência, Inventário, Kardex.

**Custo Médio:** Calculado automaticamente a cada compra. Usado para calcular lucro.

> ✅ Faça inventário mensal para precisão dos custos.
`},
  { id: 'crm', title: 'CRM', icon: '🤝', content: `
**🤝 CRM**

Perfil do cliente, interações, tasks, cashback e loyalty.

**Funcionalidades:** Histórico completo, follow-up, programa de fidelidade.

> ✅ Registre interações após cada atendimento.
`},
  { id: 'comissoes', title: 'Comissões', icon: '📈', content: `
**📈 Comissões**

Calculadas AUTOMATICAMENTE quando a venda é totalmente paga.

**Priority Chain:** 1. Taxa fixa do serviço 2. Percentual do serviço 3. Taxa do profissional 4. Taxa da empresa 5. Zero

**Status:** PENDING → APPROVED → PAID | REJECTED | CANCELLED

**Exemplo:** Serviço R$ 60, taxa 40% → Comissão R$ 24

**Fechamento:** Gerente seleciona período, sistema lista APPROVED, cria CommissionClosing, marca como PAID.
`},
  { id: 'relatorios', title: 'Relatórios', icon: '📑', content: `
**📑 Relatórios**

Vendas (período/profissional/serviço), Comissões (barbeiro/período), Estoque (baixo/inventário), Financeiro (receitas/despesas), Clientes (ativos/inativos).
`},
  { id: 'configuracoes', title: 'Configurações', icon: '⚙️', content: `
**⚙️ Configurações**

Empresa, Unidades, Usuários, Permissões, Agenda (horários/bloqueios), Financeiro (categorias), Comissões (taxas), Notificações, Backup.
`},
  { id: 'faq', title: 'FAQ', icon: '❓', content: `
**❓ Perguntas Frequentes**

**📅 Agenda**
• *Por que não aparecem horários?* Verifique expediente da unidade, dia útil, bloqueios e duração do serviço.
• *Como configurar expediente?* Agenda ▶ Horários ▶ Novo. Selecione dia, horários, ative.
• *Cliente não veio?* Altere para NO_SHOW.
• *O que são bloqueios?* Períodos sem atendimento (férias, folgas).

**💰 Caixa**
• *Precisa abrir todo dia?* Sim. Cada dia é um ciclo independente.
• *Diferença no fechamento?* O sistema registra. Investigue a causa.
• *Suprimento vs. Sangria?* Suprimento = colocar dinheiro. Sangria = retirar.

**🛒 Vendas**
• *Pagamento parcial?* Sim. Comissão só no pagamento total.
• *Cancelar venda?* Reverte comissão, estoque e cashback automaticamente.
• *Cartão aparece no caixa?* Não. Só no financeiro.

**📈 Comissões**
• *Quando é calculada?* Automaticamente quando a venda fica PAID.
• *Não apareceu?* Verifique: venda PAID? Profissional tem taxa? Já existe comissão?
• *Barbeiro vê dos outros?* Não. Só as próprias.
• *Rejeitada pode corrigir?* Não diretamente. Precisa cancelar e refazer a venda.
• *Fechamento mensal?* Consolida APPROVED em PAID com histórico permanente.

**👤 Usuários**
• *Esqueci a senha?* Contate o administrador.
• *Barbeiro acessa caixa?* Não.
• *Mudar perfil?* Sim, em Usuários > Editar.

**📦 Estoque**
• *Baixa automática?* Sim, na finalização da venda.
• *Custo médio?* Média ponderada das compras. Automático.
• *Inventário?* Conte fisicamente e registre. Sistema ajusta.

**⚙️ Sistema**
• *Precisa instalar algo?* Não. Roda no navegador.
• *Funciona no celular?* Sim, responsivo.
• *Backup?* scripts/backup.sh ou painel do banco.
• *Versão atual?* ${VERSION}
`},
  { id: 'glossario', title: 'Glossário', icon: '📖', content: `
**📖 Glossário**

**Agendamento** — Registro de serviço programado para cliente em data/horário.
**Atendimento** — Momento do serviço. Fluxo: CONFIRMED → IN_PROGRESS → COMPLETED.
**Bloqueio** — Período sem atendimento (férias, feriado).
**Caixa** — Controle do dinheiro físico. Abre/fecha diariamente.
**Cashback** — Programa de fidelidade com créditos.
**Comanda (Service Order)** — Registro entre atendimento e venda.
**Comissão** — Valor devido ao profissional. Cálculo automático.
**CommissionClosing** — Fechamento mensal de comissões.
**CRM** — Gestão de relacionamento com clientes.
**Custo Médio** — Média ponderada dos custos de compra.
**Dashboard** — Resumo de indicadores.
**Despesa** — Conta a pagar.
**Expediente** — Horários de funcionamento.
**Fechamento** — Encerramento do caixa.
**Fluxo de Caixa** — Projeção financeira.
**Inventário** — Contagem física de estoque.
**Kardex** — Histórico de movimentações de produto.
**Loyalty** — Fidelidade.
**PDV** — Ponto de Venda (venda rápida).
**Permissão** — Regra de acesso por perfil.
**Priority Chain** — Sequência de busca da taxa de comissão.
**Profissional** — Barbeiro registrado.
**Receita** — Conta a receber.
**Sangria** — Retirada de dinheiro do caixa.
**Slot** — Intervalo disponível para agendamento.
**Status** — Estado atual de um registro.
**Suprimento** — Adição de dinheiro ao caixa.
**Task** — Tarefa de follow-up no CRM.
**Unidade** — Filial da barbearia.
`},
];

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === '') continue;

    // Headers
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(<h2 key={key++} className="text-xl font-bold mt-6 mb-2">{trimmed.slice(2, -2)}</h2>);
      continue;
    }

    // Blockquote / Tips / Warnings
    if (trimmed.startsWith('> 💡')) {
      elements.push(<div key={key++} className="rounded-lg border border-blue-200 bg-blue-50 p-3 my-2 text-sm text-blue-700"><strong>💡 Dica:</strong> {trimmed.slice(4)}</div>);
      continue;
    }
    if (trimmed.startsWith('> ⚠️')) {
      elements.push(<div key={key++} className="rounded-lg border border-amber-200 bg-amber-50 p-3 my-2 text-sm text-amber-700"><strong>⚠️ Atenção:</strong> {trimmed.slice(4)}</div>);
      continue;
    }
    if (trimmed.startsWith('> ✅')) {
      elements.push(<div key={key++} className="rounded-lg border border-green-200 bg-green-50 p-3 my-2 text-sm text-green-700"><strong>✅ Boa prática:</strong> {trimmed.slice(4)}</div>);
      continue;
    }
    if (trimmed.startsWith('>')) {
      elements.push(<div key={key++} className="border-l-4 border-muted pl-3 my-2 text-sm italic text-muted-foreground">{trimmed.slice(1).trim()}</div>);
      continue;
    }

    // Horizontal rule
    if (trimmed === '---') continue;

    // Lists
    if (trimmed.startsWith('- ')) {
      elements.push(<li key={key++} className="text-sm ml-4 list-disc">{trimmed.slice(2)}</li>);
      continue;
    }

    // Numbered lists (1. 2. 3.)
    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      elements.push(<li key={key++} className="text-sm ml-4 list-decimal">{content}</li>);
      continue;
    }

    // Regular paragraph with inline bold (**text**)
    const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    elements.push(<p key={key++} className="text-sm leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: withBold }} />);
  }

  return elements;
}

export default function KnowledgeCenterPage() {
  const [section, setSection] = useState('primeiros-passos');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const current = SECTIONS.find(s => s.id === section)!;

  const filtered = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(s => s.title.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="flex gap-0 min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 border-r bg-card-bg overflow-y-auto ${menuOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="p-3">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (filtered.length > 0) setSection(filtered[0].id); }}
            placeholder="Pesquisar…" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <nav className="space-y-0.5 px-2 pb-6">
          {filtered.map(s => (
            <button key={s.id} onClick={() => { setSection(s.id); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-all ${
                section === s.id ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}>
              <span className="text-base">{s.icon}</span>
              <span className="flex-1 truncate">{s.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 border-b p-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-md border p-2 text-sm">☰ Menu</button>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (filtered.length > 0) setSection(filtered[0].id); }}
            placeholder="Pesquisar…" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <span className="text-2xl">{current.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{current.title}</h1>
              <p className="text-xs text-muted-foreground">Barbershop ERP {VERSION}</p>
            </div>
          </div>
          <div className="space-y-1">
            {renderMarkdown(current.content)}
          </div>
        </div>
      </main>
    </div>
  );
}
