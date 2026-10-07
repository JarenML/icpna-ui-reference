import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import type { Screen } from '../App';
import {
  CORE, FOOTNOTE, ESCENARIOS_DETALLE, REF_SUPERIOR_IC, META_FACTIBLE, formatNum,
  type EscenarioDetalle, type FactibilidadEscenario,
} from '../data/constants';

interface Props {
  navigate: (s: Screen) => void;
  escenarioId: string;
}

// Convert contributions to stacked bars (invisible base + visible bar)
const buildWaterfall = (esc: EscenarioDetalle) => {
  let acc = CORE.baseline;
  return [
    { name: 'Baseline', abs: CORE.baseline, type: 'base', base: 0, bar: CORE.baseline },
    ...esc.contribuciones.map((c) => {
      const row = { name: c.name, abs: c.value, type: 'pos', base: acc, bar: c.value };
      acc += c.value;
      return row;
    }),
    { name: 'Escenario', abs: esc.matriculas, type: 'result', base: 0, bar: esc.matriculas },
  ];
};

const FACT_STYLE: Record<FactibilidadEscenario, { color: string; bg: string; border: string; icon: string }> = {
  'Factible': { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓' },
  'Factible con restricciones': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: '⚠' },
  'No factible': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: '✕' },
};

const CustomWaterfallTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 6,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12,
    }}>
      <div className="font-semibold mb-1" style={{ color: '#0f172a' }}>{label}</div>
      {d?.type === 'pos' && <div style={{ color: '#16a34a' }}>Contribución: +{d.abs.toLocaleString('es-PE')}</div>}
      {(d?.type === 'base' || d?.type === 'result') && (
        <div style={{ color: '#0f172a' }}>Total: {d.abs.toLocaleString('es-PE')}</div>
      )}
    </div>
  );
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

