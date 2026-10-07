import { useState } from 'react';
import type { Screen } from '../App';
import {
  CORE, ESCENARIOS_DETALLE, FOOTNOTE, formatNum,
  type EstadoEscenario, type FactibilidadEscenario,
} from '../data/constants';

interface Props {
  navigate: (s: Screen) => void;
  openEscenario: (id: string) => void;
}

const FILAS = ESCENARIOS_DETALLE.map((e) => ({
  ...e,
  intervenciones: e.contribuciones.length,
}));

const FACT_STYLE: Record<FactibilidadEscenario, { color: string; bg: string; border: string }> = {
  'Factible': { color: '#15803d', bg: 'var(--success-bg)', border: 'var(--success-border)' },
  'Factible con restricciones': { color: '#b45309', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  'No factible': { color: '#b91c1c', bg: 'var(--danger-bg)', border: 'var(--danger-border)' },
};

const ESTADO_STYLE: Record<EstadoEscenario, { color: string; dot: string }> = {
  Activo: { color: '#1e40af', dot: '#2563eb' },
  Guardado: { color: '#334155', dot: '#94a3b8' },
  Borrador: { color: '#64748b', dot: '#cbd5e1' },
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

export default function ListaEscenarios({ navigate, openEscenario }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filEstado, setFilEstado] = useState('Todos');
  const [filFact, setFilFact] = useState('Todas');

  const filas = FILAS.filter((f) => {
    const q = busqueda.trim().toLowerCase();
    if (q && !`${f.codigo} ${f.nombreCorto} ${f.descripcion} ${f.autor}`.toLowerCase().includes(q)) return false;
    if (filEstado !== 'Todos' && f.estado !== filEstado) return false;
    if (filFact !== 'Todas' && f.factibilidad !== filFact) return false;
    return true;
  });

  const factibles = FILAS.filter((f) => f.factibilidad === 'Factible');
  const mejor = [...factibles].sort((a, b) => b.cumplimiento - a.cumplimiento)[0];

  const select = (label: string, value: string, onChange: (v: string) => void, opts: string[]) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: '#64748b' }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs px-2 py-1"
        style={{ border: '1px solid var(--border)', borderRadius: 4, color: '#334155', background: '#fff' }}
      >
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Escenarios</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Escenarios de matrícula 2027 construidos sobre el Baseline 2027.01
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('comparacion')}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
          >
            Comparar escenarios
          </button>
          <button
            onClick={() => navigate('intervenciones')}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ background: '#1e40af', color: '#fff', border: 'none' }}
          >
            + Nuevo escenario
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Escenarios registrados', value: String(FILAS.length), sub: `${FILAS.filter((f) => f.estado === 'Borrador').length} en borrador`, color: '#0f172a' },
          { label: 'Escenario activo', value: 'ESC-03', sub: 'Crecimiento Moderado · v4', color: '#1e40af' },
          { label: 'Factibles', value: `${factibles.length} / ${FILAS.length}`, sub: 'Sin restricciones de capacidad', color: '#16a34a' },
          { label: 'Mejor cumplimiento factible', value: `${mejor.cumplimiento}%`, sub: `${mejor.codigo} — ${mejor.descripcion}`, color: '#0369a1' },
        ].map((k) => (
          <Card key={k.label} style={{ padding: '14px 16px' }}>
            <div className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10.5 }}>{k.label}</div>
            <div className="font-bold font-mono" style={{ fontSize: 22, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
            <div className="text-xs mt-1 truncate" style={{ color: '#94a3b8' }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded" style={{ border: '1px solid var(--border)', width: 280 }}>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>⌕</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, nombre o autor"
              className="text-xs flex-1 outline-none bg-transparent"
              style={{ color: '#334155' }}
            />
          </div>
          <div className="flex items-center gap-4">
            {select('Estado', filEstado, setFilEstado, ['Todos', 'Activo', 'Guardado', 'Borrador'])}
            {select('Factibilidad', filFact, setFilFact, ['Todas', 'Factible', 'Factible con restricciones', 'No factible'])}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                {['Escenario', 'Versión', 'Matrículas', 'Cumplimiento', 'Brecha a Meta', 'Interv.', 'Factibilidad', 'Estado', 'Última modificación', ''].map((h, i) => (
                  <th
                    key={i}
                    className="font-semibold uppercase tracking-wide px-4 py-2.5"
                    style={{ fontSize: 10, textAlign: i >= 2 && i <= 5 ? 'right' : 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const fact = FACT_STYLE[f.factibilidad];
                const est = ESTADO_STYLE[f.estado];
                const activo = f.estado === 'Activo';
                return (
                  <tr
                    key={f.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)', background: activo ? '#f8fbff' : '#fff' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = activo ? '#f8fbff' : '#fff'; }}
                  >
                    <td className="px-4 py-3" style={{ borderLeft: `3px solid ${activo ? '#2563eb' : 'transparent'}` }}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold" style={{ color: '#1e40af' }}>{f.codigo}</span>
                        <span className="font-medium" style={{ color: '#0f172a' }}>{f.descripcion}</span>
                      </div>
                      <div className="mt-0.5" style={{ color: '#94a3b8', fontSize: 11 }}>{f.autor}</div>
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: '#334155' }}>v{f.version}</td>
                    <td className="px-4 py-3 font-mono text-right font-medium" style={{ color: '#0f172a' }}>{formatNum(f.matriculas)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono font-medium" style={{ color: f.cumplimiento >= 98 ? '#16a34a' : '#334155' }}>{f.cumplimiento}%</div>
                      <div className="ml-auto mt-1 rounded-full overflow-hidden" style={{ width: 72, height: 4, background: '#e2e8f0' }}>
                        <div style={{ width: `${Math.min(f.cumplimiento, 100)}%`, height: '100%', background: f.cumplimiento >= 98 ? '#16a34a' : '#2563eb' }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-right" style={{ color: f.brecha >= 0 ? '#16a34a' : '#d97706' }}>
                      {(f.brecha > 0 ? '+' : '') + formatNum(f.brecha).replace('-', '−')}
                    </td>
                    <td className="px-4 py-3 font-mono text-right" style={{ color: '#334155' }}>{f.intervenciones}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ background: fact.bg, color: fact.color, border: `1px solid ${fact.border}`, fontSize: 11 }}
                      >
                        {f.factibilidad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: est.color }}>
                        <span className="rounded-full" style={{ width: 6, height: 6, background: est.dot }} />
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: '#64748b' }}>{f.modificado}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEscenario(f.id)}
                        className="text-xs px-2.5 py-1 rounded font-medium transition-colors hover:bg-blue-100"
                        style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
                      >
                        Ver resultado →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center" style={{ color: '#94a3b8' }}>
                    No hay escenarios que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>
          <span>Mostrando {filas.length} de {FILAS.length} escenarios</span>
          <span>Meta ICPNA: <span className="font-mono font-medium" style={{ color: '#0f172a' }}>{formatNum(CORE.meta)}</span></span>
        </div>
      </Card>

      <p className="text-xs" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
    </div>
  );
}
