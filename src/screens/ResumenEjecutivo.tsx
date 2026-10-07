import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, Area, ComposedChart, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import type { Screen } from '../App';
import {
  CORE, MENSUAL, TOP_COMBINACIONES, FOOTNOTE, ESCENARIOS_DETALLE, formatNum, formatPct,
} from '../data/constants';

type Tono = 'ok' | 'warn' | 'error';

const TONOS: Record<Tono, { color: string; bg: string }> = {
  ok: { color: '#16a34a', bg: '#f0fdf4' },
  warn: { color: '#d97706', bg: '#fffbeb' },
  error: { color: '#dc2626', bg: '#fef2f2' },
};

const ESCENARIOS = ESCENARIOS_DETALLE.map((e) => {
  const restricciones = e.capacidad.filter((c) => c.requerida > c.disponible).length;
  const factibilidad = {
    'Factible': { valor: 'Factible', sub: `Ocupabilidad ${e.ocupabilidad}%`, badge: 'Sin restricciones', tono: 'ok' as Tono },
    'Factible con restricciones': { valor: 'Con obs.', sub: `${restricciones} sedes con restricciones`, badge: 'Revisar capacidad', tono: 'warn' as Tono },
    'No factible': { valor: 'No factible', sub: `Ocupabilidad ${e.ocupabilidad}%`, badge: 'Excede capacidad', tono: 'error' as Tono },
  }[e.factibilidad];
  return {
    id: e.id,
    label: `${e.codigo.replace('ESC-', 'Esc. ')} — ${e.descripcion}`,
    nombre: e.nombreCorto,
    matriculas: e.matriculas,
    cumplimiento: e.cumplimiento,
    brecha: e.brecha,
    factibilidad: factibilidad.valor,
    factibilidadSub: factibilidad.sub,
    factibilidadBadge: factibilidad.badge,
    factibilidadTono: factibilidad.tono,
  };
});
const ESCENARIO_ACTIVO = ESCENARIOS.find((e) => e.id === 'esc03')!;

