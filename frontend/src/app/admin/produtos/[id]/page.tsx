'use client';
import { useEffect, useState } from 'react';
import { adminProductsApi, Product } from '@/services/api';
import ProductForm from '@/components/admin/ProductForm';

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminProductsApi.getById(params.id)
      .then((res) => setProduct((res.data as any).data ?? res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Carregando produto...</div>;
  if (!product) return <div className="text-center py-20 text-gray-400">Produto não encontrado.</div>;

  return <ProductForm mode="edit" product={product} />;
}
