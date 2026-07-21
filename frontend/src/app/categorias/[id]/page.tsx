'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchCategory } from '@/lib/categories';
import { CategoryForm } from '@/components/forms/category-form';
import type { Category } from '@/lib/categories';

export default function EditarCategoriaPage() {
  const params = useParams();
  const id = params.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategory(id)
      .then(setCategory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg p-6"><p className="text-red-600">{error}</p></div>;
  if (!category) return null;

  return <CategoryForm initial={category} />;
}
