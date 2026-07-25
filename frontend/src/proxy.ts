import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/clientes',
  '/profissionais',
  '/agenda',
  '/agendamentos',
  '/financeiro',
  '/estoque',
  '/pdv',
  '/caixa',
  '/notificacoes',
  '/categorias',
  '/produtos',
  '/servicos',
  '/compras',
  '/fornecedores',
  '/unidades',
  '/usuarios',
  '/empresas',
  '/auditoria',
  '/configuracoes',
  '/status',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('barbershop_token')?.value;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clientes/:path*',
    '/profissionais/:path*',
    '/agenda/:path*',
    '/agendamentos/:path*',
    '/financeiro/:path*',
    '/estoque/:path*',
    '/pdv/:path*',
    '/caixa/:path*',
    '/notificacoes/:path*',
    '/categorias/:path*',
    '/produtos/:path*',
    '/servicos/:path*',
    '/compras/:path*',
    '/fornecedores/:path*',
    '/unidades/:path*',
    '/usuarios/:path*',
    '/empresas/:path*',
    '/auditoria/:path*',
    '/configuracoes/:path*',
    '/status/:path*',
  ],
};
