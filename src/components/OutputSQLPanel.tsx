import { useState } from 'react';

// Baseline = output of the projection model (structure taken from "muestra de proyeccion.csv").
// Traceability columns (ID_CARGA, VERSION_BASELINE, FECHA_CARGA) are provisional.
export const TABLA_BASELINE = 'planificacion.proyeccion_baseline';

const columnas = [
  { nombre: 'ID_CARGA', tipo: 'UNIQUEIDENTIFIER', traza: true, desc: 'ID de la corrida del modelo' },
  { nombre: 'VERSION_BASELINE', tipo: 'VARCHAR(10)', traza: true, desc: 'Versión del Baseline (ej. 2027.01)' },
  { nombre: 'PERIODO_PROGRAMA', tipo: 'DATE', pk: true, desc: 'Periodo del programa' },
  { nombre: 'NOMBRE_MODALIDAD', tipo: 'VARCHAR(20)', pk: true, desc: 'Presencial / Virtual' },
  { nombre: 'NOMBRE_SEDE', tipo: 'VARCHAR(50)', pk: true, desc: 'Sede' },
  { nombre: 'NOMBRE_NIVEL', tipo: 'VARCHAR(20)', pk: true, desc: 'Básico, Intermedio, Avanzado, Stage…' },
  { nombre: 'CHR_HORARIO', tipo: 'VARCHAR(20)', pk: true, desc: 'Franja horaria' },
  { nombre: 'TIPO_ALUMNO', tipo: 'VARCHAR(20)', pk: true, desc: 'Regular / Reingresante / Nuevo' },
  { nombre: 'CODIGO_CURSO', tipo: 'VARCHAR(10)', pk: true, desc: 'Código del curso' },
  { nombre: 'CANT_ALUMNOS_MATRICULADOS', tipo: 'INT NULL', desc: 'Matrícula real (NULL en periodos futuros)' },
  { nombre: 'PRONOSTICO', tipo: 'INT', desc: 'Matrícula proyectada por el modelo' },
  { nombre: 'FLAG', tipo: 'VARCHAR(30)', desc: 'Método: cascada / iniciadores / sin_matriculas_recientes' },
  { nombre: 'DATA_SPLIT', tipo: 'VARCHAR(10)', desc: 'train / test / future' },
  { nombre: 'MES_DURACION', tipo: 'TINYINT', desc: 'Duración del curso en meses' },
  { nombre: 'FECHA_CARGA', tipo: 'DATETIME2', traza: true, desc: 'Fecha y hora de registro' },
];

// Real rows from the CSV sample
const preview = [
  { periodo: '2026-08', sede: 'La Molina', nivel: 'Avanzado', horario: '16:00 - 17:30', tipo: 'Regular', curso: 'AG1', real: 9, pron: 10, flag: 'cascada', split: 'test' },
  { periodo: '2026-08', sede: 'Lima Centro', nivel: 'Stage 2', horario: '16:00 - 17:30', tipo: 'Nuevo', curso: 'JR1DP', real: 9, pron: 10, flag: 'iniciadores', split: 'test' },
  { periodo: '2026-09', sede: 'La Molina', nivel: 'Stage 1', horario: '10:50 - 12:31', tipo: 'Regular', curso: 'K05S', real: null, pron: 10, flag: 'cascada', split: 'future' },
  { periodo: '2026-09', sede: 'Prov. - Iquitos', nivel: 'Avanzado', horario: '21:15 - 22:45', tipo: 'Regular', curso: 'AG1', real: null, pron: 6, flag: 'sin_matriculas_recientes', split: 'future' },
];

// Summary of the full CSV sample (271 rows)
const resumen = [
  { split: 'train', periodo: '2026-08', filas: 30, real: '182', pron: '188' },
  { split: 'test', periodo: '2026-08', filas: 103, real: '684', pron: '708' },
  { split: 'future', periodo: '2026-09', filas: 138, real: '—', pron: '1,027' },
];

const consultaEjemplo = `-- Precisión del Baseline por sede (periodo de validación)
SELECT NOMBRE_SEDE,
       SUM(CANT_ALUMNOS_MATRICULADOS) AS real,
       SUM(PRONOSTICO)                AS pronostico,
       SUM(PRONOSTICO) - SUM(CANT_ALUMNOS_MATRICULADOS) AS desviacion
FROM   ${TABLA_BASELINE}
WHERE  VERSION_BASELINE = '2027.01'
  AND  DATA_SPLIT       = 'test'
GROUP BY NOMBRE_SEDE
ORDER BY desviacion DESC;`;

const splitColor: Record<string, string> = { train: '#64748b', test: '#d97706', future: '#1e40af' };

