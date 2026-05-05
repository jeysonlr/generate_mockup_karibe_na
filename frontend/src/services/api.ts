import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

// ── Tipos de resposta ──────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  baseImageUrl: string | null;
  isActive: boolean;
  variants: ProductVariant[];
  mockupAreas: MockupArea[];
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
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GenerateMockupPayload {
  productId: string;
  variantId?: string;
  imageUrl: string;
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
}

export interface GenerateMockupResponse {
  data: {
    id: string;
    mockupUrl: string;
    productId: string;
    createdAt: string;
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
};
