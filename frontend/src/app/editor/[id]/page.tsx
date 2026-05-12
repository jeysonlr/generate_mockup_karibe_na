'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, Wand2, Download, Share2, ArrowLeft, RotateCcw } from 'lucide-react';
import { productsApi, uploadsApi, mockupsApi, type Product } from '@/services/api';
import { useEditorStore } from '@/store/editor.store';
import { themeConfig } from '@/config/theme.config';
import { TextPanel, type TextLayerLocal } from '@/components/editor/TextPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

const BASE_IMG_SIZE = 800;
const CANVAS_SIZE = 480;
const TO_SERVER = BASE_IMG_SIZE / CANVAS_SIZE;

type Side = 'front' | 'back';

interface ArtTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface SideState {
  artLocalUrl: string | null;
  artServerUrl: string | null;
  art: ArtTransform;
  artNaturalRatio: number;
}

const DEFAULT_ART: ArtTransform = { x: 0, y: 0, width: 120, height: 120, rotation: 0 };

// Calcula transform centrado dentro de uma área do produto
function centeredArt(area: { x: number; y: number; width: number; height: number }): ArtTransform {
  const size = Math.min(area.width, area.height) * 0.75; // 75% da menor dimensão
  return {
    x: area.x + (area.width - size) / 2,
    y: area.y + (area.height - size) / 2,
    width: size,
    height: size,
    rotation: 0,
  };
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState<Side>('front');
  const [backMockupUrl, setBackMockupUrl] = useState<string | null>(null);

  // Estado independente por lado
  const [sides, setSides] = useState<Record<Side, SideState>>({
    front: { artLocalUrl: null, artServerUrl: null, art: DEFAULT_ART, artNaturalRatio: 1 },
    back:  { artLocalUrl: null, artServerUrl: null, art: DEFAULT_ART, artNaturalRatio: 1 },
  });

  const productAreaRef = useRef<Record<Side, { x: number; y: number; width: number; height: number } | null>>({ front: null, back: null });

  const dragging = useRef<{ startMouseX: number; startMouseY: number; startArtX: number; startArtY: number } | null>(null);
  const resizing = useRef<{ startMouseX: number; startMouseY: number; startW: number; startH: number } | null>(null);
  // Ref para activeSide — evita stale closure no listener de mousemove
  const activeSideRef = useRef<Side>('front');
  const containerRef = useRef<HTMLDivElement>(null);

  // Texto arrastável por lado
  const [textsBySide, setTextsBySide] = useState<Record<Side, TextLayerLocal[]>>({ front: [], back: [] });
  const draggingText = useRef<{ side: Side; index: number; startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const resizingText = useRef<{ side: Side; index: number; startMouseX: number; startMouseY: number; startFontSize: number } | null>(null);

  const {
    selectedVariantId,
    generatedMockupUrl,
    isGenerating,
    setProduct: storeSetProduct,
    setVariant,
    setGeneratedMockup,
    setIsGenerating,
    reset,
  } = useEditorStore();

  const current = sides[activeSide];

  // Mantém o ref sempre atualizado com o lado ativo
  useEffect(() => { activeSideRef.current = activeSide; }, [activeSide]);

  const setSide = (side: Side, patch: Partial<SideState>) =>
    setSides(prev => ({ ...prev, [side]: { ...prev[side], ...patch } }));

  // Carrega produto
  useEffect(() => {
    setLoading(true);
    productsApi
      .getById(productId)
      .then((res) => {
        const p = res.data;
        setProduct(p);
        storeSetProduct(productId);
        if (p.variants.length > 0) setVariant(p.variants[0].id);

        // Salva área real do produto em coordenadas do canvas
        const frontArea = p.mockupAreas.find(a => a.side === 'front') ?? p.mockupAreas[0];
        const backArea  = p.mockupAreas.find(a => a.side === 'back');

        if (frontArea) {
          const canvasArea = { x: frontArea.x / TO_SERVER, y: frontArea.y / TO_SERVER, width: frontArea.width / TO_SERVER, height: frontArea.height / TO_SERVER };
          productAreaRef.current.front = canvasArea;
          // Posição inicial: centralizado na área (será ajustado com proporção real no onArtLoad)
          setSide('front', { art: centeredArt(canvasArea) });
        }
        if (backArea) {
          const canvasArea = { x: backArea.x / TO_SERVER, y: backArea.y / TO_SERVER, width: backArea.width / TO_SERVER, height: backArea.height / TO_SERVER };
          productAreaRef.current.back = canvasArea;
          setSide('back', { art: centeredArt(canvasArea) });
        }
      })
      .catch(() => { toast.error('Produto não encontrado'); router.push('/'); })
      .finally(() => setLoading(false));
    return () => reset();
  }, [productId]);

  // Upload para o lado ativo
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    try {
      const res = await uploadsApi.uploadImage(file);
      const area = productAreaRef.current[activeSide];
      // Arte centralizada provisoriamente — onArtLoad ajusta com proporção real
      setSide(activeSide, {
        artLocalUrl: localUrl,
        artServerUrl: res.data.data.url,
        art: area ? centeredArt(area) : DEFAULT_ART,
      });
      toast.success(`Imagem carregada na ${activeSide === 'front' ? 'frente' : 'costa'}!`);
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    }
  }, [activeSide]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const onArtLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    const side = activeSideRef.current;
    setSides(prev => {
      const c = prev[side];
      const area = productAreaRef.current[side];
      if (!area) return { ...prev, [side]: { ...c, artNaturalRatio: ratio } };

      // Encaixa a arte proporcionalmente dentro da área do produto (75% do menor lado)
      let w = area.width * 0.75;
      let h = w / ratio;
      if (h > area.height * 0.75) { h = area.height * 0.75; w = h * ratio; }

      // Centraliza na área do produto
      const x = area.x + (area.width  - w) / 2;
      const y = area.y + (area.height - h) / 2;

      return { ...prev, [side]: { ...c, artNaturalRatio: ratio, art: { x, y, width: w, height: h, rotation: 0 } } };
    });
  }, []);

  // Drag
  const onMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { startMouseX: e.clientX, startMouseY: e.clientY, startArtX: current.art.x, startArtY: current.art.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const side = activeSideRef.current;
      if (dragging.current) {
        const dx = e.clientX - dragging.current.startMouseX;
        const dy = e.clientY - dragging.current.startMouseY;
        setSides(prev => {
          const c = prev[side];
          return { ...prev, [side]: { ...c, art: { ...c.art,
            x: Math.max(0, Math.min(CANVAS_SIZE - c.art.width,  dragging.current!.startArtX + dx)),
            y: Math.max(0, Math.min(CANVAS_SIZE - c.art.height, dragging.current!.startArtY + dy)),
          }}};
        });
      }
      if (resizing.current) {
        const dx = e.clientX - resizing.current.startMouseX;
        const newW = Math.max(40, resizing.current.startW + dx);
        setSides(prev => {
          const c = prev[side];
          const newH = newW / c.artNaturalRatio;
          return { ...prev, [side]: { ...c, art: { ...c.art,
            width:  Math.min(newW, CANVAS_SIZE - c.art.x),
            height: Math.min(newH, CANVAS_SIZE - c.art.y),
          }}};
        });
      }
      if (draggingText.current) {
        const { side: tSide, index, startMouseX, startMouseY, startX, startY } = draggingText.current;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        setTextsBySide(prev => {
          const layers = prev[tSide].map((l, i) =>
            i === index ? { ...l, x: Math.max(0, Math.min(CANVAS_SIZE, startX + dx)), y: Math.max(0, Math.min(CANVAS_SIZE, startY + dy)) } : l
          );
          return { ...prev, [tSide]: layers };
        });
      }
      if (resizingText.current) {
        const { side: tSide, index, startMouseX, startFontSize } = resizingText.current;
        const dx = e.clientX - startMouseX;
        const newSize = Math.max(8, Math.min(200, startFontSize + dx * 0.3));
        setTextsBySide(prev => {
          const layers = prev[tSide].map((l, i) => i === index ? { ...l, fontSize: newSize } : l);
          return { ...prev, [tSide]: layers };
        });
      }
    };
    const onUp = () => { dragging.current = null; resizing.current = null; draggingText.current = null; resizingText.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []); // sem dependências — usa refs para evitar stale closure

  const onMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { startMouseX: e.clientX, startMouseY: e.clientY, startW: current.art.width, startH: current.art.height };
  };

  // Imagem do produto para o lado ativo
  const productImageUrl = (() => {
    if (activeSide === 'back' && product?.backImageUrl) {
      return `${API_URL}${product.backImageUrl}`;
    }
    if (product?.baseImageUrl) {
      return `${API_URL}${product.baseImageUrl}`;
    }
    return null;
  })();

  // Gerar mockup (imagem OU texto em qualquer lado)
  const handleGenerate = async () => {
    const hasFrontArt = !!sides.front.artServerUrl;
    const hasFrontText = textsBySide.front.length > 0;
    const hasBackArt  = !!sides.back.artServerUrl;
    const hasBackText = textsBySide.back.length > 0;
    if (!hasFrontArt && !hasFrontText && !hasBackArt && !hasBackText) {
      toast.error('Adicione ao menos uma arte ou texto em algum lado');
      return;
    }
    if (!product) return;
    setIsGenerating(true);
    try {
      const frontArea = product.mockupAreas.find(a => a.side === 'front') ?? product.mockupAreas[0];
      const backArea  = product.mockupAreas.find(a => a.side === 'back');

      const toServerText = (t: TextLayerLocal) => ({
        text: t.text,
        x: Math.round(t.x * TO_SERVER),
        y: Math.round(t.y * TO_SERVER),
        fontSize: Math.round(t.fontSize * TO_SERVER),
        color: t.color,
        fontFamily: t.fontFamily,
        fontWeight: t.fontWeight,
      });

      const frontTexts = textsBySide.front.map(toServerText);
      const backTexts  = textsBySide.back.map(toServerText);

      const payload: Parameters<typeof mockupsApi.generate>[0] = {
        productId,
        variantId: selectedVariantId ?? undefined,
        textLayers: frontTexts.length > 0 ? frontTexts : undefined,
      };

      if (hasFrontArt && frontArea) {
        payload.imageUrl = sides.front.artServerUrl!;
        payload.transform = {
          x: Math.round(sides.front.art.x * TO_SERVER - (frontArea.x ?? 0)),
          y: Math.round(sides.front.art.y * TO_SERVER - (frontArea.y ?? 0)),
          scale: (sides.front.art.width * TO_SERVER) / (frontArea.width ?? 200),
          rotation: sides.front.art.rotation,
        };
      }

      // Verso
      if (backArea && (sides.back.artServerUrl || backTexts.length > 0)) {
        if (sides.back.artServerUrl) payload.backImageUrl = sides.back.artServerUrl;
        payload.backTransform = {
          x: Math.round(sides.back.art.x * TO_SERVER - (backArea.x ?? 0)),
          y: Math.round(sides.back.art.y * TO_SERVER - (backArea.y ?? 0)),
          scale: (sides.back.art.width * TO_SERVER) / (backArea.width ?? 200),
          rotation: sides.back.art.rotation,
        };
        if (backTexts.length > 0) payload.backTextLayers = backTexts;
      }

      console.log('[handleGenerate] payload enviado:', JSON.stringify(payload, null, 2));
      const res = await mockupsApi.generate(payload);
      console.log('[handleGenerate] resposta:', JSON.stringify(res.data, null, 2));
      setGeneratedMockup(res.data.data.mockupUrl ?? res.data.data.backMockupUrl);
      setBackMockupUrl(
        res.data.data.mockupUrl && res.data.data.backMockupUrl
          ? res.data.data.backMockupUrl
          : null
      );
      toast.success('Mockup gerado!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } };
      console.error('[handleGenerate] erro:', axiosErr?.response?.data ?? err);
      toast.error('Erro ao gerar mockup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedMockupUrl) return;
    const a = document.createElement('a');
    a.href = `${API_URL}${generatedMockupUrl}`;
    a.download = `mockup-${productId}-frente.png`;
    a.click();
  };

  const handleDownloadBack = () => {
    if (!backMockupUrl) return;
    const a = document.createElement('a');
    a.href = `${API_URL}${backMockupUrl}`;
    a.download = `mockup-${productId}-costa.png`;
    a.click();
  };

  // Combina frente + verso lado a lado num único PNG e faz download
  const handleDownloadCombined = async () => {
    if (!generatedMockupUrl || !backMockupUrl) return;

    const loadImg = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    try {
      const [imgFront, imgBack] = await Promise.all([
        loadImg(`${API_URL}${generatedMockupUrl}`),
        loadImg(`${API_URL}${backMockupUrl}`),
      ]);

      const GAP = 20;
      const h = Math.max(imgFront.naturalHeight, imgBack.naturalHeight);
      const w = imgFront.naturalWidth + GAP + imgBack.naturalWidth;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(imgFront, 0, (h - imgFront.naturalHeight) / 2);
      ctx.drawImage(imgBack, imgFront.naturalWidth + GAP, (h - imgBack.naturalHeight) / 2);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mockup-${productId}-completo.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, 'image/png');
    } catch {
      toast.error('Erro ao combinar imagens');
    }
  };

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

  const hasSides = product.hasSides && product.mockupAreas.some(a => a.side === 'back');

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <button onClick={() => router.push('/')} className="p-1.5 rounded-lg" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={18} />
        </button>
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{product.name}</span>
        {hasSides && (
          <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}>
            Frente e Verso disponíveis
          </span>
        )}
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="md:w-64 p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r overflow-y-auto"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

          {/* Abas Frente / Verso */}
          {hasSides && (
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['front', 'back'] as Side[]).map(side => (
                <button
                  key={side}
                  onClick={() => setActiveSide(side)}
                  className="flex-1 py-2 text-sm font-medium transition-colors relative"
                  style={{
                    background: activeSide === side ? 'var(--color-brand-500)' : 'transparent',
                    color: activeSide === side ? '#0f0f0f' : 'var(--muted)',
                  }}
                >
                  {side === 'front' ? '👕 Frente' : '🔄 Costa'}
                  {/* Indicador de arte carregada */}
                  {sides[side].artLocalUrl && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Upload */}
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Sua arte {hasSides ? `— ${activeSide === 'front' ? 'Frente' : 'Costa'}` : ''}
            </p>
            <div {...getRootProps()}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
              style={{ borderColor: isDragActive ? 'var(--color-brand-500)' : 'var(--border)' }}>
              <input {...getInputProps()} />
              {current.artLocalUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={current.artLocalUrl} alt="Arte atual" className="w-full h-20 object-contain rounded mb-1" />
              ) : (
                <Upload size={20} className="mx-auto mb-1" style={{ color: 'var(--muted)' }} />
              )}
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isDragActive ? 'Solte aqui' : current.artLocalUrl ? 'Trocar imagem' : 'Clique ou arraste sua imagem'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--border)' }}>PNG, JPG, SVG até 10MB</p>
            </div>
          </div>

          {/* Resumo dos lados quando hasSides */}
          {hasSides && (
            <div className="rounded-xl p-3 text-xs flex flex-col gap-1" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Resumo</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sides.front.artLocalUrl ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span style={{ color: 'var(--muted)' }}>Frente: {sides.front.artLocalUrl ? '✓ Arte carregada' : 'sem arte'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sides.back.artLocalUrl ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span style={{ color: 'var(--muted)' }}>Costa: {sides.back.artLocalUrl ? '✓ Arte carregada' : 'sem arte (opcional)'}</span>
              </div>
            </div>
          )}

          {/* Variantes */}
          {product.variants.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Variante</p>
              <select value={selectedVariantId ?? ''} onChange={(e) => setVariant(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                {product.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}

          {/* Rotação */}
          {current.artLocalUrl && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Rotação</p>
              <div className="flex items-center gap-2">
                <input type="range" min={-180} max={180} value={current.art.rotation}
                  onChange={e => setSide(activeSide, { art: { ...current.art, rotation: Number(e.target.value) } })}
                  className="flex-1" style={{ accentColor: 'var(--color-brand-500)' }} />
                <span className="text-xs w-10 text-right" style={{ color: 'var(--foreground)' }}>{current.art.rotation}°</span>
                <button onClick={() => setSide(activeSide, { art: { ...current.art, rotation: 0 } })} title="Resetar">
                  <RotateCcw size={14} style={{ color: 'var(--muted)' }} />
                </button>
              </div>
            </div>
          )}

          {/* Texto */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <TextPanel
              textLayers={textsBySide[activeSide]}
              onAdd={(layer) => setTextsBySide(prev => ({ ...prev, [activeSide]: [...prev[activeSide], layer] }))}
              onRemove={(i) => setTextsBySide(prev => ({ ...prev, [activeSide]: prev[activeSide].filter((_, idx) => idx !== i) }))}
              canvasSize={CANVAS_SIZE}
              productArea={productAreaRef.current[activeSide]}
            />
          </div>

          {/* Gerar */}
          {(() => {
            const canGenerate = !isGenerating && (
              !!sides.front.artServerUrl || textsBySide.front.length > 0 ||
              !!sides.back.artServerUrl  || textsBySide.back.length  > 0
            );
            return (
              <button onClick={handleGenerate} disabled={!canGenerate}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{
                  background: 'var(--color-brand-500)', color: '#0f0f0f',
                  opacity: !canGenerate ? 0.5 : 1,
                  cursor: !canGenerate ? 'not-allowed' : 'pointer',
                }}>
                {isGenerating
                  ? <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#0f0f0f', borderTopColor: 'transparent' }} />Gerando...</>
                  : <><Wand2 size={16} />Gerar Mockup</>
                }
              </button>
            );
          })()}
        </aside>

        {/* Canvas */}
        <section className="flex-1 flex flex-col items-center justify-center gap-6 p-6">

          {/* Abas de lado acima do canvas (visível no mobile tb) */}
          {hasSides && (
            <div className="flex gap-2">
              {(['front', 'back'] as Side[]).map(side => (
                <button key={side} onClick={() => setActiveSide(side)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all relative"
                  style={{
                    background: activeSide === side ? 'var(--color-brand-500)' : 'var(--surface)',
                    color: activeSide === side ? '#0f0f0f' : 'var(--muted)',
                    border: `1px solid ${activeSide === side ? 'var(--color-brand-500)' : 'var(--border)'}`,
                  }}>
                  {side === 'front' ? '👕 Frente' : '🔄 Costa'}
                  {sides[side].artLocalUrl && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Canvas de preview */}
          <div style={{ position: 'relative', width: CANVAS_SIZE, height: CANVAS_SIZE, flexShrink: 0 }}>
            <div
              ref={containerRef}
              className="relative select-none rounded-2xl"
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                overflow: 'visible',
                backgroundImage: 'linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
                backgroundColor: '#1a1a1a',
              }}
            >
              {/* 1ª camada: imagem do produto */}
              {productImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={productImageUrl}
                  src={productImageUrl}
                  alt={product.name}
                  draggable={false}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', zIndex: 1 }}
                />
              )}

              {/* 2ª camada: arte do lado ativo */}
              {current.artLocalUrl && (
                <div onMouseDown={onMouseDownDrag}
                  style={{
                    position: 'absolute', left: current.art.x, top: current.art.y,
                    width: current.art.width, height: current.art.height,
                    transform: `rotate(${current.art.rotation}deg)`,
                    cursor: 'move', transformOrigin: 'center center', zIndex: 2, boxSizing: 'border-box',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.artLocalUrl} alt="Arte" onLoad={onArtLoad} draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }}
                  />
                </div>
              )}

              {/* 3ª camada: borda + handle */}
              {current.artLocalUrl && (
                <div style={{
                  position: 'absolute', left: current.art.x, top: current.art.y,
                  width: current.art.width, height: current.art.height,
                  transform: `rotate(${current.art.rotation}deg)`,
                  transformOrigin: 'center center',
                  outline: '2px dashed rgba(233,156,8,0.9)',
                  boxSizing: 'border-box', pointerEvents: 'none', zIndex: 3,
                }}>
                  <div onMouseDown={onMouseDownResize}
                    style={{
                      position: 'absolute', bottom: -7, right: -7,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--color-brand-500)', cursor: 'se-resize',
                      border: '2px solid #0f0f0f', zIndex: 4, pointerEvents: 'all',
                    }}
                  />
                </div>
              )}

              {/* Camadas de texto (arrastáveis + redimensionáveis) */}
              {textsBySide[activeSide].map((layer, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: layer.x,
                    top: layer.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                    cursor: 'move',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    draggingText.current = { side: activeSide, index: i, startMouseX: e.clientX, startMouseY: e.clientY, startX: layer.x, startY: layer.y };
                  }}
                >
                  {/* Texto visível */}
                  <span
                    className="whitespace-nowrap"
                    style={{
                      display: 'block',
                      fontSize: `${layer.fontSize}px`,
                      color: layer.color,
                      fontFamily: layer.fontFamily,
                      fontWeight: layer.fontWeight,
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                      outline: '1px dashed rgba(233,156,8,0.6)',
                      padding: '2px 6px',
                      lineHeight: 1.1,
                    }}>
                    {layer.text}
                  </span>
                  {/* Handle de resize (canto inferior direito) */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      resizingText.current = { side: activeSide, index: i, startMouseX: e.clientX, startMouseY: e.clientY, startFontSize: layer.fontSize };
                    }}
                    title="Redimensionar texto"
                    style={{
                      position: 'absolute', bottom: -6, right: -6,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'var(--color-brand-500)',
                      border: '2px solid #0f0f0f',
                      cursor: 'se-resize', zIndex: 6,
                    }}
                  />
                </div>
              ))}

              {/* Instrução */}
              {(current.artLocalUrl || textsBySide[activeSide].length > 0) && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                    Arraste para mover · Puxe o ● para redimensionar
                  </span>
                </div>
              )}

              {/* Placeholder quando sem arte */}
              {!current.artLocalUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                  <Upload size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Envie a arte para a {activeSide === 'front' ? 'frente' : 'costa'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resultado gerado — persiste independente da aba ativa */}
          {generatedMockupUrl && (
            <div className="w-full max-w-2xl mx-auto rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-4 text-center" style={{ color: 'var(--color-brand-500)' }}>
                ✓ Mockup gerado!
              </p>

              {/* Imagens lado a lado */}
              <div className="flex gap-4 justify-center flex-wrap mb-5">
                <div className="text-center">
                  {backMockupUrl && (
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--muted)' }}>👕 Frente</p>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_URL}${generatedMockupUrl}`}
                    alt="Mockup frente"
                    className="rounded-xl shadow-lg mx-auto"
                    style={{ maxWidth: backMockupUrl ? 220 : 320, width: '100%' }}
                  />
                </div>
                {backMockupUrl && (
                  <div className="text-center">
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--muted)' }}>🔄 Costa</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_URL}${backMockupUrl}`}
                      alt="Mockup costa"
                      className="rounded-xl shadow-lg mx-auto"
                      style={{ maxWidth: 220, width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Botões de download */}
              <div className="flex gap-2 justify-center flex-wrap">
                {/* Combinado (só aparece quando há frente + verso) */}
                {backMockupUrl && (
                  <button onClick={handleDownloadCombined}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--color-brand-500)', color: '#0f0f0f' }}>
                    <Download size={14} />Baixar Completo (Frente + Costa)
                  </button>
                )}
                {/* Individuais */}
                <button onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                  <Download size={14} />{backMockupUrl ? 'Só Frente' : 'Baixar'}
                </button>
                {backMockupUrl && (
                  <button onClick={handleDownloadBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                    <Download size={14} />Só Costa
                  </button>
                )}
                <button onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: '#25D366', color: '#fff' }}>
                  <Share2 size={14} />WhatsApp
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
