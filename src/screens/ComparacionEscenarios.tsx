import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Screen } from '../App';
import {
  ESCENARIOS_DETALLE, CORE, FOOTNOTE, formatNum,
  type EscenarioDetalle, type FactibilidadEscenario,
} from '../data/constants';
import { GRANULARIDADES, desglosar, type ComparacionConfig } from '../data/granularidad';
import NuevaComparacionModal from '../components/NuevaComparacionModal';

interface Props {
  navigate: (s: Screen) => void;
  openEscenario: (id: string) => void;
}

const criterioOptions = [
  'Menor brecha a Meta manteniendo factibilidad',
  'Mayor cumplimiento de Meta',
  'Menor brecha de capacidad',
  'Mejor ocupabilidad',
] as const;
type Criterio = (typeof criterioOptions)[number];

const COMPARACION_INICIAL: ComparacionConfig = {
  nombre: 'Alternativas de crecimiento 2027',
  escenarios: ['esc01', 'esc02', 'esc04'],
  granularidad: 'general',
};

// Illustrative revenue: same average ticket as the Baseline (S/ 276.4M for 184,250)
const ingresos = (matriculas: number) => `S/ ${((276.4 * matriculas) / CORE.baseline).toFixed(1)}M`;

const brechaCapacidad = (e: EscenarioDetalle) =>
  e.capacidad.reduce((acc, c) => acc + Math.max(0, c.requerida - c.disponible), 0);

const ordenarPor = (criterio: Criterio, escenarios: EscenarioDetalle[]) => {
  const noFactibleAlFinal = (a: EscenarioDetalle, b: EscenarioDetalle) =>
    Number(a.factibilidad === 'No factible') - Number(b.factibilidad === 'No factible');
  return [...escenarios].sort((a, b) => {
    switch (criterio) {
      case 'Menor brecha a Meta manteniendo factibilidad':
        return noFactibleAlFinal(a, b) || Math.abs(a.brecha) - Math.abs(b.brecha);
      case 'Mayor cumplimiento de Meta':
        return b.cumplimiento - a.cumplimiento;
      case 'Menor brecha de capacidad':
        return brechaCapacidad(a) - brechaCapacidad(b) || b.cumplimiento - a.cumplimiento;
      case 'Mejor ocupabilidad':
        return Number(a.ocupabilidad > 100) - Number(b.ocupabilidad > 100) || b.ocupabilidad - a.ocupabilidad;
    }
  });
};

const ESTADO_RANKING: Record<FactibilidadEscenario, { label: string; color: string }> = {
  'Factible': { label: 'Factible', color: '#16a34a' },
  'Factible con restricciones': { label: 'Con restricciones', color: '#d97706' },
  'No factible': { label: 'No factible por capacidad', color: '#dc2626' },
};

