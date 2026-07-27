'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const VERSION = 'v1.0.5';

const MODULES = [
  { name: 'Empresa', path: '/empresas', icon: '🏢' },
  { name: 'Unidades', path: '/unidades', icon: '📍' },
  { name: 'Usuários', path: '/usuarios', icon: '👤' },
  { name: 'Auditoria', path: '/auditoria', icon: '📋' },
  { name: 'Agenda', path: '/agenda', icon: '📅' },
  { name: 'Clientes', path: '/clientes', icon: '👥' },
  { name: 'Profissionais', path: '/profissionais', icon: '✂️' },
  { name: 'Serviços', path: '/servicos', icon: '🔧' },
  { name: 'Produtos', path: '/produtos', icon: '📦' },
  { name: 'Caixa', path: '/caixa', icon: '💰' },
  { name: 'Financeiro', path: '/financeiro/contas', icon: '📊' },
  { name: 'Comissões', path: '/commission', icon: '📈' },
  { name: 'Estoque', path: '/estoque', icon: '📋' },
  { name: 'Compras', path: '/compras', icon: '🛒' },
  { name: 'CRM', path: '/clientes', icon: '🤝' },
  { name: 'Configurações', path: '/configuracoes', icon: '⚙️' },
  { name: 'Central de Ajuda', path: '/ajuda', icon: '❓' },
];

export default function SetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🎉 Bem-vindo ao Barbershop ERP</h1>
        <p className="text-muted-foreground">Sistema de gestão para barbearias — v{VERSION}</p>
      </div>

      <div className="rounded-lg border bg-card-bg p-6 space-y-4">
        <h2 className="text-lg font-semibold">✅ O que já está configurado</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">✔ Empresa Demo</p>
            <p className="text-xs text-green-600">Barbershop ERP Demo</p>
          </div>
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">✔ Unidades</p>
            <p className="text-xs text-green-600">Matriz + Filial Centro</p>
          </div>
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">✔ Usuários</p>
            <p className="text-xs text-green-600">Admin, Barbeiro, Operador, Visualizador</p>
          </div>
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">✔ Expediente</p>
            <p className="text-xs text-green-600">Seg-Sex 08-18h, Sáb 08-13h</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">📋 Módulos do Sistema</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {MODULES.map(m => (
            <Link key={m.path} href={m.path}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <span className="text-xl">{m.icon}</span>
              <span className="text-sm font-medium">{m.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">📚 Documentação</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href="/ajuda" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
            <span className="text-xl">❓</span>
            <div><p className="text-sm font-medium">Central de Ajuda</p><p className="text-xs text-muted-foreground">Guias, FAQ e documentação</p></div>
          </a>
          <a href="https://github.com/Antonio1986-2025/barbershop-erp/blob/main/INSTALL.md" target="_blank" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
            <span className="text-xl">📖</span>
            <div><p className="text-sm font-medium">Guia de Instalação</p><p className="text-xs text-muted-foreground">Linux, Docker, VPS</p></div>
          </a>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-lg font-semibold">🔧 Informações do Sistema</h2>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Versão</span><span className="font-medium">{VERSION}</span></div>
          <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Ambiente</span><span className="font-medium">Produção</span></div>
          <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Banco</span><span className="font-medium">PostgreSQL</span></div>
          <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Node.js</span><span className="font-medium">18+</span></div>
          <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">Usuário</span><span className="font-medium">{user.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="font-medium">{user.companyName}</span></div>
        </div>
      </div>
    </div>
  );
}
