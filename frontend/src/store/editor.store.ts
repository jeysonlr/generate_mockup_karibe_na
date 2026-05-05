import { create } from 'zustand';

interface EditorTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface EditorState {
  // Produto selecionado
  selectedProductId: string | null;
  selectedVariantId: string | null;

  // Arte do usuário
  uploadedImageUrl: string | null;
  uploadedImageLocalUrl: string | null; // blob URL para preview

  // Transformações no editor
  transform: EditorTransform;

  // Mockup gerado
  generatedMockupUrl: string | null;
  isGenerating: boolean;

  // Actions
  setProduct: (productId: string) => void;
  setVariant: (variantId: string) => void;
  setUploadedImage: (url: string, localUrl: string) => void;
  setTransform: (transform: Partial<EditorTransform>) => void;
  setGeneratedMockup: (url: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  reset: () => void;
}

const defaultTransform: EditorTransform = {
  x: 0,
  y: 0,
  scale: 1.0,
  rotation: 0,
};

export const useEditorStore = create<EditorState>((set) => ({
  selectedProductId: null,
  selectedVariantId: null,
  uploadedImageUrl: null,
  uploadedImageLocalUrl: null,
  transform: defaultTransform,
  generatedMockupUrl: null,
  isGenerating: false,

  setProduct: (productId) =>
    set({ selectedProductId: productId, selectedVariantId: null, generatedMockupUrl: null }),

  setVariant: (variantId) =>
    set({ selectedVariantId: variantId, generatedMockupUrl: null }),

  setUploadedImage: (url, localUrl) =>
    set({ uploadedImageUrl: url, uploadedImageLocalUrl: localUrl, generatedMockupUrl: null }),

  setTransform: (partial) =>
    set((state) => ({ transform: { ...state.transform, ...partial } })),

  setGeneratedMockup: (url) => set({ generatedMockupUrl: url }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  reset: () =>
    set({
      selectedProductId: null,
      selectedVariantId: null,
      uploadedImageUrl: null,
      uploadedImageLocalUrl: null,
      transform: defaultTransform,
      generatedMockupUrl: null,
      isGenerating: false,
    }),
}));
