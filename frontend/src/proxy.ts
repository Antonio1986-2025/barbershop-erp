import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('barbershop_token')?.value;

  // Redirect /login to /dashboard if already authenticated
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
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