export default function ResultadoSimulacion({ navigate, escenarioId }: Props) {
  const esc = ESCENARIOS_DETALLE.find((e) => e.id === escenarioId) ?? ESCENARIOS_DETALLE[0];
  const waterfallData = buildWaterfall(esc);
  const aporte = esc.matriculas - CORE.baseline;
  const alertasCapacidad = esc.capacidad.filter((c) => c.requerida > c.disponible).length;
  const fact = FACT_STYLE[esc.factibilidad];
  const superaMeta = esc.brecha >= 0;
  const sobreRangoCentral = esc.matriculas > REF_SUPERIOR_IC;
  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('listaEscenarios')}
            title="Volver al listado de escenarios"
            className="group inline-flex items-center gap-2 mb-3 pl-1 pr-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-500 transition-colors duration-150 group-hover:bg-blue-600 group-hover:text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-150 group-hover:-translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
            <span>Todos los escenarios</span>
          </button>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Resultado de Simulación</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color: '#64748b' }}>
              {esc.nombreCorto} — {esc.descripcion} / Versión {esc.version}
            </span>
            {esc.estado === 'Borrador' ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#f8fafc', color: '#64748b', border: '1px solid var(--border)' }}
              >
                Borrador
              </span>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                Guardado
              </span>
            )}
            {esc.estado === 'Activo' && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
              >
                Escenario activo
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Ver trazabilidad', screen: 'trazabilidad' as Screen },
            { label: 'Ver detalle granular', screen: 'granular' as Screen },
            { label: 'Ver alertas', screen: 'alertas' as Screen },
            { label: 'Comparar escenarios', screen: 'comparacion' as Screen },
          ].map((b) => (
            <button
              key={b.label}
              onClick={() => navigate(b.screen)}
              className="text-xs px-3 py-1.5 rounded font-medium"
              style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
            >
              {b.label}
            </button>
          ))}
          <button
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ background: '#1e40af', color: '#fff', border: 'none' }}
          >
            Guardar versión
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Baseline', value: formatNum(CORE.baseline), color: '#64748b', sub: 'Solo lectura' },
          { label: 'Aporte total de intervenciones', value: `+${formatNum(aporte)}`, color: '#16a34a', sub: `${esc.contribuciones.length} iniciativas` },
          { label: esc.nombreCorto, value: formatNum(esc.matriculas), color: '#1e40af', sub: 'Resultado simulado' },
          { label: 'Meta ICPNA', value: formatNum(CORE.meta), color: '#0369a1', sub: 'Objetivo institucional' },
          superaMeta
            ? { label: 'Excedente a Meta', value: `+${formatNum(esc.brecha)}`, color: '#16a34a', sub: 'Matrículas sobre el objetivo' }
            : { label: 'Brecha restante', value: formatNum(Math.abs(esc.brecha)), color: '#d97706', sub: 'Matrículas al objetivo' },
          { label: 'Cumplimiento', value: `${esc.cumplimiento}%`, color: esc.cumplimiento >= 98 ? '#16a34a' : '#d97706', sub: 'Meta ICPNA' },
        ].map((k) => (
          <Card key={k.label} style={{ padding: '14px 16px' }}>
            <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#64748b', fontSize: 10.5 }}>
              {k.label}
            </div>
            <div className="font-bold font-mono" style={{ fontSize: 20, color: k.color, lineHeight: 1.2 }}>
              {k.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Waterfall + panels */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Waterfall */}
        <Card>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Construcción del resultado</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Waterfall de contribuciones: Baseline → Intervenciones → Escenario
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  domain={[170000, 205000]}
                />
                <Tooltip content={<CustomWaterfallTooltip />} />

                {/* Invisible base */}
                <Bar dataKey="base" stackId="a" fill="transparent" />

                {/* Visible bar */}
                <Bar dataKey="bar" stackId="a" radius={[3, 3, 0, 0]}>
                  {waterfallData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.type === 'base' ? '#64748b'
                          : d.type === 'result' ? '#1e40af'
                            : '#16a34a'
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="bar"
                    position="top"
                    formatter={(v: any) => {
                      if (v >= 100000) return `${(v / 1000).toFixed(0)}k`;
                      return `+${v.toLocaleString('es-PE')}`;
                    }}
                    style={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  />
                </Bar>

                {/* Meta reference */}
                <ReferenceLine
                  y={CORE.meta}
                  stroke="#0369a1"
                  strokeDasharray="6 3"
                  label={{ value: `Meta: ${formatNum(CORE.meta)}`, position: 'right', fontSize: 10, fill: '#0369a1' }}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Brecha callout */}
            {superaMeta ? (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded mt-3"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <span style={{ color: '#16a34a', fontSize: 20 }}>✓</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#166534' }}>
                    Supera la Meta ICPNA en +{formatNum(esc.brecha)} matrículas
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#15803d' }}>
                    El escenario alcanza el {esc.cumplimiento}% de la meta. Verifique la factibilidad operativa antes de adoptarlo.
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded mt-3"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <span style={{ color: '#d97706', fontSize: 20 }}>⟵</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#92400e' }}>
                    Brecha restante a Meta ICPNA: −{formatNum(Math.abs(esc.brecha))} matrículas
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                    El escenario alcanza el {esc.cumplimiento}% de la meta. Se requieren intervenciones adicionales o ajuste de la Meta Factible.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right panels */}
        <div className="flex flex-col gap-4">
          {/* Contexto estadístico */}
          <Card>
            <div className="px-4 pt-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Contexto Estadístico</div>
              <div
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
              >
                ⚠ Meta por encima del rango central esperado
              </div>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Baseline', value: formatNum(CORE.baseline), color: '#64748b' },
                { label: 'Ref. superior IC 95%', value: formatNum(REF_SUPERIOR_IC), color: '#93c5fd' },
                { label: esc.nombreCorto, value: formatNum(esc.matriculas), color: '#2563eb' },
                { label: 'Meta ICPNA', value: formatNum(CORE.meta), color: '#1e40af' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>{row.label}</span>
                  <span className="font-mono font-semibold text-sm" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div
                className="text-xs p-2.5 rounded mt-2"
                style={{ background: '#f8fafc', color: '#64748b', lineHeight: 1.6 }}
              >
                {sobreRangoCentral
                  ? 'El escenario supera el rango central del Baseline por efecto de las intervenciones incorporadas.'
                  : 'El escenario se mantiene dentro del rango central del Baseline pese a las intervenciones incorporadas.'}{' '}
                Este resultado es una <strong>simulación basada en reglas, supuestos y estimaciones interpretables</strong>, no una predicción de Machine Learning.
              </div>
            </div>
          </Card>

          {/* Factibilidad operativa */}
          <Card>
            <div className="px-4 pt-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Factibilidad Operativa</div>
              <div
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                style={{ background: fact.bg, color: fact.color, border: `1px solid ${fact.border}` }}
              >
                {fact.icon} {esc.factibilidad}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Alumnos estimados', value: formatNum(esc.matriculas) },
                  { label: 'Clases requeridas', value: formatNum(esc.clasesRequeridas) },
                  { label: 'Ocupabilidad prom.', value: `${esc.ocupabilidad}%`, red: esc.ocupabilidad > 100 },
                  { label: 'Alertas capacidad', value: String(alertasCapacidad), red: alertasCapacidad > 0 },
                ].map((m) => (
                  <div key={m.label} className="p-2 rounded" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="text-xs mb-0.5" style={{ color: '#94a3b8' }}>{m.label}</div>
                    <div className="font-mono font-bold text-sm" style={{ color: m.red ? '#dc2626' : '#0f172a' }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <table className="w-full text-xs mb-3">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Sede', 'Periodo', 'Disp.', 'Req.', 'Brecha', 'Estado'].map((h) => (
                      <th key={h} className="pb-1.5 text-left font-semibold" style={{ color: '#64748b', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {esc.capacidad.map((c) => {
                    const diff = c.requerida - c.disponible;
                    return {
                      sede: c.sede,
                      periodo: c.periodo,
                      disp: formatNum(c.disponible),
                      req: formatNum(c.requerida),
                      brecha: diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`,
                      estado: diff > 0 ? 'Restricción' : 'Factible',
                      red: diff > 0,
                    };
                  }).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="py-1.5 font-medium" style={{ color: '#334155' }}>{row.sede}</td>
                      <td className="py-1.5" style={{ color: '#64748b' }}>{row.periodo}</td>
                      <td className="py-1.5 font-mono text-right" style={{ color: '#64748b' }}>{row.disp}</td>
                      <td className="py-1.5 font-mono text-right" style={{ color: '#334155' }}>{row.req}</td>
                      <td className="py-1.5 font-mono text-right font-semibold" style={{ color: row.red ? '#dc2626' : '#16a34a' }}>{row.brecha}</td>
                      <td className="py-1.5">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: row.red ? '#fef2f2' : '#f0fdf4',
                            color: row.red ? '#dc2626' : '#16a34a',
                            border: `1px solid ${row.red ? '#fecaca' : '#bbf7d0'}`,
                          }}
                        >
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Meta factible callout */}
              <div
                className="px-3 py-2.5 rounded"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
              >
                <div className="text-xs font-semibold" style={{ color: '#1e40af' }}>
                  Meta Factible estimada (capacidad actual):
                </div>
                <div className="font-mono font-bold mt-0.5" style={{ color: '#1e40af', fontSize: 18 }}>
                  {formatNum(META_FACTIBLE)} matrículas
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#3b82f6' }}>
                  Distinto de la Meta ICPNA ({formatNum(CORE.meta)}). Considera restricciones operativas actuales.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="pt-2 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>
    </div>
  );
}
