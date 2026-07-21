'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchProduct } from '@/lib/products';
import { ProductForm } from '@/components/forms/product-form';
import type { Product } from '@/lib/products';

export default function EditarProdutoPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto max-w-lg p-6"><p className="text-zinc-500">Carregando...</p></div>;
  if (error) return <div className="mx-auto max-w-lg p-6"><p className="text-red-600">{error}</p></div>;
  if (!product) return null;

  return <ProductForm initial={product} />;
}
