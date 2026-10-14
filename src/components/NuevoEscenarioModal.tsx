import { useEffect, useState } from 'react';
import { CORE, formatNum, type EscenarioPendiente, type EstadoEscenario } from '../data/constants';
import EstadoBadge from './EstadoBadge';

// Minimal shape needed to list existing scenarios (with or without results)
export interface EscenarioOrigen {
  id: string;
  codigo: string;
  descripcion: string;
  version: number;
  estado: EstadoEscenario;
  intervenciones: string[];
}

interface Props {
  open: boolean;
  existentes: EscenarioOrigen[];
  onClose: () => void;
  onCreate: (escenario: EscenarioPendiente) => void;
}

const RESPONSABLES = ['Gerencia Comercial', 'Planificación Académica', 'Gerencia Académica', 'Finanzas'];

const ahora = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const SectionTitle = ({ step, title, hint }: { step: number; title: string; hint?: string }) => (
  <div className="flex items-baseline justify-between mb-2.5">
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center font-semibold rounded-full"
        style={{ width: 18, height: 18, background: '#eff6ff', color: '#1e40af', fontSize: 10, border: '1px solid #bfdbfe' }}
      >
        {step}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#334155', fontSize: 10.5 }}>{title}</span>
    </div>
    {hint && <span className="text-xs" style={{ color: '#94a3b8' }}>{hint}</span>}
  </div>
);

