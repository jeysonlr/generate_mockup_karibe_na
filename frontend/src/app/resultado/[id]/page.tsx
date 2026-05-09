'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { mockupsApi, type MockupResult } from '../../../services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [result, setResult] = useState<MockupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    mockupsApi.getById(id)
      .then((res) => setResult(res.data))
      .catch(() => setError('Mockup não encontrado ou expirado.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando resultado...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error ?? 'Erro desconhecido.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const mockupUrl = `${API_URL}${result.data.imageUrl}`;
  const productName = result.data.product?.name ?? 'Produto';

  function handleDownload() {
    const a = document.createElement('a');
    a.href = mockupUrl;
    a.download = `mockup-${productName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  }

  function handleWhatsApp() {
    const message = encodeURIComponent(
      `🎨 Veja o mockup que criei para ${productName}!\n${mockupUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>✅</span> Mockup gerado com sucesso!
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{productName} personalizado</h1>
          <p className="text-gray-500 mt-1">
            Criado em {new Date(result.data.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Preview do mockup */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="relative aspect-square w-full bg-gray-100">
            <Image
              src={mockupUrl}
              alt={`Mockup de ${productName}`}
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar PNG
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.522 5.837L.057 23.743a.5.5 0 00.609.664l6.101-1.598A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.88 9.88 0 01-5.031-1.372l-.36-.214-3.733.978.997-3.645-.234-.374A9.862 9.862 0 012.1 12C2.1 6.536 6.536 2.1 12 2.1S21.9 6.536 21.9 12 17.464 21.9 12 21.9z"/>
            </svg>
            Compartilhar via WhatsApp
          </button>
        </div>

        {/* Ações secundárias */}
        <div className="flex flex-col sm:flex-row gap-2 text-center">
          <button
            onClick={() => router.back()}
            className="flex-1 py-2 px-4 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            ← Editar novamente
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-2 px-4 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            🏠 Novo mockup
          </button>
        </div>

      </div>
    </div>
  );
}
