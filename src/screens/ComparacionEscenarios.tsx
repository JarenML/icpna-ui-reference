import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { Screen } from '../App';
import { ESCENARIOS_COMP, CORE, FOOTNOTE, formatNum } from '../data/constants';

interface Props {
  navigate: (s: Screen) => void;
  openEscenario: (id: string) => void;
}

const criterioOptions = [
  'Menor brecha a Meta manteniendo factibilidad',
  'Mayor cumplimiento de Meta',
  'Menor brecha de capacidad',
  'Mejor ocupabilidad',
];

const ranking = [
  { pos: 1, nombre: 'Escenario B', cumplimiento: '99.1%', estado: 'Factible', color: '#16a34a' },
  { pos: 2, nombre: 'Escenario A', cumplimiento: '95.7%', estado: 'Factible', color: '#2563eb' },
  { pos: 3, nombre: 'Escenario C', cumplimiento: '100.9%', estado: 'No factible por capacidad', color: '#dc2626' },
];

const chartData = [
  { name: 'Baseline', valor: 184_250 },
  { name: 'Escenario A', valor: 191_400 },
  { name: 'Escenario B', valor: 198_100, highlight: true },
  { name: 'Escenario C', valor: 201_800 },
];

export default function ComparacionEscenarios({ openEscenario }: Props) {
  const [criterio, setCriterio] = useState(criterioOptions[0]);
  const [selected, setSelected] = useState<string[]>(['baseline', 'escA', 'escB', 'escC', 'meta']);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-5 space-y-4 min-w-0">
      <div>
        <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Comparación de Escenarios</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          Compare alternativas y evalúe cuáles se aproximan mejor a la Meta ICPNA
        </p>
      </div>

      {/* Scenario selector */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded"
        style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide mr-2" style={{ color: '#64748b', fontSize: 10 }}>
          Escenarios visibles:
        </span>
        {ESCENARIOS_COMP.map((esc) => (
          <button
            key={esc.id}
            onClick={() => toggle(esc.id)}
            className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
            style={{
              background: selected.includes(esc.id) ? (esc.id === 'meta' ? '#eff6ff' : esc.highlight ? '#f0fdf4' : '#f1f5f9') : '#f8fafc',
              color: selected.includes(esc.id) ? (esc.id === 'meta' ? '#1e40af' : esc.highlight ? '#16a34a' : '#334155') : '#94a3b8',
              border: `1px solid ${selected.includes(esc.id) ? (esc.id === 'meta' ? '#bfdbfe' : esc.highlight ? '#bbf7d0' : '#e2e8f0') : '#e2e8f0'}`,
            }}
          >
            {esc.nombre}
          </button>
        ))}
      </div>

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
                {ESCENARIOS_COMP.filter((e) => selected.includes(e.id)).map((esc) => (
                  <th
                    key={esc.id}
                    className="px-4 py-2.5 text-center font-semibold"
                    style={{
                      color: esc.id === 'meta' ? '#1e40af' : esc.highlight ? '#16a34a' : '#334155',
                      background: esc.highlight ? '#f0fdf4' : undefined,
                    }}
                  >
                    {esc.nombre}
                    {esc.highlight && (
                      <div className="text-xs font-medium mt-0.5" style={{ color: '#16a34a' }}>★ Menor brecha factible</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Matrículas',
                  key: 'matriculas',
                  format: (v: any) => v ? formatNum(v) : '—',
                  bold: true,
                },
                {
                  label: 'Cumplimiento Meta',
                  key: 'cumplimiento',
                  format: (v: any) => v ? `${v}%` : '—',
                },
                {
                  label: 'Brecha a Meta',
                  key: 'brecha',
                  format: (v: any) => {
                    if (v === null || v === undefined) return '—';
                    return v === 0 ? '0' : v > 0 ? `+${formatNum(v)}` : `${formatNum(v).replace('-', '−')}`;
                  },
                  colorFn: (v: any) => v === null ? '#64748b' : v > 0 ? '#dc2626' : v === 0 ? '#16a34a' : '#d97706',
                },
                {
                  label: 'Ocupabilidad',
                  key: 'ocupabilidad',
                  format: (v: any) => v ? `${v}%` : '—',
                  colorFn: (v: any) => v > 100 ? '#dc2626' : v >= 85 ? '#16a34a' : '#64748b',
                },
                {
                  label: 'Brecha capacidad',
                  key: 'brechaCapacidad',
                  format: (v: any) => v === null ? '—' : v === 0 ? 'Sin brecha' : `+${v} clases`,
                  colorFn: (v: any) => v > 0 ? '#dc2626' : '#16a34a',
                },
                {
                  label: 'Ingresos estimados',
                  format: (v: any, esc: any) => {
                    if (!esc || esc.id === 'meta') return '—';
                    const vals: Record<string, string> = {
                      baseline: 'S/ 276.4M',
                      escA: 'S/ 287.1M',
                      escB: 'S/ 297.2M',
                      escC: 'S/ 302.7M',
                    };
                    return vals[esc.id] || '—';
                  },
                },
                {
                  label: 'Estado',
                  key: 'estado',
                  format: (v: any) => v,
                  colorFn: (v: any) => {
                    if (v === 'No factible') return '#dc2626';
                    if (v === 'Mejor ajuste') return '#16a34a';
                    if (v === 'Objetivo') return '#1e40af';
                    return '#64748b';
                  },
                },
              ].map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: ri % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#475569' }}>{row.label}</td>
                  {ESCENARIOS_COMP.filter((e) => selected.includes(e.id)).map((esc) => {
                    const rawVal = row.key ? (esc as any)[row.key] : null;
                    const displayVal = row.format(rawVal, esc);
                    const color = row.colorFn ? row.colorFn(rawVal) : (row.bold ? '#0f172a' : '#334155');
                    return (
                      <td
                        key={esc.id}
                        className="px-4 py-2.5 text-center font-mono"
                        style={{
                          color,
                          fontWeight: row.bold ? 700 : 500,
                          background: esc.highlight ? '#f0fdf4' : undefined,
                        }}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart + Ranking */}
      <div className="grid grid-cols-2 gap-4">
        {/* Comparison chart */}
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
                    <Cell key={i} fill={d.highlight ? '#16a34a' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking panel */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Ranking según criterio seleccionado</div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#64748b' }}>Criterio de ordenamiento:</label>
              <select
                value={criterio}
                onChange={(e) => setCriterio(e.target.value)}
                className="w-full text-xs border rounded px-2.5 py-1.5"
                style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
              >
                {criterioOptions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {ranking.map((r) => (
                <div
                  key={r.pos}
                  className="flex items-center gap-3 px-3 py-3 rounded"
                  style={{
                    background: r.pos === 1 ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${r.pos === 1 ? '#bbf7d0' : '#f1f5f9'}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center font-bold text-sm rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      background: r.pos === 1 ? '#16a34a' : r.pos === 2 ? '#2563eb' : '#e2e8f0',
                      color: r.pos <= 2 ? '#fff' : '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    {r.pos}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>{r.nombre}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {r.cumplimiento} · {r.estado}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: r.color + '18', color: r.color }}
                  >
                    {r.estado}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="text-xs p-3 rounded"
              style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b', lineHeight: 1.6 }}
            >
              <strong style={{ color: '#334155' }}>Nota:</strong> El ranking compara escenarios creados por el usuario.
              La Versión 1 no genera automáticamente una combinación óptima de iniciativas.
            </div>

            <button
              onClick={() => openEscenario('escB')}
              className="w-full text-sm py-2 rounded font-semibold"
              style={{ background: '#1e40af', color: '#fff', border: 'none' }}
            >
              Abrir detalle del Escenario B →
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>
    </div>
  );
}
