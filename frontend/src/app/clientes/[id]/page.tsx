'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchCustomer } from '@/lib/customers';
import { CustomerForm } from '@/components/forms/customer-form';
import type { Customer } from '@/lib/customers';

export default function EditarClientePage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomer(id)
      .then(setCustomer)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg p-6"><p className="text-red-600">{error}</p></div>;
  if (!customer) return null;

  return <CustomerForm initial={customer} />;
}
