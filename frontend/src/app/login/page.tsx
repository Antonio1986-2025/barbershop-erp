'use client';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold">Barbershop ERP</h1>
        <p className="mb-8 text-zinc-500">Faça login para continuar</p>
        <LoginForm />
      </div>
    </div>
  );
}
