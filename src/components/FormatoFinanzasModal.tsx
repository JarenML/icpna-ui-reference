import { useEffect } from 'react';

// Referential preview of the "Hoja Formato Finanzas" matrix (structure of the Finance source file, columns A–BQ).
// "Código Ceco" is intentionally not displayed.

interface Props {
  open: boolean;
  onClose: () => void;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

const NIVELES = [
  { nivel: '1. Básico', dic: 8, nuevos: 8, regulares: 224, reingresantes: 32, total: 264 },
  { nivel: '2. Intermedio', dic: 0, nuevos: 0, regulares: 0, reingresantes: 0, total: 0 },
  { nivel: '3. Avanzado', dic: 0, nuevos: 0, regulares: 0, reingresantes: 0, total: 0 },
  { nivel: '4. Niños', dic: 89, nuevos: 89, regulares: 1_482, reingresantes: 185, total: 1_756 },
  { nivel: '5. Otros', dic: 0, nuevos: 0, regulares: 0, reingresantes: 0, total: 0 },
];
const TOTAL_ALUMNOS = NIVELES.reduce((a, n) => a + n.total, 0);

const CECOS = [
  { fase: '001', ceco: '(001) Basic Daily', dic: 0 },
  { fase: '002', ceco: '(002) Intermediate Daily', dic: 0 },
  { fase: '003', ceco: '(003) Advanced Daily', dic: 0 },
  { fase: 'BSPA', ceco: '(BSPA) Spanish Basic Daily', dic: 0 },
  { fase: 'TPCT', ceco: '(TPCT) Preparation for TOEFL', dic: 0 },
  { fase: 'ST01S', ceco: '(ST01S) Stage One Saturday', dic: 41 },
  { fase: 'ST02S', ceco: '(ST02S) Stage Two Saturday', dic: 42 },
  { fase: '1AS', ceco: '(1AS) Basic Accelerated Saturday', dic: 8 },
];

const SEGMENTADORES = ['Año: 2027', 'Escenario: ESC-02', 'Zona', 'Sede', 'Nivel', 'Fase'];

// Header colors follow the source file (red headers, yellow groups), softened
const HEAD = { background: '#b91c1c', color: '#fff' };
const GROUP = { background: '#fde047', color: '#422006' };

const n = (v: number) => (v === 0 ? '-' : v.toLocaleString('en-US'));

const th = 'px-1.5 py-1 font-semibold text-center whitespace-nowrap';
const td = 'px-1.5 py-1 text-right font-mono whitespace-nowrap';

export default function FormatoFinanzasModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cabeceraMeses = (
    <>
      {MESES.map((m) => <th key={m} className={th} style={{ ...HEAD, fontSize: 10 }}>{m}</th>)}
      <th className={th} style={{ ...HEAD, fontSize: 10 }}>Total</th>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="formato-finanzas-title"
        className="flex flex-col w-full"
        style={{ maxWidth: 1100, maxHeight: 'calc(100vh - 48px)', background: '#fff', borderRadius: 8, boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span id="formato-finanzas-title" className="font-semibold text-base" style={{ color: '#0f172a' }}>Hoja Formato Finanzas</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#94a3b8', border: '1px dashed #cbd5e1', fontStyle: 'italic' }}>
                Vista previa referencial
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: '#64748b' }}>
              Visualización tipo Matriz con estructura idéntica al archivo de Finanzas · columnas A–BQ · sin la columna "Código Ceco"
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-lg leading-none px-1" style={{ color: '#94a3b8' }}>×</button>
        </div>

        <div className="overflow-auto px-5 py-4 space-y-4">
          {/* Slicers */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>Segmentadores</span>
            {SEGMENTADORES.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded" style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#334155' }}>
                {s} ▾
              </span>
            ))}
          </div>

