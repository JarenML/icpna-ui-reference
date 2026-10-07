import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import type { Screen } from '../App';
import { CORE, FOOTNOTE, formatNum } from '../data/constants';

interface Props {
  navigate: (s: Screen) => void;
}

// Waterfall data
const waterfallRaw = [
  { name: 'Baseline', abs: CORE.baseline, type: 'base' },
  { name: 'Retención', abs: CORE.retencion, type: 'pos' },
  { name: 'Campaña Comercial', abs: CORE.campana, type: 'pos' },
  { name: 'Nuevos Horarios', abs: CORE.horarios, type: 'pos' },
  { name: 'Precio / Mix', abs: CORE.precioMix, type: 'pos' },
  { name: 'Escenario', abs: CORE.escenario, type: 'result' },
];

// Convert to stacked bars (invisible base + visible bar)
const waterfallData = waterfallRaw.map((d, i) => {
  if (d.type === 'base' || d.type === 'result') {
    return { ...d, base: 0, bar: d.abs };
  }
  // cumulative bottom
  const bottom = waterfallRaw.slice(0, i).reduce((acc, x) => {
    if (x.type === 'base') return acc + x.abs;
    if (x.type === 'pos') return acc + x.abs;
    return acc;
  }, 0);
  return { ...d, base: bottom, bar: d.abs };
});

const CustomWaterfallTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = waterfallData.find((x) => x.name === label);
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

export default function ResultadoSimulacion({ navigate }: Props) {
  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Resultado de Simulación</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color: '#64748b' }}>
              Escenario 03 — Crecimiento Moderado 2027 / Versión 4
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
            >
              Guardado
            </span>
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
          { label: 'Aporte total de intervenciones', value: `+${formatNum(CORE.totalContribucion)}`, color: '#16a34a', sub: '4 iniciativas' },
          { label: 'Escenario 03', value: formatNum(CORE.escenario), color: '#1e40af', sub: 'Resultado simulado' },
          { label: 'Meta ICPNA', value: formatNum(CORE.meta), color: '#0369a1', sub: 'Objetivo institucional' },
          { label: 'Brecha restante', value: formatNum(Math.abs(CORE.brecha)), color: '#d97706', sub: 'Matrículas al objetivo' },
          { label: 'Cumplimiento', value: `${CORE.cumplimiento}%`, color: '#16a34a', sub: 'Meta ICPNA' },
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
            <div
              className="flex items-center gap-3 px-4 py-3 rounded mt-3"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
            >
              <span style={{ color: '#d97706', fontSize: 20 }}>⟵</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#92400e' }}>
                  Brecha restante a Meta ICPNA: −{formatNum(Math.abs(CORE.brecha))} matrículas
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                  El escenario alcanza el {CORE.cumplimiento}% de la meta. Se requieren intervenciones adicionales o ajuste de la Meta Factible.
                </div>
              </div>
            </div>
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
                { label: 'Ref. superior IC 95%', value: '194,600', color: '#93c5fd' },
                { label: 'Escenario 03', value: formatNum(CORE.escenario), color: '#2563eb' },
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
                El escenario supera el rango central del Baseline por efecto de las intervenciones incorporadas.
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
                style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
              >
                ⚠ Factible con restricciones
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Alumnos estimados', value: '196,840' },
                  { label: 'Clases requeridas', value: '8,425' },
                  { label: 'Ocupabilidad prom.', value: '89%' },
                  { label: 'Alertas capacidad', value: '2', red: true },
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
                  {[
                    { sede: 'Miraflores', periodo: '2027-03', disp: '410', req: '424', brecha: '+14', estado: 'Restricción', red: true },
                    { sede: 'San Miguel', periodo: '2027-04', disp: '355', req: '362', brecha: '+7', estado: 'Restricción', red: true },
                    { sede: 'Surco', periodo: '2027-03', disp: '395', req: '382', brecha: '−13', estado: 'Factible', red: false },
                  ].map((row, i) => (
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
                  198,300 matrículas
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#3b82f6' }}>
                  Distinto de la Meta ICPNA (200,000). Considera restricciones operativas actuales.
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
