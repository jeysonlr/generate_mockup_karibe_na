'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminProductsApi, Product, resolveProductImage } from '@/services/api';
import { Package, Plus, Edit, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminProductsApi.getAll()
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : (res.data as any).data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = products.filter((p) => p.isActive);
  const withMockup = products.filter((p) => p.isMockupEnabled);

  async function toggleActive(product: Product) {
    await adminProductsApi.update(product.id, { isActive: !product.isActive });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Gerencie os produtos do catálogo</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Novo Produto
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total de Produtos', value: products.length, icon: Package, color: 'bg-blue-500' },
          { label: 'Produtos Ativos', value: active.length, icon: ToggleRight, color: 'bg-green-500' },
          { label: 'Com Mockup', value: withMockup.length, icon: Sparkles, color: 'bg-indigo-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Todos os Produtos</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p>Nenhum produto cadastrado ainda.</p>
            <Link href="/admin/produtos/novo" className="text-indigo-600 hover:underline mt-2 inline-block">
              Criar primeiro produto
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left px-6 py-3">Produto</th>
                <th className="text-left px-6 py-3">Categoria</th>
                <th className="text-left px-6 py-3">Preço</th>
                <th className="text-left px-6 py-3">Mockup</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {resolveProductImage(product, 'front') ? (
                        <img src={resolveProductImage(product, 'front')!} alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-48">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.price ? `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {product.isMockupEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                        <Sparkles size={12} /> Habilitado
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(product)} className="flex items-center gap-1 text-sm">
                      {product.isActive ? (
                        <><ToggleRight size={20} className="text-green-500" /><span className="text-green-600">Ativo</span></>
                      ) : (
                        <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-400">Inativo</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Edit size={15} /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
