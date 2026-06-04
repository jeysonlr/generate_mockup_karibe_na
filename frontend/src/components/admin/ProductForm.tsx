'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, adminProductsApi, CreateProductPayload, UpdateProductPayload, resolveProductImage } from '@/services/api';
import { Save, Trash2, Upload, Sparkles, Layers, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  product?: Product;
  mode: 'create' | 'edit';
}

export default function ProductForm({ product, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState<'front' | 'back' | null>(null);

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    price: product?.price ? String(parseFloat(product.price)) : '',
    isMockupEnabled: product?.isMockupEnabled ?? false,
    hasSides: product?.hasSides ?? false,
    isActive: product?.isActive ?? true,
  });

  const [areas, setAreas] = useState(
    product?.mockupAreas ?? []
  );

  function setField(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateArea(index: number, field: string, value: number) {
    setAreas((prev) => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  }

  function addArea(side: 'front' | 'back') {
    setAreas((prev) => [...prev, { id: '', productId: product?.id ?? '', side, x: 100, y: 100, width: 300, height: 300 }]);
  }

  function removeArea(index: number) {
    setAreas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(side: 'front' | 'back', file: File) {
    if (!product?.id) return;
    setUploadingImage(side);
    try {
      await adminProductsApi.uploadImage(product.id, side, file);
      router.refresh();
    } catch {
      setError('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: CreateProductPayload | UpdateProductPayload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        price: form.price ? parseFloat(form.price) : undefined,
        isMockupEnabled: form.isMockupEnabled,
        hasSides: form.hasSides,
        ...(mode === 'edit' ? { isActive: form.isActive } : {}),
        mockupAreas: areas.map(({ side, x, y, width, height }) => ({ side: side as 'front' | 'back', x, y, width, height })),
      };

      if (mode === 'create') {
        const res = await adminProductsApi.create(payload as CreateProductPayload);
        // O backend retorna { data: Product, message, status }
        const created = (res.data as any).data ?? res.data;
        // Redireciona para edição para que o upload de imagem fique disponível
        router.push(`/admin/produtos/${created.id}`);
      } else {
        await adminProductsApi.update(product!.id, payload as UpdateProductPayload);
        router.push('/admin/dashboard');
      }
    } catch {
      setError('Erro ao salvar produto. Verifique os dados.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Desativar este produto? Ele não aparecerá mais na vitrine.')) return;
    await adminProductsApi.remove(product!.id);
    router.push('/admin/dashboard');
  }

  const frontAreas = areas.filter((a) => a.side === 'front');
  const backAreas = areas.filter((a) => a.side === 'back');

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Novo Produto' : `Editar: ${product?.name}`}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'create' ? 'Preencha os dados do novo produto' : 'Atualize as informações do produto'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <button type="button" onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 text-sm font-medium transition-colors">
              <Trash2 size={16} /> Desativar
            </button>
          )}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-6">
          {/* Dados básicos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Informações do Produto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                <input type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria *</label>
                  <input type="text" required value={form.category} onChange={(e) => setField('category', e.target.value)}
                    placeholder="ex: vestuario, acessorios"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Área de personalização */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Layers size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Áreas de Personalização</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Define onde a arte do cliente será aplicada no mockup (em pixels, baseado em imagem 800×800).
            </p>

            {/* Frente */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Frente</span>
                <button type="button" onClick={() => addArea('front')}
                  className="text-xs text-indigo-600 hover:underline">+ Adicionar área</button>
              </div>
              {frontAreas.length === 0 && <p className="text-xs text-gray-400">Nenhuma área definida.</p>}
              {areas.map((area, idx) => area.side === 'front' ? (
                <div key={idx} className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg">
                  {(['x', 'y', 'width', 'height'] as const).map((f) => (
                    <div key={f} className="flex-1">
                      <label className="text-xs text-gray-400 block mb-1">{f.toUpperCase()}</label>
                      <input type="number" value={area[f]} onChange={(e) => updateArea(idx, f, parseInt(e.target.value))}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 bg-white text-center" />
                    </div>
                  ))}
                  <button type="button" onClick={() => removeArea(idx)} className="text-red-400 hover:text-red-600 mt-4">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : null)}
            </div>

            {/* Costa */}
            {form.hasSides && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Costa</span>
                  <button type="button" onClick={() => addArea('back')}
                    className="text-xs text-indigo-600 hover:underline">+ Adicionar área</button>
                </div>
                {backAreas.length === 0 && <p className="text-xs text-gray-400">Nenhuma área definida.</p>}
                {areas.map((area, idx) => area.side === 'back' ? (
                  <div key={idx} className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg">
                    {(['x', 'y', 'width', 'height'] as const).map((f) => (
                      <div key={f} className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">{f.toUpperCase()}</label>
                        <input type="number" value={area[f]} onChange={(e) => updateArea(idx, f, parseInt(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900 bg-white text-center" />
                      </div>
                    ))}
                    <button type="button" onClick={() => removeArea(idx)} className="text-red-400 hover:text-red-600 mt-4">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* Upload de imagens */}
          {mode === 'edit' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Upload size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Imagens do Produto</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(['front', 'back'] as const).filter((s) => s === 'front' || form.hasSides).map((side) => (
                  <div key={side} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                    {resolveProductImage(product!, side) ? (
                      <img
                        src={resolveProductImage(product!, side)!}
                        alt={side}
                        className="w-full h-40 object-contain mb-3 rounded-lg bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                        <Upload size={32} className="text-gray-300" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-700 mb-2 capitalize">{side === 'front' ? 'Frente' : 'Costa'}</p>
                    <label className="cursor-pointer inline-block">
                      <span className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        {uploadingImage === side ? 'Enviando...' : 'Trocar imagem'}
                      </span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(side, e.target.files[0])} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
              <Upload size={20} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Upload de imagens disponível após salvar</p>
                <p className="text-xs text-amber-600 mt-1">
                  Salve o produto primeiro. Você será redirecionado automaticamente para a página de edição onde poderá fazer o upload das imagens de frente e costa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Configurações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Configurações</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-800 text-sm">
                    <Sparkles size={15} className="text-indigo-500" /> Personalização com Mockup
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Habilita editor visual para este produto</p>
                </div>
                <div
                  onClick={() => setField('isMockupEnabled', !form.isMockupEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isMockupEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.isMockupEnabled ? 'translate-x-5' : ''}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-800 text-sm">
                    <Layers size={15} className="text-blue-500" /> Frente e Costa
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Permite personalizar os dois lados</p>
                </div>
                <div
                  onClick={() => setField('hasSides', !form.hasSides)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.hasSides ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.hasSides ? 'translate-x-5' : ''}`} />
                </div>
              </label>

              {mode === 'edit' && (
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">Produto Ativo</div>
                    <p className="text-xs text-gray-400 mt-0.5">Visível na vitrine pública</p>
                  </div>
                  <div
                    onClick={() => setField('isActive', !form.isActive)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
