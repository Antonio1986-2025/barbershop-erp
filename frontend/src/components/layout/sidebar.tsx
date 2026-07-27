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
  links: NavLink[];
  mobileCollapsed?: boolean;
}

const linkGroups: NavGroup[] = [
  {
    title: 'Operação',
    mobileCollapsed: true,
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
      { href: '/pdv', label: 'PDV', icon: 'shopping-cart' },
      { href: '/service-orders', label: 'Comandas', icon: 'clipboard-list' },
      { href: '/agenda', label: 'Agenda', icon: 'calendar-days' },
      { href: '/agendamentos', label: 'Agendamentos', icon: 'calendar' },
      { href: '/caixa', label: 'Caixa', icon: 'wallet', adminOnly: true },
    ],
  },
  {
    title: 'Atendimento',
    mobileCollapsed: true,
    links: [
      { href: '/clientes', label: 'Clientes', icon: 'users' },
      { href: '/profissionais', label: 'Profissionais', icon: 'scissors' },
      { href: '/servicos', label: 'Serviços', icon: 'wrench' },
      { href: '/categorias', label: 'Categorias', icon: 'folder' },
      { href: '/produtos', label: 'Produtos', icon: 'package' },
    ],
  },
  {
    title: 'Financeiro',
    mobileCollapsed: true,
    links: [
      { href: '/financeiro/contas', label: 'Financeiro', icon: 'dollar-sign', adminOnly: true },
      { href: '/commission', label: 'Comissões', icon: 'dollar-sign', adminOnly: true },
      { href: '/compras', label: 'Compras', icon: 'download', adminOnly: true },
      { href: '/fornecedores', label: 'Fornecedores', icon: 'building', adminOnly: true },
    ],
  },
  {
    title: 'Administração',
    mobileCollapsed: true,
    links: [
      { href: '/estoque', label: 'Estoque', icon: 'bar-chart', adminOnly: true },
      { href: '/usuarios', label: 'Usuários', icon: 'shield', adminOnly: true },
      { href: '/unidades', label: 'Unidades', icon: 'map-pin', adminOnly: true },
      { href: '/empresas', label: 'Empresas', icon: 'briefcase', adminOnly: true },
      { href: '/auditoria', label: 'Auditoria', icon: 'clipboard-list', adminOnly: true },
      { href: '/configuracoes', label: 'Configurações', icon: 'settings', adminOnly: true },
      { href: '/status', label: 'Status do Sistema', icon: 'activity', adminOnly: true },
    ],
  },
  {
    title: 'Barbeiro',
    mobileCollapsed: true,
    links: [
      { href: '/barber/dashboard', label: 'Dashboard', icon: 'grid', barberOnly: true },
      { href: '/barber/agenda', label: 'Minha Agenda', icon: 'calendar-days', barberOnly: true },
      { href: '/barber/service-orders', label: 'Minhas Comandas', icon: 'clipboard-list', barberOnly: true },
      { href: '/barber/sales', label: 'Minhas Vendas', icon: 'shopping-cart', barberOnly: true },
      { href: '/barber/commissions', label: 'Minhas Comissões', icon: 'dollar-sign', barberOnly: true },
      { href: '/barber/profile', label: 'Meu Perfil', icon: 'users', barberOnly: true },
    ],
  },
  {
    title: 'Suporte',
    mobileCollapsed: false,
    links: [
      { href: '/notificacoes', label: 'Notificações', icon: 'bell' },
      { href: '/ajuda', label: 'Central de Ajuda', icon: 'help-circle' },
    ],
  },
];

const iconMap: Record<string, string> = {
  'grid': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'shopping-cart': 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
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
  'download': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  'building': 'M4 2h16v20H4zM9 22v-4h6v4M8 6h2M16 6h2M8 10h2M16 10h2M8 14h2M16 14h2',
  'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'briefcase': 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 7h20v14H2z',
  'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  'activity': 'M22 12h-4l-3 9L9 3l-3 9H2',
  'bell': 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  'help-circle': 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount().then(setUnread).catch(() => {});
    const interval = setInterval(() => { fetchUnreadCount().then(setUnread).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  function toggleGroup(title: string) {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  function filterLinks(links: NavLink[]) {
    const isBarber = user?.roles?.includes('barber');
    return links.filter(l => {
      if (isBarber && l.adminOnly) return false;
      if (l.barberOnly && !isBarber) return false;
      return true;
    });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar-bg text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm">💈</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Barbershop</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">ERP</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {linkGroups.map((group) => {
          const filtered = filterLinks(group.links);
          if (filtered.length === 0) return null;
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
          const defaultCollapsed = group.mobileCollapsed && isMobile;
          const isCollapsed = collapsedGroups[group.title] ?? defaultCollapsed;

          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
              >
                {group.title}
                <svg className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {filtered.map((link) => {
                    const active = isActive(link.href);
                    const isNotif = link.href === '/notificacoes';
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose(); }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                          active
                            ? 'bg-sidebar-active font-medium text-white shadow-sm'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <SvgIcon name={link.icon} className="h-4.5 w-4.5 shrink-0" />
                        <span className="flex-1 truncate">{link.label}</span>
                        {isNotif && unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="truncate text-xs font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-white/40">{user.companyName}</p>
            <button onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
