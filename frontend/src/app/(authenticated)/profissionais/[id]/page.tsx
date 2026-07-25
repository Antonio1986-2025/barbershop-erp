'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchProfessional } from '@/lib/professionals';
import { ProfessionalForm } from '@/components/forms/professional-form';
import type { Professional } from '@/lib/professionals';

export default function EditarProfissionalPage() {
  const params = useParams();
  const id = params.id as string;
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfessional(id)
      .then(setProfessional)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg px-4 py-6 sm:px-6"><p className="text-muted-foreground animate-pulse">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg px-4 py-6 sm:px-6"><p className="text-danger">{error}</p></div>;
  if (!professional) return null;

  return <ProfessionalForm initial={professional} />;
}
