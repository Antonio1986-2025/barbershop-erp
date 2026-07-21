'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/clientes', label: 'Clientes', icon: '👤' },
  { href: '/profissionais', label: 'Profissionais', icon: '✂' },
  { href: '/servicos', label: 'Serviços', icon: '⚙' },
  { href: '/categorias', label: 'Categorias', icon: '📁' },
  { href: '/produtos', label: 'Produtos', icon: '📦' },
  { href: '/unidades', label: 'Unidades', icon: '🏢' },
  { href: '/usuarios', label: 'Usuários', icon: '🔐' },
  { href: '/empresas', label: 'Empresas', icon: '🏛' },
  { href: '/auditoria', label: 'Auditoria', icon: '📋' },
  { href: '/configuracoes', label: 'Configurações', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-zinc-50">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <span className="text-lg">💈</span>
        <span className="text-sm font-semibold">Barbershop ERP</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-zinc-200 font-medium text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="w-5 text-center">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t p-4">
          <p className="truncate text-xs text-zinc-500">{user.name}</p>
          <p className="truncate text-xs text-zinc-400">{user.companyName}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded bg-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-300"
          >
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
