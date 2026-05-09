'use client';

import { useEditorStore } from '../../store/editor.store';

export function RotationControl() {
  const { transform, setTransform } = useEditorStore();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Rotação</h3>

      <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={transform.rotation}
          onChange={(e) => setTransform({ rotation: Number(e.target.value) })}
          className="flex-1"
          style={{ accentColor: 'var(--color-brand-500)' }}
        />
        <div className="flex items-center gap-1 w-20 flex-shrink-0">
          <input
            type="number"
            min={-180}
            max={180}
            value={transform.rotation}
            onChange={(e) => {
              const val = Math.max(-180, Math.min(180, Number(e.target.value)));
              setTransform({ rotation: val });
            }}
            className="w-14 px-2 py-1 text-sm text-center rounded-md focus:outline-none"
            style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>°</span>
        </div>
      </div>

      <button
        onClick={() => setTransform({ rotation: 0 })}
        disabled={transform.rotation === 0}
        className="text-xs text-left transition-colors disabled:cursor-not-allowed"
        style={{ color: transform.rotation === 0 ? 'var(--border)' : 'var(--color-brand-500)' }}
      >
        ↺ Resetar rotação
      </button>
    </div>
  );
}
