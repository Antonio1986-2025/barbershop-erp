'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchService } from '@/lib/services';
import { ServiceForm } from '@/components/forms/service-form';
import type { Service } from '@/lib/services';

export default function EditarServicoPage() {
  const params = useParams();
  const id = params.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchService(id)
      .then(setService)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg p-6"><p className="text-red-600">{error}</p></div>;
  if (!service) return null;

  return <ServiceForm initial={service} />;
}
