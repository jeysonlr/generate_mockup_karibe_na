'use client';

import { useState } from 'react';

const FONT_FAMILIES = ['Arial', 'Georgia', 'Verdana', 'Courier New', 'Impact', 'Trebuchet MS'];
const FONT_WEIGHTS = ['normal', 'bold'];

export interface TextLayerLocal {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
}

interface TextPanelProps {
  textLayers: TextLayerLocal[];
  onAdd: (layer: TextLayerLocal) => void;
  onRemove: (index: number) => void;
  canvasSize?: number;
  /** Área real do produto no canvas — texto será centralizado aqui */
  productArea?: { x: number; y: number; width: number; height: number } | null;
}

export function TextPanel({ textLayers, onAdd, onRemove, canvasSize = 480, productArea }: TextPanelProps) {
  const [draft, setDraft] = useState({
    text: '',
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Arial',
    fontWeight: 'bold',
  });

  function handleAdd() {
    if (!draft.text.trim()) return;
    // Centraliza na área do produto; fallback: centro do canvas
    const cx = productArea ? productArea.x + productArea.width  / 2 : canvasSize / 2;
    const cy = productArea ? productArea.y + productArea.height / 2 : canvasSize / 2;
    onAdd({ ...draft, x: cx, y: cy });
    setDraft({ text: '', fontSize: 32, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' });
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Texto</h3>

      {/* Formulário de novo texto */}
      <div className="flex flex-col gap-3 p-3 rounded-lg border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <input
          type="text"
          placeholder="Digite o texto..."
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          className="w-full px-3 py-2 text-sm rounded-md focus:outline-none"
          style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Fonte</label>
            <select
              value={draft.fontFamily}
              onChange={(e) => setDraft((d) => ({ ...d, fontFamily: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm rounded-md focus:outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Peso</label>
            <select
              value={draft.fontWeight}
              onChange={(e) => setDraft((d) => ({ ...d, fontWeight: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm rounded-md focus:outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w} value={w}>{w === 'bold' ? 'Negrito' : 'Normal'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Tamanho (px)</label>
            <input
              type="number"
              min={8}
              max={120}
              value={draft.fontSize}
              onChange={(e) => setDraft((d) => ({ ...d, fontSize: Number(e.target.value) }))}
              className="w-full px-2 py-1.5 text-sm rounded-md focus:outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer"
                style={{ border: '1px solid var(--border)' }}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{draft.color.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!draft.text.trim()}
          className="w-full py-2 text-sm font-medium rounded-md transition-opacity"
          style={{
            background: 'var(--color-brand-500)',
            color: '#0f0f0f',
            opacity: !draft.text.trim() ? 0.4 : 1,
            cursor: !draft.text.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          + Adicionar texto
        </button>
      </div>

      {/* Lista de camadas de texto */}
      {textLayers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Camadas adicionadas:</p>
          {textLayers.map((layer, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-md"
              style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: layer.color ?? '#ffffff', border: '1px solid var(--border)' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{layer.text}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{layer.fontFamily} · {layer.fontSize}px</p>
                </div>
              </div>
              <button
                onClick={() => onRemove(i)}
                className="ml-2 flex-shrink-0 transition-colors"
                style={{ color: 'var(--muted)' }}
                title="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