// Variation convention from the spec (Reporte Granular)
const colorVariacion = (pct: number) => {
  if (pct >= 15) return { color: '#15803d', bg: '#dcfce7' };
  if (pct >= 5) return { color: '#16a34a', bg: '#f0fdf4' };
  if (pct > -5) return { color: '#b45309', bg: '#fffbeb' };
  if (pct > -15) return { color: '#c2410c', bg: '#fff7ed' };
  return { color: '#b91c1c', bg: '#fef2f2' };
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

interface Columna {
  id: string;
  nombre: string;
  tipo: 'baseline' | 'escenario' | 'meta';
  matriculas: number;
  cumplimiento: number;
  brecha: number;
  ocupabilidad: number | null;
  brechaCapacidad: number | null;
  ingresos: string;
  estado: string;
  highlight?: boolean;
}

export default function ComparacionEscenarios({ openEscenario }: Props) {
  const [criterio, setCriterio] = useState<Criterio>(criterioOptions[0]);
  const [comparacion, setComparacion] = useState<ComparacionConfig>(COMPARACION_INICIAL);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<ComparacionConfig>(COMPARACION_INICIAL);

  const escenarios = ESCENARIOS_DETALLE.filter((e) => comparacion.escenarios.includes(e.id))
    .sort((a, b) => a.nombreCorto.localeCompare(b.nombreCorto));
  const granularidad = GRANULARIDADES.find((g) => g.id === comparacion.granularidad)!;

  // "Menor brecha factible": strictly feasible scenario closest to Meta
  const mejorFactible = ordenarPor('Menor brecha a Meta manteniendo factibilidad', escenarios)
    .find((e) => e.factibilidad === 'Factible');
  const ranking = ordenarPor(criterio, escenarios);

  const columnas: Columna[] = [
    {
      id: 'baseline', nombre: 'Baseline', tipo: 'baseline', matriculas: CORE.baseline,
      cumplimiento: +((CORE.baseline / CORE.meta) * 100).toFixed(1), brecha: CORE.baseline - CORE.meta,
      ocupabilidad: 74, brechaCapacidad: 0, ingresos: ingresos(CORE.baseline), estado: 'Referencia',
    },
    ...escenarios.map((e): Columna => ({
      id: e.id, nombre: e.nombreCorto, tipo: 'escenario', matriculas: e.matriculas,
      cumplimiento: e.cumplimiento, brecha: e.brecha, ocupabilidad: e.ocupabilidad,
      brechaCapacidad: brechaCapacidad(e), ingresos: ingresos(e.matriculas),
      estado: e.id === mejorFactible?.id ? 'Mejor ajuste' : e.factibilidad === 'Factible con restricciones' ? 'Con restricciones' : e.factibilidad,
      highlight: e.id === mejorFactible?.id,
    })),
    {
      id: 'meta', nombre: 'Meta ICPNA', tipo: 'meta', matriculas: CORE.meta, cumplimiento: 100, brecha: 0,
      ocupabilidad: null, brechaCapacidad: null, ingresos: '—', estado: 'Objetivo',
    },
  ];

  const filas: { label: string; render: (c: Columna) => string; color?: (c: Columna) => string; bold?: boolean }[] = [
    { label: 'Matrículas', render: (c) => formatNum(c.matriculas), bold: true },
    { label: 'Cumplimiento Meta', render: (c) => `${c.cumplimiento}%` },
    {
      label: 'Brecha a Meta',
      render: (c) => (c.brecha === 0 ? '0' : c.brecha > 0 ? `+${formatNum(c.brecha)}` : formatNum(c.brecha).replace('-', '−')),
      color: (c) => (c.brecha >= 0 ? '#16a34a' : '#d97706'),
    },
    {
      label: 'Ocupabilidad',
      render: (c) => (c.ocupabilidad === null ? '—' : `${c.ocupabilidad}%`),
      color: (c) => (c.ocupabilidad === null ? '#64748b' : c.ocupabilidad > 100 ? '#dc2626' : c.ocupabilidad >= 85 ? '#16a34a' : '#64748b'),
    },
    {
      label: 'Brecha capacidad',
      render: (c) => (c.brechaCapacidad === null ? '—' : c.brechaCapacidad === 0 ? 'Sin brecha' : `+${c.brechaCapacidad} clases`),
      color: (c) => (c.brechaCapacidad === null ? '#64748b' : c.brechaCapacidad > 0 ? '#dc2626' : '#16a34a'),
    },
    { label: 'Ingresos estimados', render: (c) => c.ingresos },
    {
      label: 'Estado',
      render: (c) => c.estado,
      color: (c) => {
        if (c.estado === 'No factible') return '#dc2626';
        if (c.estado === 'Mejor ajuste') return '#16a34a';
        if (c.estado === 'Con restricciones') return '#d97706';
        if (c.estado === 'Objetivo') return '#1e40af';
        return '#64748b';
      },
    },
  ];

  const chartData = columnas
    .filter((c) => c.tipo !== 'meta')
    .map((c) => ({ name: c.nombre, valor: c.matriculas, highlight: c.highlight, tipo: c.tipo }));

  const desglose = desglosar(comparacion.granularidad, escenarios);
  const totalRow = {
    nombre: 'TOTAL',
    baseline: CORE.baseline,
    meta: CORE.meta,
    escenarios: Object.fromEntries(escenarios.map((e) => [e.id, e.matriculas])),
  };

  const abrirModal = (config: ComparacionConfig) => {
    setModalInitial(config);
    setModalOpen(true);
  };

  const headerColor = (c: Columna) => (c.tipo === 'meta' ? '#1e40af' : c.highlight ? '#16a34a' : '#334155');

  return (
    <div className="p-5 space-y-4 min-w-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Comparación de Escenarios</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Compare alternativas y evalúe cuáles se aproximan mejor a la Meta ICPNA
          </p>
        </div>
        <button
          onClick={() => abrirModal({ nombre: '', escenarios: [], granularidad: 'general' })}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
          style={{ color: '#fff', border: 'none' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva comparación
        </button>
      </div>

      {/* Active comparison */}
      <Card style={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>
                Comparación activa
              </span>
              <span className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{comparacion.nombre}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {columnas.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: c.tipo === 'meta' ? '#eff6ff' : c.highlight ? '#f0fdf4' : '#f1f5f9',
                    color: headerColor(c),
                    border: `1px solid ${c.tipo === 'meta' ? '#bfdbfe' : c.highlight ? '#bbf7d0' : '#e2e8f0'}`,
                  }}
                  title={c.tipo !== 'escenario' ? 'Referencia obligatoria' : undefined}
                >
                  {c.tipo !== 'escenario' && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  )}
                  {c.nombre}
                </span>
              ))}
              <span style={{ color: '#cbd5e1' }} className="mx-1">|</span>
              <span
                className="text-xs px-2.5 py-0.5 rounded font-medium"
                style={{ background: '#f8fafc', color: '#475569', border: '1px solid var(--border)' }}
              >
                Granularidad: {granularidad.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => abrirModal(comparacion)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded font-medium transition-colors bg-white hover:bg-slate-50"
            style={{ border: '1px solid var(--border)', color: '#334155' }}
          >
            Editar comparación
          </button>
        </div>
      </Card>

      {/* Comparison table */}
      <div
        style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}
      >
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Tabla comparativa de indicadores</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: '#64748b', width: 160 }}>Indicador</th>
                {columnas.map((c) => (
                  <th
                    key={c.id}
                    className="px-4 py-2.5 text-center font-semibold"
                    style={{ color: headerColor(c), background: c.highlight ? '#f0fdf4' : undefined }}
                  >
                    {c.nombre}
                    {c.highlight && (
                      <div className="text-xs font-medium mt-0.5" style={{ color: '#16a34a' }}>★ Menor brecha factible</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((row, ri) => (
                <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#475569' }}>{row.label}</td>
                  {columnas.map((c) => (
                    <td
                      key={c.id}
                      className="px-4 py-2.5 text-center font-mono"
                      style={{
                        color: row.color ? row.color(c) : row.bold ? '#0f172a' : '#334155',
                        fontWeight: row.bold ? 700 : 500,
                        background: c.highlight ? '#f0fdf4' : undefined,
                      }}
                    >
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular breakdown */}
      {comparacion.granularidad !== 'general' && (
        <Card style={{ overflow: 'hidden' }}>
          <div className="flex items-start justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Comparación por {granularidad.label}</div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Matrículas 2027 · Variación de cada escenario vs Baseline · Los totales coinciden con el nivel general
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 10 }}>
              {[
                { label: '≥ +15%', pct: 20 },
                { label: '+5 a +15%', pct: 10 },
                { label: '±5%', pct: 0 },
                { label: '−5 a −15%', pct: -10 },
                { label: '≤ −15%', pct: -20 },
              ].map((l) => {
                const c = colorVariacion(l.pct);
                return (
                  <span key={l.label} className="px-1.5 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.color }}>
                    {l.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-2.5 text-left font-semibold" style={{ color: '#64748b' }}>{granularidad.label}</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: '#334155' }}>Baseline</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: '#1e40af' }}>Meta ICPNA</th>
                  {escenarios.map((e) => (
                    <th
                      key={e.id}
                      className="px-4 py-2.5 text-right font-semibold"
                      style={{ color: e.id === mejorFactible?.id ? '#16a34a' : '#334155', background: e.id === mejorFactible?.id ? '#f0fdf4' : undefined }}
                    >
                      {e.nombreCorto}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...desglose, totalRow].map((f) => {
                  const total = f === totalRow;
                  return (
                    <tr
                      key={f.nombre}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        borderTop: total ? '1px solid var(--border)' : undefined,
                        background: total ? '#f8fafc' : '#fff',
                      }}
                    >
                      <td className="px-4 py-2" style={{ color: '#334155', fontWeight: total ? 700 : 500 }}>{f.nombre}</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: '#475569', fontWeight: total ? 700 : 500 }}>{formatNum(f.baseline)}</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: '#1e40af', fontWeight: total ? 700 : 500 }}>{formatNum(f.meta)}</td>
                      {escenarios.map((e) => {
                        const v = f.escenarios[e.id];
                        const pct = ((v - f.baseline) / f.baseline) * 100;
                        const c = colorVariacion(pct);
                        return (
                          <td
                            key={e.id}
                            className="px-4 py-2 text-right"
                            style={{ background: e.id === mejorFactible?.id ? '#f0fdf4' : undefined }}
                          >
                            <span className="font-mono" style={{ color: '#0f172a', fontWeight: total ? 700 : 500 }}>{formatNum(v)}</span>
                            <span
                              className="inline-block ml-2 px-1.5 rounded font-mono font-medium"
                              style={{ fontSize: 10, background: c.bg, color: c.color, minWidth: 46, textAlign: 'center' }}
                            >
                              {pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(1)}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {comparacion.granularidad === 'tipoAlumno' && (
            <div className="px-4 py-2.5 text-xs" style={{ borderTop: '1px solid var(--border)', color: '#64748b' }}>
              La Retención se aplica solo a alumnos Regulares; Reingresantes y Nuevos reflejan únicamente el efecto de las demás intervenciones.
            </div>
          )}
        </Card>
      )}

      {/* Chart + Ranking */}
      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Comparación de matrículas por escenario</div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  domain={[170000, 210000]}
                />
                <Tooltip
                  formatter={(v: any) => [formatNum(v) + ' mat.', 'Matrículas']}
                  labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <ReferenceLine
                  y={CORE.meta}
                  stroke="#1e40af"
                  strokeDasharray="6 3"
                  label={{ value: 'Meta ICPNA', position: 'right', fontSize: 10, fill: '#1e40af' }}
                />
                <Bar dataKey="valor" radius={[3, 3, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.tipo === 'baseline' ? '#64748b' : d.highlight ? '#16a34a' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Ranking según criterio seleccionado</div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#64748b' }}>Criterio de ordenamiento:</label>
              <select
                value={criterio}
                onChange={(e) => setCriterio(e.target.value as Criterio)}
                className="w-full text-xs border rounded px-2.5 py-1.5"
                style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
              >
                {criterioOptions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {ranking.map((e, i) => {
                const pos = i + 1;
                const est = ESTADO_RANKING[e.factibilidad];
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 px-3 py-3 rounded"
                    style={{
                      background: pos === 1 ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${pos === 1 ? '#bbf7d0' : '#f1f5f9'}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center font-bold text-sm rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        background: pos === 1 ? '#16a34a' : pos === 2 ? '#2563eb' : '#e2e8f0',
                        color: pos <= 2 ? '#fff' : '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      {pos}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>{e.nombreCorto}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        {e.cumplimiento}% · {e.descripcion}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: est.color + '18', color: est.color }}>
                      {est.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="text-xs p-3 rounded"
              style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b', lineHeight: 1.6 }}
            >
              <strong style={{ color: '#334155' }}>Nota:</strong> El ranking compara escenarios creados por el usuario.
              La Versión 1 no genera automáticamente una combinación óptima de iniciativas.
            </div>

            {ranking[0] && (
              <button
                onClick={() => openEscenario(ranking[0].id)}
                className="w-full text-sm py-2 rounded font-semibold"
                style={{ background: '#1e40af', color: '#fff', border: 'none' }}
              >
                Abrir detalle del {ranking[0].nombreCorto} →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>

      <NuevaComparacionModal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onConfirm={(config) => {
          setComparacion(config);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
