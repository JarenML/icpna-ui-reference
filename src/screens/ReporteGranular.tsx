import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Screen } from '../App';
import {
  GRANULAR_PERIODO, GRANULAR_TIPO, HEATMAP_CAPACIDAD, HISTORICO_PREV,
  FOOTNOTE, formatNum,
} from '../data/constants';
import { ALERTAS_PENDIENTES } from '../data/alertas';
import { JERARQUIA_MODALIDAD, type NodoJerarquia } from '../data/granularidad';

interface Props {
  navigate: (s: Screen) => void;
}

const varPct = (base: number, meta: number) => ((meta - base) / base) * 100;
const fmtPct = (p: number) => `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;

const varColor = (p: number) => {
  if (p >= 15) return '#16a34a';
  if (p >= 5) return '#22c55e';
  if (p >= -5) return '#d97706';
  if (p >= -15) return '#f97316';
  return '#dc2626';
};

const varBg = (p: number) => {
  if (p >= 15) return '#f0fdf4';
  if (p >= 5) return '#f0fdf4';
  if (p >= -5) return '#fffbeb';
  if (p >= -15) return '#fff7ed';
  return '#fef2f2';
};

const heatColor = (v: number) => {
  if (v >= 100) return '#fef2f2';
  if (v >= 90) return '#fffbeb';
  if (v >= 75) return '#f0fdf4';
  return '#eff6ff';
};
const heatTextColor = (v: number) => {
  if (v >= 100) return '#dc2626';
  if (v >= 90) return '#d97706';
  if (v >= 75) return '#16a34a';
  return '#2563eb';
};

const medidas = ['% Utilización', '% Ocupabilidad Aula Formada', '% Ocupabilidad Cap. Instalada', 'Cant. Aulas Utilización'];

const NIVEL_JERARQUIA = ['Modalidad', 'Curso', 'Horario'];

// Flattens the tree into visible rows according to which nodes are expanded
const filasVisibles = (nodos: NodoJerarquia[], abiertos: Set<string>, nivel = 0): { nodo: NodoJerarquia; nivel: number }[] =>
  nodos.flatMap((n) => [
    { nodo: n, nivel },
    ...(n.hijos && abiertos.has(n.id) ? filasVisibles(n.hijos, abiertos, nivel + 1) : []),
  ]);

const idsConHijos = (nodos: NodoJerarquia[]): string[] =>
  nodos.flatMap((n) => (n.hijos ? [n.id, ...idsConHijos(n.hijos)] : []));

const drillLevels = [
  'Nivel 1 — Resumen General',
  'Nivel 2 — Sede',
  'Nivel 3 — Modalidad',
  'Nivel 4 — Curso',
  'Nivel 5 — Horario',
  'Nivel 6 — Periodo',
];

export default function ReporteGranular({ navigate }: Props) {
  const [drillLevel, setDrillLevel] = useState(0);
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set([JERARQUIA_MODALIDAD[0].id]));
  const toggleNodo = (id: string) =>
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const todosAbiertos = abiertos.size === idsConHijos(JERARQUIA_MODALIDAD).length;
  const [medida, setMedida] = useState(medidas[0]);
  const [histExpanded, setHistExpanded] = useState(true);
  const [filSede, setFilSede] = useState('Todas');
  const [filModalidad, setFilModalidad] = useState('Todas');
  const [filTipo, setFilTipo] = useState('Todos');

  const filterSel = (label: string, value: string, onChange: (v: string) => void, opts: string[]) => (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs font-medium" style={{ color: '#64748b', fontSize: 10 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border rounded px-2 py-1"
        style={{ border: '1px solid var(--border)', borderRadius: 4, color: '#334155', background: '#fff' }}
      >
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-5 min-w-0" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
      {/* Left filter panel */}
      <div>
        <div
          className="rounded-md p-3 space-y-3"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>Filtros</span>
            <button
              className="text-xs"
              style={{ color: '#2563eb' }}
              onClick={() => { setFilSede('Todas'); setFilModalidad('Todas'); setFilTipo('Todos'); }}
            >
              Limpiar
            </button>
          </div>
          {filterSel('Año Proyección (Base)', '2027', () => {}, ['2027', '2026'])}
          {filterSel('Año Meta ICPNA', '2027', () => {}, ['2027'])}
          {filterSel('Año Real / Histórico', '2026', () => {}, ['2026', '2025'])}
          {filterSel('Sede', filSede, setFilSede, ['Todas', 'Miraflores', 'San Miguel', 'Surco', 'San Isidro', 'La Molina', 'Jesús María'])}
          {filterSel('Modalidad', filModalidad, setFilModalidad, ['Todas', 'Presencial', 'Virtual', 'Semipresencial'])}
          {filterSel('Tipo de Alumno', filTipo, setFilTipo, ['Todos', 'Regular', 'Reingresante', 'Nuevo'])}
          {filterSel('Curso', 'Todos', () => {}, ['Todos', 'General English', 'Business English', 'Conversational'])}
          {filterSel('Horario', 'Todos', () => {}, ['Todos', 'Mañana Lun-Vie', 'Tarde Lun-Vie', 'Noche Lun-Vie', 'Mañana Sáb', 'Tarde Sáb'])}
          {filterSel('Periodo', 'Todos', () => {}, ['Todos', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10', '2027-11', '2027-12'])}
        </div>

        {/* Quick navigation */}
        <div
          className="rounded-md p-3 space-y-1.5 mt-3"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="font-semibold text-xs uppercase tracking-wide mb-2" style={{ color: '#64748b', fontSize: 10 }}>
            Navegación Rápida
          </div>
          {[
            { label: '← Vista Ejecutiva', action: () => navigate('resumen') },
            { label: 'Detalle por Sede', action: () => setDrillLevel(1) },
            { label: 'Detalle por Modalidad', action: () => setDrillLevel(2) },
            { label: 'Detalle por Curso', action: () => setDrillLevel(3) },
            { label: 'Detalle por Horario', action: () => setDrillLevel(4) },
            { label: 'Detalle por Periodo', action: () => setDrillLevel(5) },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full text-left text-xs py-1 px-2 rounded hover:bg-blue-50 transition-colors"
              style={{ color: '#334155' }}
            >
              {item.label}
            </button>
          ))}
          <button
            className="w-full text-left text-xs py-1 px-2 rounded"
            style={{ color: '#16a34a' }}
          >
            ↓ Exportar a Excel
          </button>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <button
              onClick={() => navigate('alertas')}
              className="w-full text-left text-xs py-1 px-2 rounded"
              style={{ color: '#dc2626' }}
            >
              ⚠ Alertas Activas ({ALERTAS_PENDIENTES})
            </button>
          </div>
        </div>

        {/* Key indicators panel */}
        <div
          className="rounded-md p-3 space-y-2 mt-3"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="font-semibold text-xs uppercase tracking-wide mb-2" style={{ color: '#64748b', fontSize: 10 }}>
            Indicadores Clave
          </div>
          {[
            { label: 'Crec. Meta vs Base (Mat.)', value: '+8.5%', color: '#16a34a' },
            { label: 'Crec. Meta vs Real 2026', value: '+12.3%', color: '#16a34a' },
            { label: 'Brecha de Capacidad', value: '+21 clases', color: '#dc2626' },
            { label: 'Utilización (Meta)', value: '93.4%', color: '#d97706' },
            { label: 'Alertas Activas', value: String(ALERTAS_PENDIENTES), color: '#dc2626', link: () => navigate('alertas') },
          ].map((ind, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs" style={{ color: '#64748b' }}>{ind.label}</span>
              <span
                className="font-mono font-semibold text-xs cursor-pointer"
                style={{ color: ind.color }}
                onClick={ind.link}
              >
                {ind.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-4 min-w-0">
        {/* Page title */}
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Reporte Granular</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Profundice en el efecto de cada variable sobre sede, tipo de alumno, modalidad y otras dimensiones
          </p>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Matriculados', base: 184_250, meta: 200_000 },
            { label: 'Mat. Estudiando', base: 160_010, meta: 173_690 },
            { label: 'Clases Creadas', base: 8_117, meta: 8_815 },
            { label: 'Ingresos Estimados', base: null, meta: null, baseStr: 'S/ 276.4M', metaStr: 'S/ 300.0M' },
          ].map((card) => {
            const p = card.base && card.meta ? varPct(card.base, card.meta) : 8.5;
            return (
              <div
                key={card.label}
                className="rounded-md p-3"
                style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#64748b', fontSize: 10 }}>
                  {card.label}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Base</div>
                    <div className="font-mono font-semibold text-sm" style={{ color: '#64748b' }}>
                      {card.base ? formatNum(card.base) : card.baseStr}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: varBg(p), color: varColor(p) }}
                    >
                      {fmtPct(p)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Meta</div>
                    <div className="font-mono font-semibold text-sm" style={{ color: '#1e40af' }}>
                      {card.meta ? formatNum(card.meta) : card.metaStr}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drilldown breadcrumb */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 rounded overflow-x-auto"
          style={{ background: '#fff', border: '1px solid var(--border)', flexWrap: 'nowrap' }}
        >
          {drillLevels.map((level, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
              {i > 0 && <span style={{ color: '#cbd5e1' }}>›</span>}
              <button
                onClick={() => setDrillLevel(i)}
                className="text-xs px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                style={{
                  background: drillLevel === i ? '#eff6ff' : 'transparent',
                  color: drillLevel === i ? '#1e40af' : '#94a3b8',
                  fontWeight: drillLevel === i ? 600 : 400,
                  border: drillLevel === i ? '1px solid #bfdbfe' : '1px solid transparent',
                }}
              >
                {level}
              </button>
            </div>
          ))}
        </div>

        {/* Period matrix */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Matriz Comparativa por Periodo</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Proyección Base vs Meta ICPNA — Ene a Dic 2027</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: '#64748b' }}>Periodo</th>
                  <th className="px-3 py-2 text-right font-semibold" colSpan={2} style={{ color: '#64748b', borderLeft: '2px solid #e2e8f0' }}>Matriculados</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: '#16a34a' }}></th>
                  <th className="px-3 py-2 text-right font-semibold" colSpan={2} style={{ color: '#64748b', borderLeft: '2px solid #e2e8f0' }}>Mat. Estudiando</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: '#16a34a' }}></th>
                  <th className="px-3 py-2 text-right font-semibold" colSpan={2} style={{ color: '#64748b', borderLeft: '2px solid #e2e8f0' }}>Clases Creadas</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: '#16a34a' }}></th>
                </tr>
                <tr style={{ borderBottom: '2px solid var(--border)', background: '#f8fafc' }}>
                  <th className="px-3 pb-2 text-left" style={{ color: '#94a3b8', fontWeight: 400 }}></th>
                  {['Base', 'Meta', 'Var %', 'Base', 'Meta', 'Var %', 'Base', 'Meta', 'Var %'].map((h, i) => (
                    <th key={i} className="px-3 pb-2 text-right font-semibold" style={{ color: '#64748b', fontSize: 10, borderLeft: i === 0 || i === 3 || i === 6 ? '2px solid #e2e8f0' : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRANULAR_PERIODO.map((row, i) => {
                  const isTotal = row.periodo === 'TOTAL';
                  const p1 = varPct(row.base, row.meta);
                  const p2 = varPct(row.baseEstud, row.metaEstud);
                  const p3 = varPct(row.baseClases, row.metaClases);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isTotal ? '#f8fafc' : i % 2 === 0 ? '#fff' : '#fafafa',
                        fontWeight: isTotal ? 700 : 400,
                      }}
                    >
                      <td className="px-3 py-2 font-medium" style={{ color: '#334155' }}>{row.periodo}</td>
                      <td className="px-3 py-2 font-mono text-right" style={{ color: '#64748b', borderLeft: '2px solid #f1f5f9' }}>{formatNum(row.base)}</td>
                      <td className="px-3 py-2 font-mono text-right font-medium" style={{ color: '#1e40af' }}>{formatNum(row.meta)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: varBg(p1), color: varColor(p1) }}>{fmtPct(p1)}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-right" style={{ color: '#64748b', borderLeft: '2px solid #f1f5f9' }}>{formatNum(row.baseEstud)}</td>
                      <td className="px-3 py-2 font-mono text-right font-medium" style={{ color: '#1e40af' }}>{formatNum(row.metaEstud)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: varBg(p2), color: varColor(p2) }}>{fmtPct(p2)}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-right" style={{ color: '#64748b', borderLeft: '2px solid #f1f5f9' }}>{formatNum(row.baseClases)}</td>
                      <td className="px-3 py-2 font-mono text-right font-medium" style={{ color: '#1e40af' }}>{formatNum(row.metaClases)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: varBg(p3), color: varColor(p3) }}>{fmtPct(p3)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student type matrix */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Matriz Comparativa por Tipo de Alumno</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              La retención aplica exclusivamente a alumnos <strong>Regulares</strong>. Reingresantes y Nuevos reflejan solo el efecto de las demás intervenciones.
            </div>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tipo de Alumno', 'Base (Mat.)', 'Meta (Mat.)', 'Var. Abs.', 'Var. %', 'Base (Estud.)', 'Meta (Estud.)', 'Nota'].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold" style={{ color: '#64748b', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRANULAR_TIPO.map((row, i) => {
                  const p = varPct(row.base, row.meta);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="py-2 font-semibold" style={{ color: '#0f172a' }}>{row.tipo}</td>
                      <td className="py-2 font-mono" style={{ color: '#64748b' }}>{formatNum(row.base)}</td>
                      <td className="py-2 font-mono font-medium" style={{ color: '#1e40af' }}>{formatNum(row.meta)}</td>
                      <td className="py-2 font-mono font-semibold" style={{ color: '#16a34a' }}>+{formatNum(row.varAbs)}</td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: varBg(p), color: varColor(p) }}>
                          {fmtPct(p)}
                        </span>
                      </td>
                      <td className="py-2 font-mono" style={{ color: '#64748b' }}>{formatNum(row.baseEstud)}</td>
                      <td className="py-2 font-mono font-medium" style={{ color: '#1e40af' }}>{formatNum(row.metaEstud)}</td>
                      <td className="py-2" style={{ color: '#94a3b8', maxWidth: 200 }}>{row.nota}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hierarchy matrix (Modalidad → Curso → Horario) */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Matriz Comparativa por Jerarquía</div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Modalidad → Curso → Horario · Seleccione una fila para ver su siguiente nivel · Matriculados 2027
              </div>
            </div>
            <button
              onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(idsConHijos(JERARQUIA_MODALIDAD)))}
              className="text-xs px-2.5 py-1 rounded font-medium transition-colors bg-white hover:bg-slate-50"
              style={{ border: '1px solid var(--border)', color: '#334155' }}
            >
              {todosAbiertos ? 'Contraer todo' : 'Expandir todo'}
            </button>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Modalidad / Curso / Horario', 'Proyección Base', 'Meta ICPNA', 'Meta vs Base (Abs.)', 'Meta vs Base (%)'].map((h, i) => (
                    <th
                      key={h}
                      className="pb-2 font-semibold"
                      style={{ color: '#64748b', fontSize: 10, textAlign: i === 0 ? 'left' : 'right' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasVisibles(JERARQUIA_MODALIDAD, abiertos).map(({ nodo, nivel }) => {
                  const p = varPct(nodo.base, nodo.meta);
                  const abierto = abiertos.has(nodo.id);
                  const expandible = !!nodo.hijos;
                  return (
                    <tr
                      key={nodo.id}
                      onClick={expandible ? () => toggleNodo(nodo.id) : undefined}
                      className={expandible ? 'cursor-pointer hover:bg-slate-50' : ''}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: nivel === 0 ? '#f8fafc' : undefined,
                      }}
                    >
                      <td className="py-2" style={{ paddingLeft: 4 + nivel * 22 }}>
                        <span className="inline-flex items-center gap-1.5">
                          {expandible ? (
                            <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                              className="transition-transform duration-150"
                              style={{ transform: abierto ? 'rotate(90deg)' : undefined }}
                            >
                              <path d="M9 6l6 6-6 6" />
                            </svg>
                          ) : (
                            <span style={{ width: 12 }} />
                          )}
                          <span
                            style={{
                              color: nivel === 2 ? '#475569' : '#0f172a',
                              fontWeight: nivel === 0 ? 700 : nivel === 1 ? 600 : 500,
                            }}
                          >
                            {nodo.nombre}
                          </span>
                          <span className="px-1 rounded" style={{ fontSize: 9.5, color: '#94a3b8', background: '#f1f5f9' }}>
                            {NIVEL_JERARQUIA[nivel]}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 font-mono text-right" style={{ color: '#64748b' }}>{formatNum(nodo.base)}</td>
                      <td className="py-2 font-mono text-right font-medium" style={{ color: '#1e40af' }}>{formatNum(nodo.meta)}</td>
                      <td className="py-2 font-mono text-right font-semibold" style={{ color: varColor(p) }}>
                        {nodo.meta - nodo.base >= 0 ? '+' : ''}{formatNum(nodo.meta - nodo.base)}
                      </td>
                      <td className="py-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: varBg(p), color: varColor(p) }}>{fmtPct(p)}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#eff6ff' }}>
                  <td className="py-2 pl-1 font-semibold uppercase tracking-wide" style={{ color: '#1e40af', fontSize: 10.5 }}>Total</td>
                  <td className="py-2 font-mono text-right font-bold" style={{ color: '#334155' }}>
                    {formatNum(JERARQUIA_MODALIDAD.reduce((a, n) => a + n.base, 0))}
                  </td>
                  <td className="py-2 font-mono text-right font-bold" style={{ color: '#1e40af' }}>
                    {formatNum(JERARQUIA_MODALIDAD.reduce((a, n) => a + n.meta, 0))}
                  </td>
                  <td className="py-2 font-mono text-right font-bold" style={{ color: '#1e40af' }}>
                    +{formatNum(JERARQUIA_MODALIDAD.reduce((a, n) => a + n.meta - n.base, 0))}
                  </td>
                  <td className="py-2 text-right font-mono font-bold" style={{ color: '#1e40af' }}>
                    {fmtPct(varPct(
                      JERARQUIA_MODALIDAD.reduce((a, n) => a + n.base, 0),
                      JERARQUIA_MODALIDAD.reduce((a, n) => a + n.meta, 0),
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Capacity heatmap */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Mapa de Utilización de Capacidad</div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>% Utilización por Sede × Franja Horaria — 2027</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: '#64748b' }}>Medida:</label>
              <select
                value={medida}
                onChange={(e) => setMedida(e.target.value)}
                className="text-xs border rounded px-2 py-1"
                style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
              >
                {medidas.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-2 text-left font-semibold" style={{ color: '#64748b' }}>Sede</th>
                  {['Lun-Vie Mañana', 'Lun-Vie Tarde', 'Lun-Vie Noche', 'Sáb Mañana', 'Sáb Tarde'].map((h) => (
                    <th key={h} className="pb-2 text-center font-semibold px-2" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_CAPACIDAD.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td className="py-1.5 font-medium pr-3" style={{ color: '#334155' }}>{row.sede}</td>
                    {[row.lv_man, row.lv_tar, row.lv_noc, row.sab_man, row.sab_tar].map((v, j) => (
                      <td key={j} className="py-1 px-2 text-center">
                        <span
                          className="inline-block rounded font-mono font-semibold"
                          style={{
                            background: heatColor(v),
                            color: heatTextColor(v),
                            padding: '2px 8px',
                            minWidth: 52,
                            display: 'inline-block',
                          }}
                        >
                          {v}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs" style={{ color: '#64748b' }}>Leyenda:</span>
              {[
                { label: '≥100% Restricción', bg: '#fef2f2', color: '#dc2626' },
                { label: '90–99% Alta', bg: '#fffbeb', color: '#d97706' },
                { label: '75–89% Óptima', bg: '#f0fdf4', color: '#16a34a' },
                { label: '<75% Disponible', bg: '#eff6ff', color: '#2563eb' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block rounded text-xs px-1.5 py-0.5 font-medium"
                    style={{ background: l.bg, color: l.color }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical comparison (collapsible) */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ borderBottom: histExpanded ? '1px solid var(--border)' : 'none' }}
            onClick={() => setHistExpanded(!histExpanded)}
          >
            <div className="text-left">
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>
                Comportamiento Real — Año Anterior (comparativo y validación)
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Datos reales 2026 — para validar Base y Meta vs. comportamiento histórico
              </div>
            </div>
            <span style={{ color: '#94a3b8', fontSize: 18 }}>{histExpanded ? '▲' : '▼'}</span>
          </button>
          {histExpanded && (
            <div className="p-4 grid grid-cols-3 gap-4">
              {[
                { label: 'Matriculados (Real 2026)', key: 'real' as const, color: '#64748b' },
                { label: 'Mat. Estudiando (Real 2026)', key: 'realEstud' as const, color: '#64748b' },
                { label: 'Clases Creadas (Real 2026)', key: 'realClases' as const, color: '#64748b' },
              ].map((chart) => {
                const data = HISTORICO_PREV.map((d) => ({ periodo: d.periodo, valor: d[chart.key] }));
                const total = data.reduce((a, b) => a + b.valor, 0);
                const promedio = Math.round(total / 12);
                const max = Math.max(...data.map((d) => d.valor));
                const min = Math.min(...data.map((d) => d.valor));
                return (
                  <div key={chart.label}>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#334155' }}>{chart.label}</div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => [formatNum(v), 'Real 2026']} />
                        <Line dataKey="valor" stroke={chart.color} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {[
                        { label: 'Total año', value: formatNum(total) },
                        { label: 'Prom. mensual', value: formatNum(promedio) },
                        { label: 'Máximo', value: formatNum(max) },
                        { label: 'Mínimo', value: formatNum(min) },
                      ].map((stat) => (
                        <div key={stat.label} className="px-2 py-1 rounded" style={{ background: '#f8fafc' }}>
                          <div className="text-xs" style={{ color: '#94a3b8', fontSize: 9 }}>{stat.label}</div>
                          <div className="font-mono font-semibold text-xs" style={{ color: '#334155' }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend block */}
        <div
          className="px-4 py-3 rounded text-xs space-y-1"
          style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b', lineHeight: 1.7 }}
        >
          <div className="font-semibold mb-1" style={{ color: '#334155' }}>Cómo leer las variaciones:</div>
          <div><strong>Meta vs Base</strong>: impacto de los ajustes sobre la proyección base.</div>
          <div><strong>Meta vs Real</strong>: crecimiento esperado frente al año anterior (cuando aplique).</div>
          <div><strong>Base vs Real</strong>: comportamiento esperado vs. lo realmente ocurrido.</div>
          <div className="mt-1">
            <strong>Rangos %:</strong>{' '}
            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0 4px', borderRadius: 3 }}>≥+15% crecimiento alto</span>{' · '}
            <span style={{ background: '#f0fdf4', color: '#22c55e', padding: '0 4px', borderRadius: 3 }}>+5% a +15% moderado</span>{' · '}
            <span style={{ background: '#fffbeb', color: '#d97706', padding: '0 4px', borderRadius: 3 }}>-5% a +5% sin variación</span>{' · '}
            <span style={{ background: '#fff7ed', color: '#f97316', padding: '0 4px', borderRadius: 3 }}>-15% a -5% disminución</span>{' · '}
            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0 4px', borderRadius: 3 }}>≤-15% alta</span>
          </div>
        </div>

        <div className="pt-2 pb-4">
          <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
        </div>
      </div>
    </div>
  );
}
