'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, RotateCcw, ZoomIn, ZoomOut, Wand2, Download, Share2, ArrowLeft } from 'lucide-react';
import { productsApi, uploadsApi, mockupsApi, type Product } from '@/services/api';
import { useEditorStore } from '@/store/editor.store';
import { themeConfig } from '@/config/theme.config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    selectedVariantId,
    uploadedImageLocalUrl,
    transform,
    generatedMockupUrl,
    isGenerating,
    setProduct: storeSetProduct,
    setVariant,
    setUploadedImage,
    setTransform,
    setGeneratedMockup,
    setIsGenerating,
    reset,
  } = useEditorStore();

  // Carrega o produto
  useEffect(() => {
    setLoading(true);
    productsApi
      .getById(productId)
      .then((res) => {
        setProduct(res.data);
        storeSetProduct(productId);
        if (res.data.variants.length > 0) {
          setVariant(res.data.variants[0].id);
        }
      })
      .catch(() => {
        toast.error('Produto não encontrado');
        router.push('/');
      })
      .finally(() => setLoading(false));

    return () => reset();
  }, [productId]);

  // Upload via dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);

      try {
        const res = await uploadsApi.uploadImage(file);
        setUploadedImage(res.data.data.url, localUrl);
        setTransform({ x: product?.mockupAreas[0]?.x ?? 0, y: product?.mockupAreas[0]?.y ?? 0 });
        toast.success('Imagem carregada!');
      } catch {
        toast.error('Erro ao fazer upload da imagem');
      }
    },
    [product],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // Gera o mockup
  const handleGenerate = async () => {
    if (!uploadedImageLocalUrl) {
      toast.error('Envie uma imagem primeiro');
      return;
    }
    if (!product) return;

    const store = useEditorStore.getState();

    setIsGenerating(true);
    try {
      const res = await mockupsApi.generate({
        productId,
        variantId: selectedVariantId ?? undefined,
        imageUrl: store.uploadedImageUrl!,
        transform: store.transform,
      });
      setGeneratedMockup(res.data.data.mockupUrl);
      toast.success('Mockup gerado!');
    } catch {
      toast.error('Erro ao gerar mockup');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download do mockup
  const handleDownload = async () => {
    if (!generatedMockupUrl) return;
    const fullUrl = `${API_URL}${generatedMockupUrl}`;
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = `mockup-${productId}.png`;
    a.click();
  };

  // Compartilhar via WhatsApp
  const handleWhatsApp = () => {
    if (!generatedMockupUrl) return;
    const fullUrl = encodeURIComponent(`${API_URL}${generatedMockupUrl}`);
    const msg = encodeURIComponent(`Olá! Segue meu mockup personalizado: ${decodeURIComponent(fullUrl)}`);
    window.open(`https://wa.me/${themeConfig.whatsappNumber}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--color-brand-500)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--muted)' }}>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const area = product.mockupAreas[0];
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <button onClick={() => router.push('/')} className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={18} />
        </button>
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
          {product.name}
        </span>
      </header>

      {/* Editor */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="md:w-64 p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

          {/* Upload */}
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Sua arte
            </p>
            <div {...getRootProps()}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
              style={{
                borderColor: isDragActive ? 'var(--color-brand-500)' : 'var(--border)',
                background: isDragActive ? 'rgba(233,156,8,0.05)' : 'transparent',
              }}>
              <input {...getInputProps()} />
              <Upload size={20} className="mx-auto mb-1" style={{ color: 'var(--muted)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isDragActive ? 'Solte aqui' : 'Clique ou arraste sua imagem'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--border)' }}>PNG, JPG, SVG até 10MB</p>
            </div>
          </div>

          {/* Variantes */}
          {product.variants.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Variante
              </p>
              <select
                value={selectedVariantId ?? ''}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Escala */}
          {uploadedImageLocalUrl && (
            <div>
              <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Tamanho da arte
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setTransform({ scale: Math.max(0.3, transform.scale - 0.1) })}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                  <ZoomOut size={14} />
                </button>
                <div className="flex-1 text-center text-sm" style={{ color: 'var(--foreground)' }}>
                  {Math.round(transform.scale * 100)}%
                </div>
                <button onClick={() => setTransform({ scale: Math.min(2.0, transform.scale + 0.1) })}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Botão gerar */}
          <button
            onClick={handleGenerate}
            disabled={!uploadedImageLocalUrl || isGenerating}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: 'var(--color-brand-500)',
              color: '#0f0f0f',
              opacity: !uploadedImageLocalUrl || isGenerating ? 0.5 : 1,
              cursor: !uploadedImageLocalUrl || isGenerating ? 'not-allowed' : 'pointer',
            }}>
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#0f0f0f', borderTopColor: 'transparent' }} />
                Gerando...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Gerar Mockup
              </>
            )}
          </button>
        </aside>

        {/* Preview central */}
        <section className="flex-1 flex items-center justify-center p-6">
          <div className="relative">
            {/* Imagem base do produto */}
            <div className="relative w-80 h-80 md:w-96 md:h-96">
              {product.baseImageUrl ? (
                <Image
                  src={`${API_URL}${product.baseImageUrl}`}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--surface)', border: '2px dashed var(--border)' }}>
                  <div className="text-center">
                    <p className="text-6xl mb-2">
                      {product.category === 'vestuario' && '👕'}
                      {product.category === 'utilidades' && '☕'}
                      {product.category === 'acessorios' && '🎩'}
                      {product.category === 'calcados' && '👡'}
                      {!['vestuario','utilidades','acessorios','calcados'].includes(product.category) && '📦'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Placeholder — envie a imagem real
                    </p>
                  </div>
                </div>
              )}

              {/* Preview da arte do usuário */}
              {uploadedImageLocalUrl && area && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(area.x / 500) * 100}%`,
                    top: `${(area.y / 500) * 100}%`,
                    width: `${(area.width / 500) * 100 * transform.scale}%`,
                    transform: `rotate(${transform.rotation}deg)`,
                    opacity: 0.85,
                  }}>
                  <img src={uploadedImageLocalUrl} alt="Arte" className="w-full h-auto" />
                </div>
              )}
            </div>

            {/* Resultado gerado */}
            {generatedMockupUrl && (
              <div className="mt-6 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--color-brand-500)' }}>
                  ✓ Mockup gerado com sucesso!
                </p>
                <img
                  src={`${API_URL}${generatedMockupUrl}`}
                  alt="Mockup final"
                  className="rounded-xl max-w-xs mx-auto shadow-lg"
                />
                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}>
                    <Download size={14} />
                    Baixar
                  </button>
                  <button onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: '#25D366', color: '#fff' }}>
                    <Share2 size={14} />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
