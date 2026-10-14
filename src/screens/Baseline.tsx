import type { Screen } from '../App';
import ExportPowerBI from '../components/ExportPowerBI';
import { useState } from 'react';
import { FOOTNOTE, formatNum } from '../data/constants';
import { CHECKS_BASELINE, type BaselineVersion, type EstadoBaseline } from '../data/baseline';
import OutputSQLPanel from '../components/OutputSQLPanel';
import VerificarBaselineModal from '../components/VerificarBaselineModal';

interface Props {
  navigate: (s: Screen) => void;
  versiones: BaselineVersion[];
  hayNueva: boolean;
  onIntegrar: (atipico: boolean, revisor: string | null) => void;
  onRechazar: () => void;
}

const estadoStyle: Record<EstadoBaseline, { color: string; bg: string; border: string; label: string }> = {
  'Activo': { color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', label: 'Activo · Validado' },
  'Archivado': { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Archivado' },
  'No apto': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: 'No apto' },
};

const EstadoBaselineBadge = ({ estado }: { estado: EstadoBaseline }) => {
  const s = estadoStyle[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, padding: '1px 8px' }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: s.color }} />
      {s.label}
    </span>
  );
};

const fmtVar = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);

const labelStyle = { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

const card = { background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

export default function Baseline({ navigate, versiones, hayNueva, onIntegrar, onRechazar }: Props) {
  const activo = versiones.find((v) => v.estado === 'Activo')!;
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const vista = versiones.find((v) => v.codigo === seleccion) ?? activo;
  const esHistorica = vista.codigo !== activo.codigo;
  const anteriores = versiones.filter((v) => v.codigo !== activo.codigo);

  return (
    <div className="p-5 min-w-0 space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Baseline</h1>
          <div className="text-sm mt-1" style={{ color: '#64748b' }}>
            Proyección anual consumida como punto de partida — inalterable y versionada
          </div>
        </div>
        <div className="flex gap-2">
        <ExportPowerBI reporte="Tablero Ejecutivo" tablas={['baseline_version', 'ctl_baseline_validacion']} navigate={navigate} />
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded font-medium"
          style={{ background: '#0f766e', color: '#fff' }}
        >
          <span style={{ fontSize: 13 }}>↻</span>
          Buscar nueva versión
        </button>
        </div>
      </div>

      {/* Historical version banner */}
      {esHistorica && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-md text-xs"
          style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <span>
            Estás viendo la versión histórica <span className="font-mono font-semibold">{vista.codigo}</span> — solo consulta. El Baseline activo es{' '}
            <span className="font-mono font-semibold">{activo.codigo}</span>.
          </span>
          <button onClick={() => setSeleccion(null)} className="font-semibold hover:underline" style={{ color: '#92400e' }}>
            Volver al activo →
          </button>
        </div>
      )}

      {/* Selected version summary */}
      <div className="rounded-md" style={card}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>
              {esHistorica ? 'Versión anterior' : 'Último Baseline validado'}
            </span>
            <span className="font-mono font-bold text-lg" style={{ color: '#0f172a' }}>{vista.codigo}</span>
            <EstadoBaselineBadge estado={vista.estado} />
          </div>
          <span className="text-xs" style={{ color: '#94a3b8' }}>
            Origen: {vista.origen} · Cargado {vista.cargado}
          </span>
        </div>

        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)' }}>
          <div className="grid grid-cols-3 gap-3 content-start">
            {[
              { label: 'Total matrículas proyectadas', value: formatNum(vista.total), big: true },
              { label: 'Periodos', value: vista.periodos },
              { label: 'Filas', value: formatNum(vista.filas) },
              { label: 'Variación vs versión anterior', value: fmtVar(vista.variacion) },
              { label: 'Origen de la validación', value: vista.validadoPor },
              { label: 'Verificaciones', value: `${vista.checks.ok + vista.checks.warn}/${CHECKS_BASELINE.length} superadas` },
            ].map((k) => (
              <div key={k.label} className="p-3 rounded" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div className="font-medium" style={labelStyle}>{k.label}</div>
                <div
                  className={`font-semibold mt-1 ${k.big ? 'font-mono text-lg' : 'text-sm'}`}
                  style={{ color: k.big ? '#0f172a' : '#334155' }}
                >
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold mb-2" style={{ color: '#334155' }}>Resultado de verificaciones</div>
            <div className="flex gap-2 mb-3">
              {[
                { n: vista.checks.ok, label: 'OK', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
                { n: vista.checks.warn, label: 'Advertencias', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
                { n: vista.checks.fail, label: 'Fallas', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
              ].map((c) => (
                <div key={c.label} className="flex-1 p-2 rounded text-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <div className="font-mono font-bold text-base" style={{ color: c.color }}>{c.n}</div>
                  <div style={{ ...labelStyle, color: c.color }}>{c.label}</div>
                </div>
              ))}
            </div>
            {vista.motivo ? (
              <div className="text-xs p-2.5 rounded" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                <span className="font-semibold">Motivo del bloqueo: </span>{vista.motivo}
              </div>
            ) : (
              <div className="text-xs space-y-1" style={{ color: '#64748b' }}>
                {vista.revision && (
                  <div className="p-2.5 mb-2 rounded" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}>
                    <span className="font-semibold">Advertencia estadística: </span>{vista.revision}
                  </div>
                )}
                {CHECKS_BASELINE.filter((c) => c.fuente === 'Paso 0').map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span style={{ color: '#15803d' }}>✓</span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL table */}
      <OutputSQLPanel version={vista.codigo} integrado={vista.estado !== 'No apto'} />

      {/* Previous versions */}
      <div className="rounded-md" style={card}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Versiones anteriores</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Historial de cargas. Las versiones archivadas se conservan para trazabilidad; las no aptas nunca se integraron.
            </div>
          </div>
          <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{anteriores.length} versiones</span>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Versión', 'Estado', 'Total proyectado', 'Variación', 'Periodos', 'Cargado', 'Verificaciones', ''].map((h) => (
                <th key={h} className="text-left px-4 py-2 font-medium" style={{ ...labelStyle, color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {anteriores.map((v) => {
              const activa = v.codigo === vista.codigo;
              return (
                <tr key={v.codigo} style={{ borderTop: '1px solid #f1f5f9', background: activa ? '#fffbeb' : undefined }}>
                  <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: '#0f172a' }}>{v.codigo}</td>
                  <td className="px-4 py-2.5"><EstadoBaselineBadge estado={v.estado} /></td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: '#334155' }}>{formatNum(v.total)}</td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: '#64748b' }}>{fmtVar(v.variacion)}</td>
                  <td className="px-4 py-2.5" style={{ color: '#64748b' }}>{v.periodos}</td>
                  <td className="px-4 py-2.5" style={{ color: '#64748b' }}>{v.cargado}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono" style={{ color: '#15803d' }}>{v.checks.ok}✓</span>
                    {v.checks.warn > 0 && <span className="font-mono ml-2" style={{ color: '#b45309' }}>{v.checks.warn}!</span>}
                    {v.checks.fail > 0 && <span className="font-mono ml-2" style={{ color: '#b91c1c' }}>{v.checks.fail}✕</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setSeleccion(activa ? null : v.codigo)}
                      className="text-xs px-2.5 py-1 rounded font-medium"
                      style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
                    >
                      {activa ? 'Cerrar' : 'Ver'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>

      <VerificarBaselineModal
        open={modal}
        hayNueva={hayNueva}
        activo={activo.codigo}
        onClose={() => setModal(false)}
        onIntegrar={(atipico, revisor) => { onIntegrar(atipico, revisor); setSeleccion(null); setModal(false); }}
        onRechazar={() => { onRechazar(); setModal(false); }}
      />
    </div>
  );
}
