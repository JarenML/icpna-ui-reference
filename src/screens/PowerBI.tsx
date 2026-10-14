import { useState } from 'react';
import { ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES, FOOTNOTE } from '../data/constants';
import FormatoFinanzasModal from '../components/FormatoFinanzasModal';
import { FORMATOS_AREA } from '../data/formatos';

// Workspace / report links. Replace with the published report URLs of the ICPNA workspace.
const POWER_BI_WORKSPACE_URL = 'https://app.powerbi.com/home';

const ULTIMA_SINCRONIZACION = '07/10/2026 09:15';

const totalEscenarios = ESCENARIOS_DETALLE.length + ESCENARIOS_PENDIENTES.length;
const totalIntervenciones = ESCENARIOS_DETALLE.reduce((a, e) => a + e.contribuciones.length, 0)
  + ESCENARIOS_PENDIENTES.reduce((a, e) => a + e.intervenciones.length, 0);

interface Reporte {
  nombre: string;
  grupo: string;
  descripcion: string;
  paginas: number;
  fuente?: string;
  vistaPrevia?: boolean;
}

const REPORTES: Reporte[] = [
  {
    nombre: 'Tablero Ejecutivo',
    grupo: 'Reporte Global',
    descripcion: 'Baseline, Meta ICPNA y escenario aprobado; evolución mensual y aporte por iniciativa.',
    paginas: 4,
  },
  {
    nombre: 'Resultados por Escenario',
    grupo: 'Reporte Global',
    descripcion: 'Construcción del resultado, contexto estadístico y factibilidad de cada escenario simulado.',
    paginas: 3,
  },
  {
    nombre: 'Comparación de Escenarios',
    grupo: 'Reporte Global',
    descripcion: 'Indicadores lado a lado, ranking por criterio e ingresos estimados.',
    paginas: 2,
  },
  {
    nombre: 'Reporte Granular',
    grupo: 'Reporte Granular',
    descripcion: 'Desglose por Periodo, Modalidad, Programa, Sede, Tipo de Alumno, Curso y Horario.',
    paginas: 6,
  },
  {
    nombre: 'Capacidad Operativa',
    grupo: 'Reporte Granular',
    descripcion: 'Utilización y brechas de capacidad por sede, franja horaria y periodo.',
    paginas: 2,
  },
  {
    nombre: 'Reporte de Alertas',
    grupo: 'Reporte de Alertas',
    descripcion: 'Alertas de factibilidad, capacidad, calidad de datos y supuestos con baja evidencia.',
    paginas: 1,
  },
  ...FORMATOS_AREA.map((f) => ({ ...f, grupo: 'Formatos por área', paginas: 1 })),
];

const TABLAS = [
  { nombre: 'Escenarios', detalle: 'Código, versión, estado y autor', filas: totalEscenarios },
  { nombre: 'Resultados de simulación', detalle: 'Solo escenarios Simulados o Aprobados', filas: ESCENARIOS_DETALLE.length },
  { nombre: 'Intervenciones', detalle: 'Variables intervenidas y su impacto', filas: totalIntervenciones },
  { nombre: 'Proyección mensual', detalle: 'Baseline, Meta, escenario e IC 95% por mes', filas: 12 * (ESCENARIOS_DETALLE.length + 2) },
  { nombre: 'Capacidad por sede', detalle: 'Capacidad disponible vs requerida', filas: ESCENARIOS_DETALLE.reduce((a, e) => a + e.capacidad.length, 0) },
  { nombre: 'Alertas', detalle: 'Catálogo fijo de alertas de la Versión 1', filas: 4 },
];

const GRUPO_STYLE: Record<string, { color: string; bg: string }> = {
  'Reporte Global': { color: '#1e40af', bg: '#eff6ff' },
  'Reporte Granular': { color: '#0f766e', bg: '#f0fdfa' },
  'Reporte de Alertas': { color: '#b45309', bg: '#fffbeb' },
  'Formatos por área': { color: '#7c3aed', bg: '#f5f3ff' },
};

const ExternalIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

