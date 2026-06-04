import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: adiciona token JWT automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

// ── Tipos de resposta ──────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: string | null;
  baseImageUrl: string | null;
  baseImageData: string | null;
  backImageUrl: string | null;
  backImageData: string | null;
  hasSides: boolean;
  isMockupEnabled: boolean;
  isActive: boolean;
  variants: ProductVariant[];
  mockupAreas: MockupArea[];
}

/**
 * Resolve a melhor fonte de imagem de um produto para exibição no browser.
 * Prioridade: base64 do banco → URL (relativa ou absoluta).
 */
export function resolveProductImage(
  product: Pick<Product, 'baseImageData' | 'backImageData' | 'baseImageUrl' | 'backImageUrl'>,
  side: 'front' | 'back' = 'front',
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
): string | null {
  const data = side === 'back' ? product.backImageData : product.baseImageData;
  if (data) return data; // já é data URI base64

  const url = side === 'back' ? product.backImageUrl : product.baseImageUrl;
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${apiUrl}${url}`;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  attributesJson: {
    color?: string;
    size?: string;
    [key: string]: unknown;
  };
  isActive: boolean;
}

export interface MockupArea {
  id: string;
  productId: string;
  side: 'front' | 'back';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextLayer {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export interface ArtRectPayload {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface GenerateMockupPayload {
  productId: string;
  variantId?: string;
  imageUrl?: string;
  artRect?: ArtRectPayload;
  textLayers?: TextLayer[];
  // Verso (opcional)
  backImageUrl?: string;
  backArtRect?: ArtRectPayload;
  backTextLayers?: TextLayer[];
}

export interface GenerateMockupResponse {
  data: {
    id: string;
    mockupUrl: string;
    backMockupUrl: string | null;
    productId: string;
    createdAt: string;
  };
  message: string;
  status: number;
}

export interface MockupResult {
  data: {
    id: string;
    imageUrl: string;
    productId: string;
    variantId: string | null;
    createdAt: string;
    product: Product;
  };
  message: string;
  status: number;
}

// ── Funções de API ─────────────────────────────────────────────────────────

export const productsApi = {
  getAll: () => api.get<Product[]>('/products'),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
};

export const uploadsApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ data: { url: string; filename: string } }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const mockupsApi = {
  generate: (payload: GenerateMockupPayload) =>
    api.post<GenerateMockupResponse>('/mockup/generate', payload),
  getById: (id: string) =>
    api.get<MockupResult>(`/mockup/${id}`),
};

// ── Auth Admin ─────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string; }
export interface LoginResponse {
  data: { access_token: string; admin: { id: string; name: string; email: string } };
  message: string; status: number;
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>('/auth/login', payload),
  me: () => api.get('/auth/me'),
};

// ── Admin Products ──────────────────────────────────────────────────────────

export interface MockupAreaInput { side: 'front' | 'back'; x: number; y: number; width: number; height: number; }

export interface CreateProductPayload {
  name: string; description?: string; category: string;
  price?: number; isMockupEnabled?: boolean; hasSides?: boolean;
  mockupAreas?: MockupAreaInput[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  isActive?: boolean;
}

export const adminProductsApi = {
  getAll: () => api.get<Product[]>('/admin/products'),
  getById: (id: string) => api.get<Product>(`/admin/products/${id}`),
  create: (payload: CreateProductPayload) => api.post<Product>('/admin/products', payload),
  update: (id: string, payload: UpdateProductPayload) => api.put<Product>(`/admin/products/${id}`, payload),
  remove: (id: string) => api.delete(`/admin/products/${id}`),
  uploadImage: (id: string, side: 'front' | 'back', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ data: Product }>(`/admin/products/${id}/image/${side}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