          {/* Summary by level */}
          <div className="overflow-x-auto rounded" style={{ border: '1px solid var(--border)' }}>
            <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th rowSpan={2} className={th} style={{ ...HEAD, minWidth: 110 }}>Nivel</th>
                  <th colSpan={13} className={th} style={GROUP}>ALUMNOS NUEVOS</th>
                  <th className={th} style={GROUP}>REGULARES</th>
                  <th className={th} style={GROUP}>REINGRESANTES</th>
                  <th className={th} style={GROUP}>TOTAL ALUMNOS</th>
                  <th rowSpan={2} className={th} style={HEAD}>%</th>
                </tr>
                <tr>
                  {cabeceraMeses}
                  <th className={th} style={{ ...HEAD, fontSize: 10 }}>Total</th>
                  <th className={th} style={{ ...HEAD, fontSize: 10 }}>Total</th>
                  <th className={th} style={{ ...HEAD, fontSize: 10 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {NIVELES.map((r) => (
                  <tr key={r.nivel} style={{ borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                    <td className="px-2 py-1 font-medium whitespace-nowrap">{r.nivel}</td>
                    {MESES.map((m, i) => <td key={m} className={td} style={{ color: '#94a3b8' }}>{i === 11 ? n(r.dic) : '-'}</td>)}
                    <td className={`${td} font-semibold`}>{n(r.nuevos)}</td>
                    <td className={td}>{n(r.regulares)}</td>
                    <td className={td}>{n(r.reingresantes)}</td>
                    <td className={`${td} font-semibold`}>{n(r.total)}</td>
                    <td className={td}>{r.total ? `${((r.total / TOTAL_ALUMNOS) * 100).toFixed(1)}%` : '-'}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--border)', background: '#f8fafc', color: '#0f172a' }}>
                  <td className="px-2 py-1 font-semibold">Total</td>
                  {MESES.map((m, i) => <td key={m} className={`${td} font-semibold`}>{i === 11 ? n(NIVELES.reduce((a, r) => a + r.dic, 0)) : '-'}</td>)}
                  <td className={`${td} font-semibold`}>{n(NIVELES.reduce((a, r) => a + r.nuevos, 0))}</td>
                  <td className={`${td} font-semibold`}>{n(NIVELES.reduce((a, r) => a + r.regulares, 0))}</td>
                  <td className={`${td} font-semibold`}>{n(NIVELES.reduce((a, r) => a + r.reingresantes, 0))}</td>
                  <td className={`${td} font-semibold`}>{n(TOTAL_ALUMNOS)}</td>
                  <td className={`${td} font-semibold`}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detail by cost center */}
          <div className="overflow-x-auto rounded" style={{ border: '1px solid var(--border)' }}>
            <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Zona', 'Sedes', 'Código Sede', 'CODIGOFASE', 'Nombre Ceco'].map((h) => (
                    <th key={h} rowSpan={2} className={th} style={HEAD}>{h}</th>
                  ))}
                  <th colSpan={13} className={th} style={GROUP}>ALUMNOS NUEVOS</th>
                  <th className={th} style={GROUP}>REGULARES</th>
                </tr>
                <tr>
                  {cabeceraMeses}
                  <th className={th} style={{ ...HEAD, fontSize: 10 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {CECOS.map((r) => (
                  <tr key={r.fase} style={{ borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                    <td className="px-1.5 py-1 whitespace-nowrap">NACIONAL</td>
                    <td className="px-1.5 py-1 whitespace-nowrap">CONSOLIDADO</td>
                    <td className="px-1.5 py-1 text-center" style={{ color: '#94a3b8' }}>—</td>
                    <td className="px-1.5 py-1 font-mono">{r.fase}</td>
                    <td className="px-1.5 py-1 whitespace-nowrap">{r.ceco}</td>
                    {MESES.map((m, i) => <td key={m} className={td} style={{ color: i === 11 && r.dic ? '#334155' : '#94a3b8' }}>{i === 11 ? n(r.dic) : '-'}</td>)}
                    <td className={`${td} font-semibold`}>{n(r.dic)}</td>
                    <td className={td} style={{ color: '#94a3b8' }}>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-xs" style={{ borderTop: '1px solid var(--border)', background: '#f8fafc', color: '#94a3b8' }}>
          <span>Estructura tomada del archivo de Finanzas; las cifras son ilustrativas. Las columnas continúan hasta BQ en el reporte.</span>
          <button onClick={onClose} className="px-3 py-1.5 rounded font-medium" style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
