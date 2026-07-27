import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/clientes',
  '/profissionais',
  '/agenda',
  '/agendamentos',
  '/service-orders',
  '/vendas',
  '/pdv',
  '/caixa',
  '/financeiro',
  '/estoque',
  '/compras',
  '/fornecedores',
  '/categorias',
  '/produtos',
  '/servicos',
  '/unidades',
  '/usuarios',
  '/empresas',
  '/notificacoes',
  '/auditoria',
  '/configuracoes',
  '/commission',
  '/status',
  '/admin',
  '/barber',
  '/ajuda',
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
    '/service-orders/:path*',
    '/vendas/:path*',
    '/pdv/:path*',
    '/caixa/:path*',
    '/financeiro/:path*',
    '/estoque/:path*',
    '/compras/:path*',
    '/fornecedores/:path*',
    '/categorias/:path*',
    '/produtos/:path*',
    '/servicos/:path*',
    '/unidades/:path*',
    '/usuarios/:path*',
    '/empresas/:path*',
    '/notificacoes/:path*',
    '/auditoria/:path*',
    '/configuracoes/:path*',
    '/commission/:path*',
    '/status/:path*',
    '/admin/:path*',
    '/barber/:path*',
    '/ajuda/:path*',
  ],
};
