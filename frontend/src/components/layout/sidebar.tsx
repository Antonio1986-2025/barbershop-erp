'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { fetchUnreadCount } from '@/lib/notifications';

interface NavLink {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  barberOnly?: boolean;
}

interface NavGroup {
  title: string;
  icon: string;
  links: NavLink[];
}

const VERSION = 'v1.0.6';

// ── ADMIN GROUPS ──
const adminGroups: NavGroup[] = [
  {
    title: 'Operação', icon: 'zap',
    links: [
      { href: '/agenda', label: 'Agenda', icon: 'calendar-days' },
      { href: '/agendamentos', label: 'Agendamentos', icon: 'calendar' },
      { href: '/service-orders', label: 'Comandas', icon: 'clipboard-list' },
      { href: '/vendas', label: 'Vendas', icon: 'shopping-cart' },
      { href: '/pdv', label: 'PDV', icon: 'credit-card' },
    ],
  },
  {
    title: 'Cadastros', icon: 'users',
    links: [
      { href: '/clientes', label: 'Clientes', icon: 'users' },
      { href: '/profissionais', label: 'Profissionais', icon: 'scissors' },
      { href: '/servicos', label: 'Serviços', icon: 'wrench' },
      { href: '/categorias', label: 'Categorias', icon: 'folder' },
      { href: '/produtos', label: 'Produtos', icon: 'package' },
    ],
  },
  {
    title: 'Financeiro', icon: 'dollar-sign',
    links: [
      { href: '/caixa', label: 'Caixa', icon: 'wallet' },
      { href: '/financeiro/contas', label: 'Contas', icon: 'book' },
      { href: '/financeiro/fechamento', label: 'Fechamento', icon: 'file' },
      { href: '/financeiro/fluxo-caixa', label: 'Fluxo de Caixa', icon: 'trending-up' },
      { href: '/financeiro/categorias', label: 'Categorias', icon: 'folder' },
      { href: '/commission', label: 'Comissões', icon: 'percent' },
    ],
  },
  {
    title: 'Estoque', icon: 'package',
    links: [
      { href: '/estoque', label: 'Visão Geral', icon: 'bar-chart' },
      { href: '/produtos', label: 'Produtos', icon: 'package' },
      { href: '/compras', label: 'Compras', icon: 'download' },
      { href: '/fornecedores', label: 'Fornecedores', icon: 'building' },
      { href: '/estoque/movimentacoes', label: 'Movimentações', icon: 'refresh' },
      { href: '/estoque/inventario', label: 'Inventário', icon: 'clipboard' },
      { href: '/estoque/relatorios', label: 'Relatórios', icon: 'file' },
      { href: '/estoque/alertas', label: 'Alertas', icon: 'bell' },
    ],
  },
  {
    title: 'Administração', icon: 'shield',
    links: [
      { href: '/empresas', label: 'Empresa', icon: 'briefcase' },
      { href: '/unidades', label: 'Unidades', icon: 'map-pin' },
      { href: '/usuarios', label: 'Usuários', icon: 'shield' },
      { href: '/auditoria', label: 'Auditoria', icon: 'clipboard-list' },
      { href: '/configuracoes', label: 'Configurações', icon: 'settings' },
      { href: '/status', label: 'Status', icon: 'activity' },
      { href: '/admin/system', label: 'Saúde do Sistema', icon: 'activity' },
    ],
  },
];

// ── BARBER GROUP ──
const barberGroup: NavGroup = {
  title: 'Barbeiro', icon: 'scissors',
  links: [
    { href: '/barber/dashboard', label: 'Dashboard', icon: 'grid', barberOnly: true },
    { href: '/barber/agenda', label: 'Minha Agenda', icon: 'calendar-days', barberOnly: true },
    { href: '/barber/service-orders', label: 'Minhas Comandas', icon: 'clipboard-list', barberOnly: true },
    { href: '/barber/sales', label: 'Minhas Vendas', icon: 'shopping-cart', barberOnly: true },
    { href: '/barber/commissions', label: 'Minhas Comissões', icon: 'percent', barberOnly: true },
    { href: '/barber/profile', label: 'Meu Perfil', icon: 'users', barberOnly: true },
  ],
};

// ── SUPPORT GROUP ──
const supportLinks: NavLink[] = [
  { href: '/notificacoes', label: 'Notificações', icon: 'bell' },
  { href: '/ajuda', label: 'Central de Ajuda', icon: 'help-circle' },
];

