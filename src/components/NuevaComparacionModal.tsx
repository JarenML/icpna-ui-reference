import { useEffect, useState } from 'react';
import { CORE, ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES, formatNum, type FactibilidadEscenario } from '../data/constants';
import EstadoBadge from './EstadoBadge';
import { GRANULARIDADES, type ComparacionConfig, type Granularidad } from '../data/granularidad';

interface Props {
  open: boolean;
  initial: ComparacionConfig;
  onClose: () => void;
  onConfirm: (config: ComparacionConfig) => void;
}

const FACT_STYLE: Record<FactibilidadEscenario, { color: string; bg: string; border: string }> = {
  'Factible': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  'Factible con restricciones': { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'No factible': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const Checkbox = ({ checked, locked }: { checked: boolean; locked?: boolean }) => (
  <span
    className="flex items-center justify-center flex-shrink-0 rounded transition-colors"
    style={{
      width: 16,
      height: 16,
      background: checked ? (locked ? '#94a3b8' : '#1e40af') : '#fff',
      border: `1.5px solid ${checked ? (locked ? '#94a3b8' : '#1e40af') : '#cbd5e1'}`,
      color: '#fff',
    }}
  >
    {checked && <CheckIcon />}
  </span>
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

export default function NuevaComparacionModal({ open, initial, onClose, onConfirm }: Props) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [seleccion, setSeleccion] = useState<string[]>(initial.escenarios);
  const [granularidad, setGranularidad] = useState<Granularidad>(initial.granularidad);
  const [intentado, setIntentado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(initial.nombre);
    setSeleccion(initial.escenarios);
    setGranularidad(initial.granularidad);
    setIntentado(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (id: string) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const todos = seleccion.length === ESCENARIOS_DETALLE.length;
  const sinSeleccion = seleccion.length === 0;
  const granularidadLabel = GRANULARIDADES.find((g) => g.id === granularidad)!.label;

  const confirmar = () => {
    setIntentado(true);
    if (sinSeleccion) return;
    // Keep the list order so columns are stable regardless of click order
    const escenarios = ESCENARIOS_DETALLE.filter((e) => seleccion.includes(e.id)).map((e) => e.id);
    onConfirm({ nombre: nombre.trim() || 'Comparación sin título', escenarios, granularidad });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-comparacion-title"
        className="flex flex-col w-full"
        style={{
          maxWidth: 760,
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
            <h2 id="nueva-comparacion-title" className="font-semibold text-base" style={{ color: '#0f172a' }}>
              Nueva comparación de escenarios
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Seleccione los escenarios a comparar y el nivel de granularidad del análisis
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
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#475569' }} htmlFor="comp-nombre">
              Nombre de la comparación
            </label>
            <input
              id="comp-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Alternativas de crecimiento 2027"
              className="w-full text-sm px-3 py-2 rounded outline-none transition-shadow focus:ring-2 focus:ring-blue-200"
              style={{ border: '1px solid var(--border)', color: '#0f172a' }}
            />
          </div>

          {/* Referencias obligatorias */}
          <div>
            <SectionTitle step={1} title="Referencias obligatorias" hint="Se incluyen en toda comparación" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { nombre: 'Baseline 2027.01', sub: 'Pronóstico externo · Solo lectura', valor: CORE.baseline },
                { nombre: 'Meta ICPNA', sub: 'Objetivo institucional', valor: CORE.meta },
              ].map((r) => (
                <div
                  key={r.nombre}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{ background: '#f8fafc', border: '1px solid var(--border)' }}
                  title="Referencia obligatoria: no puede excluirse de la comparación"
                >
                  <Checkbox checked locked />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: '#334155' }}>{r.nombre}</div>
                    <div className="text-xs" style={{ color: '#94a3b8', fontSize: 11 }}>{r.sub}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold" style={{ color: '#334155' }}>{formatNum(r.valor)}</div>
                    <div className="inline-flex items-center gap-1 mt-0.5" style={{ color: '#64748b', fontSize: 10 }}>
                      <LockIcon /> Obligatorio
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escenarios */}
          <div>
            <SectionTitle step={2} title="Escenarios a comparar" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#64748b' }}>
                <span className="font-semibold" style={{ color: '#0f172a' }}>{seleccion.length}</span> de {ESCENARIOS_DETALLE.length} con resultados seleccionados
              </span>
              <button
                onClick={() => setSeleccion(todos ? [] : ESCENARIOS_DETALLE.map((e) => e.id))}
                className="text-xs font-medium hover:underline"
                style={{ color: '#1e40af' }}
              >
                {todos ? 'Quitar selección' : 'Seleccionar todos'}
              </button>
            </div>
            <div
              className="rounded overflow-hidden"
              style={{ border: `1px solid ${intentado && sinSeleccion ? '#fecaca' : 'var(--border)'}` }}
            >
              {ESCENARIOS_DETALLE.map((e, i) => {
                const checked = seleccion.includes(e.id);
                const fact = FACT_STYLE[e.factibilidad];
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggle(e.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${checked ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                    }}
                  >
                    <Checkbox checked={checked} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold" style={{ color: '#1e40af' }}>{e.codigo}</span>
                        <span className="text-xs font-medium truncate" style={{ color: '#0f172a' }}>{e.descripcion}</span>
                        <span className="text-xs" style={{ color: '#94a3b8', fontSize: 11 }}>v{e.version}</span>
                        <EstadoBadge estado={e.estado} compact />
                      </div>
                    </div>
                    <div className="font-mono text-xs text-right" style={{ color: '#0f172a', width: 64 }}>{formatNum(e.matriculas)}</div>
                    <div className="font-mono text-xs text-right" style={{ color: '#64748b', width: 48 }}>{e.cumplimiento}%</div>
                    <span
                      className="px-2 py-0.5 rounded-full font-medium whitespace-nowrap text-center"
                      style={{ fontSize: 10.5, width: 150, background: fact.bg, color: fact.color, border: `1px solid ${fact.border}` }}
                    >
                      {e.factibilidad}
                    </span>
                  </button>
                );
              })}
              {ESCENARIOS_PENDIENTES.map((e) => (
                <div
                  key={e.id}
                  aria-disabled="true"
                  title="Solo se pueden comparar escenarios con resultados"
                  className="w-full flex items-center gap-3 px-3 py-2.5 cursor-not-allowed"
                  style={{ borderTop: '1px solid #f1f5f9', background: '#fcfcfd' }}
                >
                  <span
                    className="flex-shrink-0 rounded"
                    style={{ width: 16, height: 16, background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold" style={{ color: '#94a3b8' }}>{e.codigo}</span>
                      <span className="text-xs font-medium truncate" style={{ color: '#94a3b8' }}>{e.descripcion}</span>
                      <span className="text-xs" style={{ color: '#cbd5e1', fontSize: 11 }}>v{e.version}</span>
                      <EstadoBadge estado={e.estado} compact />
                    </div>
                  </div>
                  <span className="text-xs text-right" style={{ color: '#94a3b8', width: 278 }}>
                    {e.estado === 'En proceso' ? 'Disponible al finalizar la simulación' : 'Sin resultados · requiere simulación'}
                  </span>
                </div>
              ))}
            </div>
            {intentado && sinSeleccion && (
              <p className="text-xs mt-1.5" style={{ color: '#b91c1c' }}>Seleccione al menos un escenario para comparar.</p>
            )}
          </div>

          {/* Granularidad */}
          <div>
            <SectionTitle step={3} title="Granularidad del análisis" hint="Año/Periodo → Modalidad → Programa → Sede → Tipo de Alumno → Curso → Horario" />
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Granularidad">
              {GRANULARIDADES.map((g) => {
                const active = granularidad === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setGranularidad(g.id)}
                    className={`text-left px-3 py-2.5 rounded transition-colors border ${active ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                    style={{
                      boxShadow: active ? '0 0 0 1px #2563eb' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold" style={{ color: active ? '#1e40af' : '#334155' }}>{g.label}</span>
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
                    <div className="mt-0.5 leading-snug" style={{ color: '#94a3b8', fontSize: 10.5 }}>{g.descripcion}</div>
                  </button>
                );
              })}
            </div>
            {granularidad === 'tipoAlumno' && (
              <div
                className="text-xs mt-2 px-3 py-2 rounded"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', lineHeight: 1.5 }}
              >
                La intervención de Retención se aplica solo a alumnos Regulares; Reingresantes y Nuevos reflejan únicamente el efecto de las demás intervenciones.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)', background: '#f8fafc', borderRadius: '0 0 8px 8px' }}
        >
          <div className="text-xs" style={{ color: '#64748b' }}>
            {sinSeleccion ? (
              'Ningún escenario seleccionado'
            ) : (
              <>
                Baseline + Meta ICPNA + <span className="font-semibold" style={{ color: '#0f172a' }}>{seleccion.length} escenario{seleccion.length > 1 ? 's' : ''}</span>
                {' · '}por <span className="font-semibold" style={{ color: '#0f172a' }}>{granularidadLabel}</span>
              </>
            )}
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
              onClick={confirmar}
              className="text-xs px-3.5 py-2 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
              style={{ color: '#fff', border: 'none', opacity: sinSeleccion ? 0.6 : 1 }}
            >
              Crear comparación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
