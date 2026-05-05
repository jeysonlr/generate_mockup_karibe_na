'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { productsApi, type Product } from '@/services/api';
import { themeConfig } from '@/config/theme.config';
import toast from 'react-hot-toast';

const categoryLabels: Record<string, string> = {
  vestuario: '👕 Vestuário',
  utilidades: '☕ Utilidades',
  acessorios: '🎩 Acessórios',
  calcados: '👡 Calçados',
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi
      .getAll()
      .then((res) => setProducts(res.data))
      .catch(() => toast.error('Erro ao carregar produtos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
          {/* TODO: substituir pelo logo real do cliente */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}
          >
            KN
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            {themeConfig.siteName}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-3xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Crie seu produto{' '}
          <span style={{ color: 'var(--color-brand-500)' }}>personalizado</span>
        </h1>
        <p className="text-lg mb-8" style={{ color: 'var(--muted)' }}>
          {themeConfig.siteDescription}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Escolha um produto abaixo para começar ↓
        </p>
      </section>

      {/* Produtos */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl h-56 animate-pulse"
                style={{ background: 'var(--surface)' }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center py-12" style={{ color: 'var(--muted)' }}>
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/editor/${product.id}`}
                className="group rounded-xl overflow-hidden transition-transform hover:scale-105"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Imagem placeholder ou real */}
                <div
                  className="w-full h-40 flex items-center justify-center relative"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  {product.baseImageUrl ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${product.baseImageUrl}`}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    // Placeholder visual quando não há imagem real
                    <span className="text-5xl select-none">
                      {product.category === 'vestuario' && '👕'}
                      {product.category === 'utilidades' && '☕'}
                      {product.category === 'acessorios' && '🎩'}
                      {product.category === 'calcados' && '👡'}
                      {!['vestuario','utilidades','acessorios','calcados'].includes(product.category) && '📦'}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                    {product.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {categoryLabels[product.category] || product.category}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {product.variants.length} variante{product.variants.length !== 1 ? 's' : ''}
                  </p>
                  <div
                    className="mt-3 text-center text-xs py-1.5 rounded-lg font-medium transition-colors"
                    style={{
                      background: 'var(--color-brand-500)',
                      color: '#0f0f0f',
                    }}
                  >
                    Personalizar →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
