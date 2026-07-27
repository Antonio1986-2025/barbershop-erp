'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import Link from 'next/link';

const VERSION = 'v1.0.3';

const SECTIONS = [
  { id: 'guia-rapido', title: 'Guia Rápido', icon: '⚡',
    items: [
      { label: 'Como fazer login', desc: 'Acesse o sistema com seu email e senha. Perfis disponíveis: Admin, Barbeiro, Operador e Visualizador.' },
      { label: 'Primeiros passos', desc: 'Configure sua empresa, cadastre profissionais, serviços e horários de funcionamento antes de iniciar os agendamentos.' },
      { label: 'Fluxo do atendimento', desc: 'Agende → Confirme → Inicie o atendimento → Conclua → Gere comanda → Cobre → Venda paga.' },
    ]},
  { id: 'perfis', title: 'Perfis de Acesso', icon: '👤',
    items: [
      { label: 'Admin', desc: 'Acesso total. Pode gerenciar empresas, usuários, comissões, financeiro e configurações.' },
      { label: 'Barbeiro', desc: 'Acesso ao próprio dashboard, agenda, comandas, vendas, comissões e perfil.' },
      { label: 'Operador', desc: 'Acesso operacional: PDV, clientes, agendamentos e caixa.' },
      { label: 'Visualizador', desc: 'Acesso apenas de leitura para consulta de relatórios e dados.' },
    ]},
  { id: 'modulos', title: 'Módulos do Sistema', icon: '📦',
    items: [
      { label: 'Dashboard', desc: 'Visão geral do dia com cards de atendimentos, faturamento e comissões.' },
      { label: 'PDV / Vendas', desc: 'Registre vendas com itens de serviço e produto, aplique descontos e finalize o pagamento.' },
      { label: 'Agenda', desc: 'Visualização semanal com slots automáticos baseados no expediente do profissional.' },
      { label: 'Caixa', desc: 'Controle de abertura/fechamento, suprimentos, sangrias e saldo atual.' },
      { label: 'Comissões', desc: 'Cálculo automático ao pagar a venda. Aprovação gerencial e fechamento mensal.' },
      { label: 'CRM', desc: 'Histórico de interações e tasks para acompanhamento de clientes.' },
    ]},
  { id: 'faq', title: 'Perguntas Frequentes', icon: '❓',
    items: [
      { label: 'Esqueci minha senha', desc: 'Entre em contato com o administrador do sistema para redefinir sua senha.' },
      { label: 'Comissão não apareceu', desc: 'A comissão é gerada automaticamente quando a venda é paga integralmente. Verifique se o status da venda é PAID.' },
      { label: 'Caixa não abre', desc: 'Verifique se já existe um caixa aberto para a unidade selecionada. Feche o caixa anterior antes de abrir um novo.' },
      { label: 'Agenda sem horários', desc: 'Verifique se o profissional possui expediente configurado e se a data selecionada está dentro do período de funcionamento.' },
    ]},
  { id: 'versoes', title: `Sobre — v${VERSION}`, icon: 'ℹ️',
    items: [
      { label: 'Versão Atual', desc: `${VERSION} — Módulo BARBER implementado com comissões automáticas, aprovação gerencial e fechamento de período.` },
      { label: 'Tecnologias', desc: 'Next.js (App Router) + NestJS + Prisma ORM + PostgreSQL + Tailwind CSS + TypeScript.' },
    ]},
];

export default function HelpPage() {
  const { user } = useAuth();
  const [active, setActive] = useState(SECTIONS[0].id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Central de Ajuda</h1>
        <p className="text-sm text-muted-foreground mt-1">Guia rápido e documentação do sistema Barbershop ERP</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              active === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}>
            <span>{s.icon}</span> {s.title}
          </button>
        ))}
      </div>

      {SECTIONS.filter(s => s.id === active).map((section) => (
        <div key={section.id} className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><span>{section.icon}</span> {section.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-lg border bg-card-bg p-4">
                <h3 className="font-semibold text-sm">{item.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
