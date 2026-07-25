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

  if (loading) return <div className="mx-auto max-w-lg px-4 py-6 sm:px-6"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg px-4 py-6 sm:px-6"><p className="text-danger">{error}</p></div>;
  if (!service) return null;

  return <ServiceForm initial={service} />;
}