// ── ICONS ──
const iconMap: Record<string, string> = {
  'grid': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'shopping-cart': 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  'credit-card': 'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h20',
  'clipboard-list': 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4',
  'calendar-days': 'M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01M21 4H3v16h18z',
  'calendar': 'M8 2v4M16 2v4M3 10h18M21 4H3v16h18z',
  'wallet': 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z',
  'users': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'scissors': 'M6 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 24a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12',
  'wrench': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  'folder': 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  'package': 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  'dollar-sign': 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  'percent': 'M19 5L5 19M7 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  'download': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  'building': 'M4 2h16v20H4zM9 22v-4h6v4M8 6h2M16 6h2M8 10h2M16 10h2M8 14h2M16 14h2',
  'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'briefcase': 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 7h20v14H2z',
  'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  'activity': 'M22 12h-4l-3 9L9 3l-3 9H2',
  'bell': 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  'help-circle': 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  'zap': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M20 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22H20V2z',
  'trending-up': 'M23 6l-9.5 9.5-5-5L1 18',
  'file': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  'refresh': 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  'clipboard': 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};

function SvgIcon({ name, className }: { name: string; className?: string }) {
  const d = iconMap[name];
  if (!d) return <span className={'flex items-center justify-center text-xs ' + (className ?? 'w-5 h-5')}>•</span>;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount().then(setUnread).catch(() => {});
    const interval = setInterval(() => { fetchUnreadCount().then(setUnread).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isBarber = user?.roles?.includes('barber');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  function toggle(group: string) {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));
  }

  function isActive(href: string) {
    return pathname === href || (pathname.startsWith(href) && href !== '/dashboard');
  }

  function barberLinks() {
    return barberGroup.links.map(link => (
      <Link key={link.href} href={link.href}
        onClick={() => { if (isMobile) onClose(); }}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] transition-all ${
          isActive(link.href)
            ? 'bg-sidebar-active font-medium text-white shadow-sm'
            : 'text-white/60 hover:bg-white/5 hover:text-white'
        }`}>
        <SvgIcon name={link.icon} className="w-5 h-5 shrink-0" />
        <span className="flex-1 truncate">{link.label}</span>
      </Link>
    ));
  }

  function buildGroup(group: NavGroup) {
    const isOpen = collapsed[group.title] !== true;
    return (
      <div key={group.title}>
        <button onClick={() => toggle(group.title)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors min-h-[44px]">
          <SvgIcon name={group.icon} className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{group.title}</span>
          <svg className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen && (
          <div className="space-y-0.5 pl-2">
            {group.links.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => { if (isMobile) onClose(); }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] transition-all ${
                  isActive(link.href)
                    ? 'bg-sidebar-active font-medium text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}>
                <SvgIcon name={link.icon} className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate">{link.label}</span>
                {link.href === '/notificacoes' && unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar-bg text-sidebar-foreground">
      {/* TOPO: Logo + User Info */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg shrink-0">💈</span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight truncate">Barbershop</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">ERP {VERSION}</span>
          </div>
        </div>
        {user && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-white truncate">{user.name}</span>
              <span className="text-[10px] text-white/40 truncate">
                {user.roles?.includes('barber') ? 'Barbeiro' : 'Administrador'}
                {' · '}{user.companyName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {isBarber ? (
          <>
            {/* Barber: Dashboard destacado */}
            <Link href="/barber/dashboard"
              onClick={() => { if (isMobile) onClose(); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] font-semibold transition-all ${
                pathname === '/barber/dashboard'
                  ? 'bg-sidebar-active text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}>
              <SvgIcon name="grid" className="w-5 h-5 shrink-0" />
              <span>Dashboard</span>
            </Link>
            <div className="border-t border-white/5 my-2" />
            {barberLinks()}
            <div className="border-t border-white/5 my-2" />
            {/* Barber Support */}
            <Link href="/ajuda"
              onClick={() => { if (isMobile) onClose(); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] text-white/60 hover:bg-white/5 hover:text-white transition-all">
              <SvgIcon name="help-circle" className="w-5 h-5 shrink-0" />
              <span>Ajuda</span>
            </Link>
          </>
        ) : (
          <>
            {/* ADMIN: Dashboard fixo no topo */}
            <Link href="/dashboard"
              onClick={() => { if (isMobile) onClose(); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-sidebar-active text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}>
              <SvgIcon name="grid" className="w-5 h-5 shrink-0" />
              <span>Dashboard</span>
            </Link>
            <div className="border-t border-white/5 my-2" />
            {adminGroups.map(g => buildGroup(g))}
          </>
        )}

        {/* Suporte (admin) */}
        {!isBarber && (
          <>
            <div className="border-t border-white/5 my-2" />
            <div className="space-y-0.5">
              {supportLinks.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={() => { if (isMobile) onClose(); }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm min-h-[44px] transition-all ${
                    isActive(link.href)
                      ? 'bg-sidebar-active font-medium text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}>
                  <SvgIcon name={link.icon} className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.href === '/notificacoes' && unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* RODAPÉ: Sair */}
      <div className="border-t border-white/10 p-3">
        <button onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white transition-all min-h-[44px]">
          <SvgIcon name="log-out" className="w-5 h-5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
