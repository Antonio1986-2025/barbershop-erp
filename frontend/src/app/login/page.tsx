'use client';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg">
            <span className="text-2xl">💈</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Barbershop ERP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça login para continuar
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-border bg-card-bg p-6 sm:p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
