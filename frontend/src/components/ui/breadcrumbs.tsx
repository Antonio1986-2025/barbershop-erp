'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABEL_MAP: Record<string, string> = {
  '': 'Início',
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  'clientes/novo': 'Novo Cliente',
  agendamentos: 'Agendamentos',
  'agendamentos/novo': 'Novo Agendamento',
  agenda: 'Agenda',
  pdv: 'PDV',
  'pdv/novo': 'Nova Venda',
  vendas: 'Vendas',
  caixa: 'Caixa',
  financeiro: 'Financeiro',
  'financeiro/contas': 'Contas',
  'financeiro/categorias': 'Categorias',
  'financeiro/fechamento': 'Fechamento',
  'financeiro/fluxo-caixa': 'Fluxo de Caixa',
  estoque: 'Estoque',
  'estoque/movimentacoes': 'Movimentações',
  'estoque/inventario': 'Inventário',
  'estoque/relatorios': 'Relatórios',
  'estoque/alertas': 'Alertas',
  produtos: 'Produtos',
  'produtos/novo': 'Novo Produto',
  servicos: 'Serviços',
  'servicos/novo': 'Novo Serviço',
  profissionais: 'Profissionais',
  'profissionais/novo': 'Novo Profissional',
  categorias: 'Categorias',
  'categorias/novo': 'Nova Categoria',
  compras: 'Compras',
  'compras/novo': 'Nova Compra',
  fornecedores: 'Fornecedores',
  'fornecedores/novo': 'Novo Fornecedor',
  unidades: 'Unidades',
  'unidades/novo': 'Nova Unidade',
  usuarios: 'Usuários',
  'usuarios/novo': 'Novo Usuário',
  empresas: 'Empresas',
  'empresas/novo': 'Nova Empresa',
  configuracoes: 'Configurações',
  notificacoes: 'Notificações',
  auditoria: 'Auditoria',
  status: 'Status',
  crm: 'CRM',
  perfil: 'Perfil',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Only show on authenticated pages
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  
  // Skip the first segment if it's (authenticated)
  const filtered = segments.filter(s => !s.startsWith('(') && !s.endsWith(')'));

  if (filtered.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </li>
        {filtered.map((seg, idx) => {
          // Build path up to this segment
          const href = '/' + filtered.slice(0, idx + 1).join('/');
          const label = LABEL_MAP[filtered.slice(0, idx + 1).join('/')]
            || LABEL_MAP[seg]
            || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
          const isLast = idx === filtered.length - 1;

          return (
            <li key={seg} className="flex items-center gap-1.5">
              <span className="text-muted-foreground/40">/</span>
              {isLast ? (
                <span className="text-foreground font-medium">{label}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