const thStyle = { color: '#64748b', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

export default function OutputSQLPanel() {
  const [vista, setVista] = useState<'estructura' | 'datos' | 'consulta'>('estructura');

  return (
    <div
      className="rounded-md mt-4"
      style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>
              Baseline — Output de la Proyección Anual en SQL
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4' }}
            >
              ✓ Registrado
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              title="Estructura y nombres ilustrativos"
              style={{ color: '#94a3b8', border: '1px dashed #cbd5e1', fontStyle: 'italic', letterSpacing: '0.02em' }}
            >
              Referencial
            </span>
          </div>
          <div className="text-xs mt-1" style={{ color: '#64748b' }}>
            El output del modelo de proyección se guarda en una tabla estructurada y es la fuente del Baseline: trazabilidad completa con el nuevo proyecto.
          </div>
        </div>
        <div className="flex rounded overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
          {([
            ['estructura', 'Estructura'],
            ['datos', 'Datos'],
            ['consulta', 'Consulta'],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className="text-xs px-3 py-1.5 font-medium"
              style={{
                background: vista === v ? '#0f766e' : '#fff',
                color: vista === v ? '#fff' : '#334155',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-3 text-xs" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Modelo de proyección', color: '#64748b' },
          { label: TABLA_BASELINE, color: '#0f766e', mono: true },
          { label: 'Baseline 2027.01', color: '#334155' },
          { label: 'Motor de Simulación / Nuevo proyecto / Power BI', color: '#1e40af' },
        ].map((n, i) => (
          <div key={n.label} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: '#94a3b8' }}>→</span>}
            <span
              className={`px-2 py-1 rounded font-medium ${n.mono ? 'font-mono' : ''}`}
              style={{ background: '#fff', color: n.color, border: `1px solid ${n.color}33` }}
            >
              {n.label}
            </span>
          </div>
        ))}
      </div>

      {vista === 'estructura' && (
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)' }}>
          <div className="min-w-0">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-1.5 font-medium" style={thStyle}>Columna</th>
                  <th className="text-left py-1.5 font-medium" style={thStyle}>Tipo</th>
                  <th className="text-left py-1.5 font-medium" style={thStyle}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {columnas.map((c) => (
                  <tr key={c.nombre} style={{ borderBottom: '1px solid #f1f5f9', background: c.traza ? '#f0fdfa' : undefined }}>
                    <td className="py-1 px-1 font-mono" style={{ color: '#0f172a' }}>
                      {c.nombre}
                      {c.pk && <span className="ml-1" style={{ color: '#d97706', fontSize: 9 }}>PK</span>}
                    </td>
                    <td className="py-1 pr-2 font-mono" style={{ color: '#0f766e' }}>{c.tipo}</td>
                    <td className="py-1" style={{ color: '#64748b' }}>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#94a3b8' }}>
              <span className="inline-block rounded" style={{ width: 10, height: 10, background: '#f0fdfa', border: '1px solid #99f6e4' }} />
              Columnas de trazabilidad añadidas al output del modelo
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Granularidad', value: 'Periodo × Sede × Nivel × Horario × Tipo × Curso' },
                { label: 'Filas (muestra)', value: '271' },
                { label: 'Sedes', value: '10' },
                { label: 'Modo de carga', value: 'Append por versión' },
              ].map((f) => (
                <div key={f.label} className="p-2 rounded" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                  <div className="font-medium" style={{ ...thStyle, color: '#94a3b8' }}>{f.label}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: '#334155' }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1.5" style={{ color: '#64748b' }}>
              {[
                'Cada corrida del modelo se registra con su versión, sin sobrescribir las anteriores',
                'Real vs pronóstico queda guardado por combinación para medir la precisión',
                'El método de proyección (FLAG) explica el origen de cada cifra',
                'El nuevo proyecto lee el Baseline directamente de esta tabla',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <span style={{ color: '#0f766e' }}>●</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {vista === 'datos' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {resumen.map((r) => (
              <div key={r.split} className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold" style={{ color: splitColor[r.split] }}>{r.split}</span>
                  <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{r.periodo} · {r.filas} filas</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <div>
                    <div style={{ ...thStyle, color: '#94a3b8' }}>Real</div>
                    <div className="font-mono font-semibold text-sm" style={{ color: '#334155' }}>{r.real}</div>
                  </div>
                  <div>
                    <div style={{ ...thStyle, color: '#94a3b8' }}>Pronóstico</div>
                    <div className="font-mono font-semibold text-sm" style={{ color: '#1e40af' }}>{r.pron}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-xs font-mono">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['periodo', 'sede', 'nivel', 'horario', 'tipo', 'curso', 'real', 'pronóstico', 'flag', 'split'].map((h) => (
                    <th key={h} className="text-left px-2 py-1.5 font-medium whitespace-nowrap" style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="whitespace-nowrap" style={{ borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                    <td className="px-2 py-1">{r.periodo}</td>
                    <td className="px-2 py-1">{r.sede}</td>
                    <td className="px-2 py-1">{r.nivel}</td>
                    <td className="px-2 py-1">{r.horario}</td>
                    <td className="px-2 py-1">{r.tipo}</td>
                    <td className="px-2 py-1">{r.curso}</td>
                    <td className="px-2 py-1 text-right">{r.real ?? 'NULL'}</td>
                    <td className="px-2 py-1 text-right" style={{ color: '#1e40af' }}>{r.pron}</td>
                    <td className="px-2 py-1">{r.flag}</td>
                    <td className="px-2 py-1" style={{ color: splitColor[r.split] }}>{r.split}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td colSpan={10} className="px-2 py-1 text-center" style={{ color: '#94a3b8' }}>
                    … 267 filas más
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'consulta' && (
        <div className="p-4">
          <pre
            className="text-xs font-mono p-3 rounded overflow-x-auto"
            style={{ background: '#0f172a', color: '#e2e8f0', lineHeight: 1.6 }}
          >
            {consultaEjemplo}
          </pre>
          <div className="text-xs mt-2" style={{ color: '#64748b' }}>
            Cualquier versión del Baseline puede auditarse o reconstruirse desde la tabla, sin volver a correr el modelo.
          </div>
        </div>
      )}

      <div
        className="flex items-center gap-2 px-4 py-2 text-xs"
        style={{ borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontStyle: 'italic' }}
      >
        <span style={{ fontStyle: 'normal' }}>ⓘ</span>
        <span>
          Vista referencial: nombres de tabla, columnas y tipos son ilustrativos. Datos tomados de una muestra de proyección.
        </span>
      </div>
    </div>
  );
}