export default function NuevoEscenarioModal({ open, existentes, onClose, onCreate }: Props) {
  const [nombre, setNombre] = useState('');
  const [origen, setOrigen] = useState<'blanco' | 'duplicar'>('blanco');
  const [origenId, setOrigenId] = useState('');
  const [responsable, setResponsable] = useState(RESPONSABLES[0]);
  const [objetivo, setObjetivo] = useState('');
  const [intentado, setIntentado] = useState(false);

  const siguienteNumero = Math.max(0, ...existentes.map((e) => Number(e.codigo.replace(/\D/g, '')) || 0)) + 1;
  const codigo = `ESC-${String(siguienteNumero).padStart(2, '0')}`;

  useEffect(() => {
    if (!open) return;
    setNombre('');
    setOrigen('blanco');
    setOrigenId(existentes[0]?.id ?? '');
    setResponsable(RESPONSABLES[0]);
    setObjetivo('');
    setIntentado(false);
  }, [open]); // reset only when the modal opens

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const nombreLimpio = nombre.trim();
  const duplicado = existentes.some((e) => e.descripcion.toLowerCase() === nombreLimpio.toLowerCase());
  const errorNombre = !nombreLimpio ? 'Ingrese un nombre para el escenario.' : duplicado ? 'Ya existe un escenario con ese nombre.' : '';
  const base = origen === 'duplicar' ? existentes.find((e) => e.id === origenId) : undefined;

  const crear = () => {
    setIntentado(true);
    if (errorNombre) return;
    onCreate({
      id: `esc${String(siguienteNumero).padStart(2, '0')}`,
      codigo,
      nombreCorto: `Escenario ${String(siguienteNumero).padStart(2, '0')}`,
      descripcion: nombreLimpio,
      version: 1,
      autor: responsable,
      modificado: ahora(),
      estado: 'Borrador',
      intervenciones: base ? [...base.intervenciones] : [],
    });
  };

  const inputStyle = { border: '1px solid var(--border)', color: '#0f172a' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-escenario-title"
        className="flex flex-col w-full"
        style={{
          maxWidth: 640,
          maxHeight: 'calc(100vh - 48px)',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.22)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 id="nuevo-escenario-title" className="font-semibold text-base" style={{ color: '#0f172a' }}>
              Nuevo escenario
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Se crea como Borrador; agregue intervenciones y ejecute la simulación para obtener resultados
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center rounded transition-colors hover:bg-slate-100"
            style={{ width: 28, height: 28, color: '#64748b' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Identificación */}
          <div>
            <SectionTitle step={1} title="Identificación" />
            <div className="grid gap-3" style={{ gridTemplateColumns: '120px 1fr' }}>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }}>Código</label>
                <div
                  className="flex items-center gap-1.5 px-3 py-2 rounded font-mono text-sm"
                  style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#1e40af' }}
                  title="Asignado automáticamente"
                >
                  {codigo}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }} htmlFor="esc-nombre">
                  Nombre del escenario <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="esc-nombre"
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') crear(); }}
                  placeholder="Ej. Crecimiento Sede Norte 2027"
                  className="w-full text-sm px-3 py-2 rounded outline-none transition-shadow focus:ring-2 focus:ring-blue-200"
                  style={{ ...inputStyle, borderColor: intentado && errorNombre ? '#fca5a5' : undefined }}
                />
                {intentado && errorNombre && (
                  <p className="text-xs mt-1" style={{ color: '#b91c1c' }}>{errorNombre}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }} htmlFor="esc-resp">Responsable</label>
                <select
                  id="esc-resp"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded bg-white"
                  style={inputStyle}
                >
                  {RESPONSABLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }}>Estado inicial</label>
                <div className="flex items-center h-[38px]">
                  <EstadoBadge estado="Borrador" />
                </div>
              </div>
            </div>
          </div>

          {/* Punto de partida */}
          <div>
            <SectionTitle step={2} title="Punto de partida" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Punto de partida">
              {[
                { id: 'blanco' as const, label: 'Escenario en blanco', desc: 'Parte del Baseline sin intervenciones' },
                { id: 'duplicar' as const, label: 'Duplicar escenario existente', desc: 'Copia las intervenciones de otro escenario' },
              ].map((o) => {
                const active = origen === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setOrigen(o.id)}
                    className={`text-left px-3 py-2.5 rounded transition-colors border ${active ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                    style={{ boxShadow: active ? '0 0 0 1px #2563eb' : undefined }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold" style={{ color: active ? '#1e40af' : '#334155' }}>{o.label}</span>
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{
                          width: 12,
                          height: 12,
                          border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                          background: active ? 'radial-gradient(circle, #2563eb 0 3px, #fff 3.5px)' : '#fff',
                        }}
                      />
                    </div>
                    <div className="mt-0.5" style={{ color: '#94a3b8', fontSize: 10.5 }}>{o.desc}</div>
                  </button>
                );
              })}
            </div>

            {origen === 'duplicar' && (
              <div className="mt-3">
                <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }} htmlFor="esc-origen">Escenario a duplicar</label>
                <select
                  id="esc-origen"
                  value={origenId}
                  onChange={(e) => setOrigenId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded bg-white"
                  style={inputStyle}
                >
                  {existentes.map((e) => (
                    <option key={e.id} value={e.id}>{e.codigo} — {e.descripcion} (v{e.version} · {e.estado})</option>
                  ))}
                </select>
                {base && (
                  <div className="mt-2 px-3 py-2 rounded text-xs" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <span style={{ color: '#64748b' }}>Se copiarán {base.intervenciones.length} intervenciones: </span>
                    <span style={{ color: '#334155' }}>{base.intervenciones.join(' · ') || '—'}</span>
                    <div className="mt-1" style={{ color: '#94a3b8' }}>Los resultados no se copian: el nuevo escenario debe simularse.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Base de cálculo */}
          <div>
            <SectionTitle step={3} title="Base de cálculo" hint="No editable" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { nombre: 'Baseline 2027.01', sub: 'Pronóstico externo · Solo lectura', valor: CORE.baseline },
                { nombre: 'Meta ICPNA', sub: 'Objetivo institucional', valor: CORE.meta },
              ].map((r) => (
                <div
                  key={r.nombre}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{ background: '#f8fafc', border: '1px solid var(--border)' }}
                >
                  <span style={{ color: '#94a3b8' }}><LockIcon /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: '#334155' }}>{r.nombre}</div>
                    <div className="text-xs" style={{ color: '#94a3b8', fontSize: 11 }}>{r.sub}</div>
                  </div>
                  <div className="font-mono text-xs font-semibold" style={{ color: '#334155' }}>{formatNum(r.valor)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }} htmlFor="esc-objetivo">
              Objetivo del escenario <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              id="esc-objetivo"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              rows={2}
              placeholder="Ej. Evaluar el impacto de abrir una sede en Lima Norte desde 2027-03"
              className="w-full text-sm px-3 py-2 rounded outline-none resize-none transition-shadow focus:ring-2 focus:ring-blue-200"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)', background: '#f8fafc', borderRadius: '0 0 8px 8px' }}
        >
          <div className="text-xs" style={{ color: '#64748b' }}>
            <span className="font-mono font-semibold" style={{ color: '#1e40af' }}>{codigo}</span>
            {' · '}v1 · {base ? `duplicado de ${base.codigo}` : 'en blanco'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3.5 py-2 rounded font-medium transition-colors bg-white hover:bg-slate-100"
              style={{ border: '1px solid var(--border)', color: '#334155' }}
            >
              Cancelar
            </button>
            <button
              onClick={crear}
              className="text-xs px-3.5 py-2 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
              style={{ color: '#fff', border: 'none' }}
            >
              Crear escenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
