'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toast';

type Step = 'welcome' | 'company' | 'hours' | 'admin' | 'done';

export default function SetupWizardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: 'Minha Barbearia',
    tradingName: '',
    cnpj: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: 'SP',
    openHour: '08:00',
    closeHour: '18:00',
    satClose: '13:00',
    intervalStart: '12:00',
    intervalEnd: '13:00',
    adminName: 'Administrador',
    adminEmail: '',
    adminPassword: '',
    defaultDuration: '30',
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleFinish() {
    setLoading(true);
    addToast('SUCCESS', 'Configuração inicial concluída! Bem-vindo ao Barbershop ERP.');
    setStep('done');
    setLoading(false);
  }

  // If already has company, redirect to dashboard
  if (user?.companyName && user.companyName !== 'Minha Barbearia' && step !== 'done') {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12 text-center">
        <span className="text-5xl">✅</span>
        <h1 className="text-2xl font-bold">Sistema já configurado</h1>
        <p className="text-muted-foreground">Empresa: <strong>{user.companyName}</strong></p>
        <button onClick={() => router.push('/dashboard')}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white">
          Ir para o Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs">
        {['welcome', 'company', 'hours', 'admin', 'done'].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${i > 0 ? 'ml-2' : ''}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step === s ? 'bg-primary text-white' : 
              ['done'].includes(step) || (['done'].includes(step)) ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            }`}>{i + 1}</span>
            <span className={`hidden sm:inline ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 'welcome' ? 'Boas-vindas' : s === 'company' ? 'Empresa' : s === 'hours' ? 'Horários' : s === 'admin' ? 'Admin' : 'Concluir'}
            </span>
            {i < 4 && <span className="text-muted-foreground/30">→</span>}
          </div>
        ))}
      </div>

      {step === 'welcome' && (
        <div className="space-y-6 text-center">
          <span className="text-6xl">💈</span>
          <h1 className="text-3xl font-bold">Barbershop ERP</h1>
          <p className="text-lg text-muted-foreground">Sistema de gestão completo para sua barbearia</p>
          <div className="grid gap-3 sm:grid-cols-3 text-left">
            <div className="rounded-lg border p-4"><p className="font-semibold">📅 Agenda</p><p className="text-sm text-muted-foreground">Agendamentos e horários</p></div>
            <div className="rounded-lg border p-4"><p className="font-semibold">💰 Financeiro</p><p className="text-sm text-muted-foreground">Caixa, vendas, comissões</p></div>
            <div className="rounded-lg border p-4"><p className="font-semibold">📊 Gestão</p><p className="text-sm text-muted-foreground">Estoque, CRM, relatórios</p></div>
          </div>
          <button onClick={() => setStep('company')}
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-light">
            Iniciar Configuração
          </button>
        </div>
      )}

      {step === 'company' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">📋 Dados da Empresa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome da Empresa *" value={form.companyName} onChange={v => update('companyName', v)} />
            <Input label="Nome Fantasia" value={form.tradingName} onChange={v => update('tradingName', v)} />
            <Input label="CNPJ" value={form.cnpj} onChange={v => update('cnpj', v)} placeholder="00.000.000/0001-00" />
            <Input label="Telefone" value={form.phone} onChange={v => update('phone', v)} placeholder="(11) 3000-0000" />
            <Input label="WhatsApp" value={form.whatsapp} onChange={v => update('whatsapp', v)} placeholder="(11) 99999-0000" />
            <Input label="Endereço" value={form.address} onChange={v => update('address', v)} placeholder="Rua, número" />
            <Input label="Cidade" value={form.city} onChange={v => update('city', v)} />
            <Input label="Estado" value={form.state} onChange={v => update('state', v)} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep('welcome')} className="rounded-md border px-4 py-2 text-sm">Voltar</button>
            <button onClick={() => setStep('hours')} className="rounded-md bg-primary px-4 py-2 text-sm text-white">Continuar</button>
          </div>
        </div>
      )}

      {step === 'hours' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">🕐 Horário de Funcionamento</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Abertura (Seg-Sex)" value={form.openHour} onChange={v => update('openHour', v)} type="time" />
            <Input label="Fechamento (Seg-Sex)" value={form.closeHour} onChange={v => update('closeHour', v)} type="time" />
            <Input label="Fechamento Sábado" value={form.satClose} onChange={v => update('satClose', v)} type="time" />
            <Input label="Início Intervalo" value={form.intervalStart} onChange={v => update('intervalStart', v)} type="time" />
            <Input label="Fim Intervalo" value={form.intervalEnd} onChange={v => update('intervalEnd', v)} type="time" />
            <Input label="Duração padrão (min)" value={form.defaultDuration} onChange={v => update('defaultDuration', v)} type="number" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep('company')} className="rounded-md border px-4 py-2 text-sm">Voltar</button>
            <button onClick={() => setStep('admin')} className="rounded-md bg-primary px-4 py-2 text-sm text-white">Continuar</button>
          </div>
        </div>
      )}

      {step === 'admin' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">👤 Administrador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome do Admin *" value={form.adminName} onChange={v => update('adminName', v)} />
            <Input label="Email *" value={form.adminEmail} onChange={v => update('adminEmail', v)} type="email" placeholder="admin@barbearia.com" />
            <Input label="Senha *" value={form.adminPassword} onChange={v => update('adminPassword', v)} type="password" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep('hours')} className="rounded-md border px-4 py-2 text-sm">Voltar</button>
            <button onClick={handleFinish} disabled={loading}
              className="rounded-md bg-primary px-6 py-2 text-sm text-white disabled:opacity-50">
              {loading ? 'Configurando...' : 'Finalizar'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-6 text-center">
          <span className="text-6xl">🎉</span>
          <h1 className="text-2xl font-bold">Tudo pronto!</h1>
          <p className="text-muted-foreground">Sua barbearia está configurada e pronta para usar.</p>
          <button onClick={() => router.push('/dashboard')}
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white">
            Ir para o Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}
