import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../App';
import { Spinner } from './EstadoBadge';

// Power BI is read-only: "exporting" means writing the output tables it consumes and refreshing the dataset.
interface Props {
  reporte: string;
  tablas: string[];
  navigate?: (s: Screen) => void;
}

type Fase = 'cerrado' | 'publicando' | 'listo';

const PowerBIIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="12" width="4" height="9" rx="1" fill="#e8b500" />
    <rect x="10" y="7" width="4" height="14" rx="1" fill="#f2c811" />
    <rect x="17" y="3" width="4" height="18" rx="1" fill="#c79a00" />
  </svg>
);

const hora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function ExportPowerBI({ reporte, tablas, navigate }: Props) {
  const [fase, setFase] = useState<Fase>('cerrado');
  const [listas, setListas] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (fase === 'cerrado') return;
    const onDown = (e: MouseEvent) => {
      if (fase === 'listo' && ref.current && !ref.current.contains(e.target as Node)) setFase('cerrado');
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [fase]);

  const exportar = () => {
    if (fase === 'publicando') return;
    setFase('publicando');
    setListas(0);
    tablas.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setListas(i + 1), 500 * (i + 1)));
    });
    timers.current.push(window.setTimeout(() => setFase('listo'), 500 * tablas.length + 600));
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={exportar}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium whitespace-nowrap"
        style={{ border: '1px solid #f2d36b', color: '#334155', background: '#fffdf5' }}
      >
        {fase === 'publicando' ? <Spinner size={11} /> : <PowerBIIcon />}
        Exportar en Power BI
      </button>

      {fase !== 'cerrado' && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 rounded-md text-xs"
          style={{ width: 290, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)' }}
        >
          <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-1.5 font-semibold" style={{ color: '#0f172a' }}>
              <PowerBIIcon />
              {fase === 'publicando' ? 'Publicando en Power BI…' : 'Publicado en Power BI'}
            </div>
            <div className="mt-0.5" style={{ color: '#64748b' }}>
              Reporte: <span className="font-medium" style={{ color: '#334155' }}>{reporte}</span>
            </div>
          </div>

          <div className="px-3 py-2 space-y-1.5">
            {tablas.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <span className="flex items-center justify-center" style={{ width: 14 }}>
                  {i < listas ? (
                    <span className="font-bold" style={{ color: '#15803d' }}>✓</span>
                  ) : i === listas && fase === 'publicando' ? (
                    <Spinner size={10} />
                  ) : (
                    <span className="rounded-full" style={{ width: 6, height: 6, background: '#e2e8f0' }} />
                  )}
                </span>
                <span className="font-mono" style={{ color: i < listas ? '#334155' : '#94a3b8' }}>{t}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center" style={{ width: 14 }}>
                {fase === 'listo' ? (
                  <span className="font-bold" style={{ color: '#15803d' }}>✓</span>
                ) : listas === tablas.length ? (
                  <Spinner size={10} />
                ) : (
                  <span className="rounded-full" style={{ width: 6, height: 6, background: '#e2e8f0' }} />
                )}
              </span>
              <span style={{ color: fase === 'listo' ? '#334155' : '#94a3b8' }}>Refresco del dataset</span>
            </div>
          </div>

          {fase === 'listo' && (
            <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <span style={{ color: '#94a3b8' }}>Actualizado {hora()} · Azure SQL</span>
              {navigate && (
                <button onClick={() => navigate('powerbi')} className="font-semibold hover:underline" style={{ color: '#1e40af' }}>
                  Abrir reporte →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