// Power BI-style mark built from bars (no brand artwork)
const ReportIcon = () => (
  <span className="flex items-end justify-center gap-0.5 rounded flex-shrink-0" style={{ width: 32, height: 32, background: '#fefce8', border: '1px solid #fde68a', padding: 7 }}>
    <span style={{ width: 4, height: 8, background: '#ca8a04', borderRadius: 1 }} />
    <span style={{ width: 4, height: 13, background: '#eab308', borderRadius: 1 }} />
    <span style={{ width: 4, height: 18, background: '#facc15', borderRadius: 1 }} />
  </span>
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

const abrir = () => window.open(POWER_BI_WORKSPACE_URL, '_blank', 'noopener,noreferrer');

export default function PowerBI() {
  const [previewFinanzas, setPreviewFinanzas] = useState(false);

  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Reportes en Power BI</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Esta plataforma es el motor de planificación; los datos generados se publican en Power BI para su análisis y visualización
          </p>
        </div>
        <button
          onClick={abrir}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
          style={{ color: '#fff', border: 'none' }}
        >
          Abrir espacio de trabajo
          <ExternalIcon />
        </button>
      </div>

      {/* Data flow */}
      <Card style={{ padding: '16px 20px' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10.5 }}>
            Flujo de publicación de datos
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
          >
            <span className="rounded-full" style={{ width: 6, height: 6, background: '#16a34a' }} />
            Sincronizado · {ULTIMA_SINCRONIZACION}
          </span>
        </div>
        <div className="grid items-stretch gap-3" style={{ gridTemplateColumns: '1fr 28px 1fr 28px 1fr' }}>
          {[
            {
              paso: '1',
              titulo: 'Motor de planificación',
              sub: 'Esta plataforma',
              detalle: 'Baseline, Meta ICPNA, intervenciones, simulación y comparación de escenarios.',
              accent: '#1e40af',
            },
            {
              paso: '2',
              titulo: 'Modelo de datos publicado',
              sub: 'ICPNA_Planificacion_2027',
              detalle: 'Tablas de escenarios, resultados, intervenciones, capacidad y alertas en Azure.',
              accent: '#0369a1',
            },
            {
              paso: '3',
              titulo: 'Power BI',
              sub: 'Espacio de trabajo ICPNA',
              detalle: 'Tableros y reportes de consulta para Dirección, Comercial, Académico y Finanzas.',
              accent: '#ca8a04',
            },
          ].flatMap((s, i) => {
            const card = (
              <div key={s.titulo} className="rounded px-4 py-3" style={{ background: '#f8fafc', border: '1px solid var(--border)', borderTop: `3px solid ${s.accent}` }}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center rounded-full font-semibold"
                    style={{ width: 18, height: 18, background: '#fff', border: `1px solid ${s.accent}`, color: s.accent, fontSize: 10 }}
                  >
                    {s.paso}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{s.titulo}</span>
                </div>
                <div className="font-mono text-xs mt-1" style={{ color: s.accent }}>{s.sub}</div>
                <div className="text-xs mt-1.5" style={{ color: '#64748b', lineHeight: 1.5 }}>{s.detalle}</div>
              </div>
            );
            return i < 2
              ? [card, (
                <div key={`arrow-${i}`} className="flex items-center justify-center" style={{ color: '#94a3b8' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              )]
              : [card];
          })}
        </div>
        <div className="text-xs mt-3" style={{ color: '#64748b' }}>
          Los datos se publican al ejecutar una simulación o guardar una versión. Los escenarios en Borrador o En proceso se publican sin resultados.
        </div>
      </Card>

      {/* Reports + datasets */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 360px' }}>
        <Card>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Reportes publicados</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Agrupados por componente de reporte</div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {REPORTES.map((r) => {
              const g = GRUPO_STYLE[r.grupo];
              return (
                <div key={r.nombre} className="flex flex-col rounded p-3.5" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <ReportIcon />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>{r.nombre}</div>
                      <span className="inline-block mt-0.5 px-1.5 rounded font-medium" style={{ fontSize: 10, background: g.bg, color: g.color }}>
                        {r.grupo}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 flex-1" style={{ color: '#64748b', lineHeight: 1.5 }}>{r.descripcion}</p>
                  {r.fuente && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#94a3b8' }}>
                      <span className="font-semibold px-1 rounded" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 9 }}>XLSX</span>
                      Referencia: <span style={{ color: '#475569' }}>{r.fuente}</span> · Matriz
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      {r.paginas} página{r.paginas > 1 ? 's' : ''} · Actualizado {ULTIMA_SINCRONIZACION.split(' ')[0]}
                    </span>
                    <div className="flex gap-1.5">
                    {r.vistaPrevia && (
                      <button
                        onClick={() => setPreviewFinanzas(true)}
                        className="text-xs px-2.5 py-1 rounded font-medium transition-colors hover:bg-slate-50"
                        style={{ background: '#fff', color: '#334155', border: '1px solid var(--border)' }}
                      >
                        Vista previa
                      </button>
                    )}
                    <button
                      onClick={abrir}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium transition-colors hover:bg-blue-100"
                      style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
                    >
                      Exportar en Power BI
                      <ExternalIcon size={11} />
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Datos publicados</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Tablas del modelo ICPNA_Planificacion_2027</div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-2 text-left font-semibold" style={{ color: '#64748b' }}>Tabla</th>
                <th className="px-4 py-2 text-right font-semibold" style={{ color: '#64748b' }}>Filas</th>
              </tr>
            </thead>
            <tbody>
              {TABLAS.map((t) => (
                <tr key={t.nombre} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium" style={{ color: '#334155' }}>{t.nombre}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>{t.detalle}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono" style={{ color: '#0f172a' }}>{t.filas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs" style={{ color: '#64748b', lineHeight: 1.5 }}>
            Power BI solo consulta estos datos: las operaciones (simulación, intervenciones, Meta) se realizan siempre en esta plataforma.
          </div>
        </Card>
      </div>

      <p className="text-xs text-center pt-2 pb-4" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>

      <FormatoFinanzasModal open={previewFinanzas} onClose={() => setPreviewFinanzas(false)} />
    </div>
  );
}
