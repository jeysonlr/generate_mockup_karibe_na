'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, Product, resolveProductImage } from '@/services/api';
import { themeConfig } from '@/config/theme.config';
import { Sparkles, MessageCircle, ArrowRight, Package } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5500000000000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function whatsappLink(product: Product) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no produto: *${product.name}*${product.price ? ` — R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}` : ''}. Pode me ajudar?`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function ProductCard({ product }: { product: Product }) {
  const imgSrc = resolveProductImage(product, 'front');

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-transform hover:scale-105"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="relative aspect-square flex items-center justify-center"
        style={{ background: 'var(--surface-hover)' }}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="w-full h-full object-contain p-4" />
        ) : (
          <div className="flex flex-col items-center" style={{ color: 'var(--muted)' }}>
            <Package size={56} />
            <span className="text-xs mt-2">Sem imagem</span>
          </div>
        )}
        {product.isMockupEnabled && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}
          >
            <Sparkles size={11} /> Personalizável
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{product.name}</h3>
        {product.description && (
          <p className="text-xs mt-1 flex-1" style={{ color: 'var(--muted)' }}>{product.description}</p>
        )}
        {product.price && (
          <p className="text-lg font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
          </p>
        )}

        <div className="mt-3">
          {product.isMockupEnabled ? (
            <Link
              href={`/editor/${product.id}`}
              className="flex items-center justify-center gap-2 w-full font-semibold py-2.5 rounded-lg transition-colors text-sm"
              style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}
            >
              Personalizar Agora <ArrowRight size={14} />
            </Link>
          ) : (
            <a
              href={whatsappLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              <MessageCircle size={14} /> Pedir pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VitrinePublicaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then((res) => {
        const list: Product[] = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setProducts(list.filter((p) => p.isActive));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mockupProducts = products.filter((p) => p.isMockupEnabled);
  const otherProducts = products.filter((p) => !p.isMockupEnabled);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-lg" style={{ color: 'var(--muted)' }}>Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
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
        <Link
          href="/admin/login"
          className="text-xs"
          style={{ color: 'var(--muted)' }}
        >
          Admin
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Seção de personalizáveis */}
        {mockupProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}
              >
                <Sparkles size={15} /> Personalize o Seu
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Escolha, personalize com sua arte e gere um mockup
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mockupProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Divisor */}
        {mockupProducts.length > 0 && otherProducts.length > 0 && (
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Nossos Produtos</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
        )}

        {/* Outros produtos */}
        {otherProducts.length > 0 && (
          <section>
            {mockupProducts.length === 0 && (
              <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--foreground)' }}>Nossos Produtos</h2>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {otherProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {products.length === 0 && (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p className="text-lg" style={{ color: 'var(--muted)' }}>Nenhum produto disponível no momento.</p>
          </div>
        )}
      </main>
    </div>
  );
}