const Card = ({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={className}
    style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 6,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
    <div>
      <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>{title}</div>
      {subtitle && <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</div>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const KpiCard = ({
  label, value, sub, color, bgColor, badge,
}: {
  label: string; value: string; sub?: string; color?: string; bgColor?: string; badge?: string;
}) => (
  <Card style={{ padding: '14px 16px' }}>
    <div className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10.5 }}>
      {label}
    </div>
    <div className="font-bold font-mono" style={{ fontSize: 22, color: color || '#0f172a', lineHeight: 1.2 }}>
      {value}
    </div>
    {sub && (
      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{sub}</div>
    )}
    {badge && (
      <div
        className="inline-block text-xs font-medium mt-1 px-2 py-0.5 rounded-full"
        style={{ background: bgColor || '#f0fdf4', color: color || '#16a34a', fontSize: 11 }}
      >
        {badge}
      </div>
    )}
  </Card>
);

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 12,
        minWidth: 200,
      }}
    >
      <div className="font-semibold mb-2" style={{ color: '#0f172a' }}>{label} 2027</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color || '#64748b' }}>{p.name}</span>
          <span className="font-mono font-medium" style={{ color: '#0f172a' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString('es-PE') : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const contributions = [
  { name: 'Mejora de retención', value: 5_100, pct: 2.8, tipo: 'Positivo' },
  { name: 'Campaña comercial', value: 4_200, pct: 2.3, tipo: 'Positivo' },
  { name: 'Nuevos horarios', value: 2_400, pct: 1.3, tipo: 'Positivo' },
  { name: 'Ajuste de precio / mix', value: 890, pct: 0.5, tipo: 'Positivo' },
];

interface Props {
  navigate: (s: Screen) => void;
}

export default function ResumenEjecutivo({ navigate }: Props) {
  const [filPeriodo, setFilPeriodo] = useState('Todos');
  const [filModalidad, setFilModalidad] = useState('Todas');
  const [filSede, setFilSede] = useState('Todas');
  const [filEscenario, setFilEscenario] = useState<string>(ESCENARIO_ACTIVO.label);

  const esc = ESCENARIOS.find((e) => e.label === filEscenario) ?? ESCENARIO_ACTIVO;
  const cumplimientoTono: Tono = esc.cumplimiento >= 98 ? 'ok' : 'warn';
  const brechaTono: Tono = esc.brecha >= 0 ? 'ok' : 'warn';
  const factor = esc.matriculas / CORE.escenario;
  const mensual = MENSUAL.map((m) => ({
    ...m,
    escenario: Math.round(m.escenario * factor),
    icSup: Math.round(m.icSup * factor),
    icInf: Math.round(m.icInf * factor),
  }));

  const filterSelect = (label: string, value: string, onChange: (v: string) => void, opts: string[]) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: '#64748b' }}>{label}:</span>
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
    <div className="p-5 space-y-4 min-w-0">
      {/* Page title */}
      <div>
        <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Planificación de Matrícula 2027</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          Resumen consolidado de Baseline, Meta y escenario seleccionado
        </p>
      </div>

      {/* Global filters */}
      <Card style={{ padding: '10px 16px' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>
            Filtros globales
          </span>
          <div
            className="text-xs font-medium px-2.5 py-1 rounded"
            style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
          >
            Año: 2027
          </div>
          {filterSelect('Periodo', filPeriodo, setFilPeriodo, ['Todos', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06'])}
          {filterSelect('Modalidad', filModalidad, setFilModalidad, ['Todas', 'Presencial', 'Virtual', 'Semipresencial'])}
          {filterSelect('Sede', filSede, setFilSede, ['Todas', 'Miraflores', 'San Miguel', 'Surco', 'San Isidro', 'La Molina'])}
          {filterSelect('Programa', 'Todos', () => {}, ['Todos', 'General English', 'Business English', 'Conversational'])}
          {filterSelect('Escenario', filEscenario, setFilEscenario, ESCENARIOS.map((e) => e.label))}
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Baseline" value={formatNum(CORE.baseline)} sub="Solo lectura · Externo" />
        <KpiCard
          label="Meta ICPNA"
          value={formatNum(CORE.meta)}
          sub="Objetivo institucional"
          color="#1e40af"
          bgColor="#eff6ff"
        />
        <KpiCard
          label="Escenario seleccionado"
          value={formatNum(esc.matriculas)}
          sub={esc.label}
          color="#0369a1"
        />
        <KpiCard
          label="Cumplimiento de Meta"
          value={`${esc.cumplimiento}%`}
          sub="vs Meta ICPNA"
          color={TONOS[cumplimientoTono].color}
          badge={esc.cumplimiento >= 100 ? 'Meta alcanzada' : esc.cumplimiento >= 98 ? 'Cercano a Meta' : 'Por debajo de Meta'}
          bgColor={TONOS[cumplimientoTono].bg}
        />
        <KpiCard
          label="Brecha a Meta"
          value={(esc.brecha > 0 ? '+' : '') + formatNum(esc.brecha).replace('-', '−') + ' mat.'}
          sub={esc.brecha >= 0 ? 'Matrículas sobre meta' : 'Matrículas faltantes'}
          color={TONOS[brechaTono].color}
          badge={esc.brecha >= 0 ? 'Supera la meta' : 'Con observaciones'}
          bgColor={TONOS[brechaTono].bg}
        />
        <KpiCard
          label="Factibilidad Operativa"
          value={esc.factibilidad}
          sub={esc.factibilidadSub}
          color={TONOS[esc.factibilidadTono].color}
          badge={esc.factibilidadBadge}
          bgColor={TONOS[esc.factibilidadTono].bg}
        />
      </div>

      {/* Main chart + Summary panel */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Left column: chart + breakdown cards */}
        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <CardHeader
              title="Evolución de Matrículas — Baseline vs Escenario vs Meta vs Capacidad"
              subtitle="Valores mensuales 2027 · Banda de confianza al 95%"
            />
            <div className="p-4 pb-2">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={mensual}margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    domain={[9000, 21000]}
                  />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

                  {/* IC band */}
                  <Area
                    dataKey="icSup"
                    name="Límite Superior (IC 95%)"
                    fill="#dbeafe"
                    stroke="#93c5fd"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    fillOpacity={0.35}
                  />
                  <Area
                    dataKey="icInf"
                    name="Límite Inferior (IC 95%)"
                    fill="#fff"
                    stroke="#93c5fd"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    fillOpacity={0}
                  />

                  {/* Punto de Equilibrio */}
                  <ReferenceLine
                    y={11000}
                    stroke="#94a3b8"
                    strokeDasharray="2 4"
                    label={{ value: 'Punto Equilibrio', position: 'right', fontSize: 10, fill: '#94a3b8' }}
                  />

                  <Line
                    dataKey="baseline"
                    name="Baseline"
                    stroke="#64748b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    dataKey="capacidad"
                    name="Capacidad Disponible"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    dot={false}
                  />
                  <Line
                    dataKey="escenario"
                    name={esc.nombre}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    dataKey="meta"
                    name="Meta ICPNA"
                    stroke="#16a34a"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Alert flags */}
              <div className="flex gap-2 mt-2 flex-wrap">
                <div
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded"
                  style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}
                >
                  <span>⚠</span>
                  <span>Mar: Meta excede IC Superior — plausibilidad estadística</span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
                >
                  <span>🔴</span>
                  <span>Mar: Meta excede Capacidad Disponible — restricción real</span>
                </div>
                <button
                  onClick={() => navigate('alertas')}
                  className="text-xs px-2.5 py-1 rounded underline"
                  style={{ color: '#2563eb' }}
                >
                  Ver Reporte de Alertas →
                </button>
              </div>
            </div>
          </Card>

          {/* Contributions + Capacity + Top combinations */}
          <div className="grid grid-cols-3 gap-4">
            {/* Contribution chart */}
            <Card className="col-span-1">
              <CardHeader title="Aporte estimado por iniciativa" subtitle="Contribución al Escenario 03 vs Baseline" />
              <div className="p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={contributions} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `+${(v / 1000).toFixed(1)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155' }} width={130} />
                    <Tooltip formatter={(v: any) => [`+${v.toLocaleString('es-PE')} mat.`, 'Contribución']} />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]} fill="#2563eb">
                      {contributions.map((_, i) => (
                        <Cell key={i} fill={['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'][i]} />
                      ))}
                      <LabelList
                        dataKey="pct"
                        position="right"
                        formatter={(v: any) => `+${v}%`}
                        style={{ fontSize: 10, fill: '#16a34a', fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Dónde más crece */}
            <Card>
              <CardHeader
                title="Dónde más crece (Top 5 combinaciones)"
                action={
                  <button
                    onClick={() => navigate('granular')}
                    className="text-xs underline"
                    style={{ color: '#2563eb' }}
                  >
                    Ver detalle granular →
                  </button>
                }
              />
              <div className="p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Sede — Modalidad — Curso — Horario', 'Var. Mat.', 'Var. %'].map((h) => (
                        <th key={h} className="pb-1.5 text-left font-semibold" style={{ color: '#64748b', fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_COMBINACIONES.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td className="py-1.5 pr-2" style={{ color: '#334155', fontSize: 11 }}>{row.combo}</td>
                        <td className="py-1.5 font-mono text-right font-medium" style={{ color: '#16a34a' }}>
                          +{row.varAbs.toLocaleString('es-PE')}
                        </td>
                        <td className="py-1.5 font-mono text-right font-semibold" style={{ color: '#16a34a' }}>
                          {formatPct(row.varPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Estado de capacidad */}
            <Card>
              <CardHeader title="Estado de Capacidad" />
              <div className="p-4 space-y-3">
                {[
                  { label: 'Ocupabilidad promedio', value: '89%', color: '#16a34a' },
                  { label: 'Sedes sin restricción', value: '14', color: '#0f172a' },
                  { label: 'Sedes con observaciones', value: '2', color: '#d97706' },
                  { label: 'Brecha máxima detectada', value: '14 clases', color: '#dc2626' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#64748b' }}>{item.label}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
                <div
                  className="flex gap-2 p-2.5 rounded text-xs mt-2"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                >
                  <span style={{ color: '#d97706' }}>⚠</span>
                  <span style={{ color: '#92400e' }}>Existen restricciones de capacidad en determinadas combinaciones de sede y periodo.</span>
                </div>
                <button
                  onClick={() => navigate('escenarios')}
                  className="w-full text-sm font-semibold py-2 rounded mt-1 transition-colors"
                  style={{ background: '#1e40af', color: '#fff', border: 'none' }}
                >
                  Ver detalle del escenario →
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Right panels (soft vertical divider from the main content) */}
        <div className="flex flex-col gap-3 pl-4" style={{ borderLeft: '1px solid #e2e8f0' }}>
          {/* Resumen consolidado */}
          <Card>
            <CardHeader title="Resumen Consolidado" />
            <div className="p-3">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Concepto', 'Base', 'Meta', 'Var. Abs.', 'Var. %'].map((h) => (
                      <th key={h} className="pb-1.5 text-left font-semibold" style={{ color: '#64748b', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { c: 'Matriculados', base: '184,250', meta: '200,000', abs: '+15,750', pct: '+8.5%', pctColor: '#16a34a' },
                    { c: 'Mat. Estudiando', base: '160,010', meta: '173,690', abs: '+13,680', pct: '+8.5%', pctColor: '#16a34a' },
                    { c: 'Clases Creadas', base: '8,117', meta: '8,815', abs: '+698', pct: '+8.6%', pctColor: '#16a34a' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="py-2 font-medium" style={{ color: '#334155' }}>{row.c}</td>
                      <td className="py-2 font-mono text-right" style={{ color: '#64748b' }}>{row.base}</td>
                      <td className="py-2 font-mono text-right font-medium" style={{ color: '#1e40af' }}>{row.meta}</td>
                      <td className="py-2 font-mono text-right" style={{ color: '#16a34a' }}>{row.abs}</td>
                      <td className="py-2 font-mono text-right font-semibold" style={{ color: row.pctColor }}>{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Estado de Factibilidad */}
          <Card>
            <CardHeader title="Estado de Factibilidad" />
            <div className="p-3 space-y-2">
              {[
                { ok: false, text: 'La Meta ICPNA excede el límite superior del IC en determinados periodos.' },
                { ok: false, text: 'La Meta ICPNA excede la Capacidad Disponible en determinados periodos.' },
                { ok: true, text: 'No se requiere ajustar capacidad en el resto del horizonte.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span style={{ color: item.ok ? '#16a34a' : '#d97706', flexShrink: 0, marginTop: 1 }}>
                    {item.ok ? '✓' : '⚠'}
                  </span>
                  <span style={{ color: '#334155' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Referencias */}
          <Card className="flex-1 flex flex-col">
            <CardHeader title="Referencias Importantes" />
            <div className="flex-1 flex flex-col justify-evenly gap-1.5 p-3">
              {[
                { term: 'IC 95%', def: 'Banda estadística basada en el comportamiento histórico.' },
                { term: 'Proyección Base', def: 'Lo que estadísticamente se espera que ocurra.' },
                { term: 'Meta ICPNA', def: 'Lo que la institución desea alcanzar con intervenciones.' },
                { term: 'Capacidad Disponible', def: 'Máximo de alumnos con la infraestructura actual.' },
                { term: 'Punto de Equilibrio', def: 'Mínimo de alumnos por clase para justificar su apertura.' },
              ].map((ref, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold" style={{ color: '#1e40af' }}>{ref.term}:</span>{' '}
                  <span style={{ color: '#64748b' }}>{ref.def}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Footnote />
    </div>
  );
}

function Footnote() {
  return (
    <div className="pt-2 pb-4">
      <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
    </div>
  );
}
