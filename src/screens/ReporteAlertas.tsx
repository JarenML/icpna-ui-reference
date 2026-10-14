import ExportPowerBI from '../components/ExportPowerBI';
import { useState } from 'react';
import type { Screen } from '../App';
import { FOOTNOTE, ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES } from '../data/constants';
import { ALERTAS, type NivelAlerta as Nivel } from '../data/alertas';

interface Props {
  navigate: (s: Screen) => void;
}

const ESCENARIOS = [...ESCENARIOS_DETALLE, ...ESCENARIOS_PENDIENTES].sort((a, b) => a.codigo.localeCompare(b.codigo));
const SEDES = [...new Set(ALERTAS.flatMap((a) => a.sedes))].sort();
const PERIODOS = [...new Set(ALERTAS.flatMap((a) => a.periodos))].sort();

const catalogTable = [
  {
    alerta: 'Meta fuera de las bandas',
    cuando: 'La Meta ICPNA supera el límite superior del Baseline o queda por debajo del inferior.',
    donde: 'Resumen Ejecutivo y Construcción de Escenario',
    nivel: 'Advertencia' as Nivel,
  },
  {
    alerta: 'Brecha de capacidad',
    cuando: 'El escenario requiere más aulas, aforo u horarios de los disponibles en una sede, curso u horario.',
    donde: 'Resumen Ejecutivo y Reporte Granular',
    nivel: 'Crítica' as Nivel,
  },
  {
    alerta: 'Clases sin aula',
    cuando: 'Tras intentar reubicar clases, no queda ninguna aula libre en la franja horaria requerida.',
    donde: 'Reporte Granular',
    nivel: 'Crítica' as Nivel,
  },
  {
    alerta: 'Valor fuera de límite',
    cuando: 'Un ajuste produce un valor imposible: retención <0% o >100%, o alumnos fuera del mínimo/vacante.',
    donde: 'Construcción de Escenario (al registrar la intervención)',
    nivel: 'Error' as Nivel,
  },
  {
    alerta: 'Estado de la simulación',
    cuando: 'Una simulación pesada se procesa en segundo plano.',
    donde: 'Lista de escenarios',
    nivel: 'Informativa' as Nivel,
  },
];

const nivelConfig: Record<Nivel, { bg: string; color: string; border: string; borderLeft: string; icon: string }> = {
  Crítica: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', borderLeft: '#dc2626', icon: '🔴' },
  Advertencia: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', borderLeft: '#d97706', icon: '⚠️' },
  Error: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', borderLeft: '#ea580c', icon: '⛔' },
  Informativa: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', borderLeft: '#2563eb', icon: 'ℹ️' },
};

export default function ReporteAlertas({ navigate }: Props) {
  const [filNivel, setFilNivel] = useState('Todos');
  const [filEscenario, setFilEscenario] = useState('Todos');
  const [filSede, setFilSede] = useState('Todas');
  const [filPeriodo, setFilPeriodo] = useState('Todos');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activas = ALERTAS.filter((a) => !dismissed.includes(a.id));
  // Alerts without a specific scenario/sede/periodo apply to all of them
  const filteredAlerts = activas.filter((a) => {
    if (filNivel !== 'Todos' && a.nivel !== filNivel) return false;
    if (filEscenario !== 'Todos' && a.escenarioId !== null && a.escenarioId !== filEscenario) return false;
    if (filSede !== 'Todas' && a.sedes.length > 0 && !a.sedes.includes(filSede)) return false;
    if (filPeriodo !== 'Todos' && a.periodos.length > 0 && !a.periodos.includes(filPeriodo)) return false;
    return true;
  });

  const counts = {
    Crítica: activas.filter((a) => a.nivel === 'Crítica').length,
    Advertencia: activas.filter((a) => a.nivel === 'Advertencia').length,
    Error: activas.filter((a) => a.nivel === 'Error').length,
    Informativa: activas.filter((a) => a.nivel === 'Informativa').length,
  };

  return (
    <div className="p-5 space-y-4 min-w-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Reporte de Alertas</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Consolidado de alertas y notificaciones generadas por la plataforma
          </p>
        </div>
        <ExportPowerBI reporte="Reporte de Alertas" tablas={['alerta']} navigate={navigate} />
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-4 px-4 py-3 rounded"
        style={{ background: '#fff', border: '1px solid var(--border)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>Filtros:</span>
        {[
          { label: 'Nivel', value: filNivel, onChange: setFilNivel, opts: ['Todos', 'Crítica', 'Advertencia', 'Error', 'Informativa'].map((o) => ({ value: o, label: o })) },
          {
            label: 'Escenario', value: filEscenario, onChange: setFilEscenario,
            opts: [{ value: 'Todos', label: 'Todos' }, ...ESCENARIOS.map((e) => ({ value: e.id, label: `${e.codigo} — ${e.descripcion}` }))],
          },
          { label: 'Sede', value: filSede, onChange: setFilSede, opts: ['Todas', ...SEDES].map((o) => ({ value: o, label: o })) },
          { label: 'Periodo', value: filPeriodo, onChange: setFilPeriodo, opts: ['Todos', ...PERIODOS].map((o) => ({ value: o, label: o })) },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#64748b' }}>{f.label}:</span>
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="text-xs border rounded px-2 py-1"
              style={{ border: '1px solid var(--border)', borderRadius: 4, color: '#334155', background: '#fff' }}
            >
              {f.opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(counts) as [Nivel, number][]).map(([nivel, count]) => {
          const cfg = nivelConfig[nivel];
          return (
            <button
              key={nivel}
              onClick={() => setFilNivel(filNivel === nivel ? 'Todos' : nivel)}
              className="rounded-md p-4 text-left transition-all"
              style={{
                background: filNivel === nivel ? cfg.bg : '#fff',
                border: `1px solid ${filNivel === nivel ? cfg.border : 'var(--border)'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color, fontSize: 10 }}>
                  {nivel}
                </span>
                <span style={{ fontSize: 14 }}>{cfg.icon}</span>
              </div>
              <div className="font-bold font-mono text-2xl" style={{ color: count > 0 ? cfg.color : '#94a3b8' }}>
                {count}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                {count === 0 ? 'Sin alertas' : count === 1 ? '1 alerta activa' : `${count} alertas activas`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Alert catalog table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Catálogo de Alertas — Tipos definidos en Versión 1</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            Los tipos a continuación son fijos en esta versión. Las reglas de alerta no son configurables por el usuario.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                {['Tipo de alerta', 'Cuándo aparece', 'Dónde se visualiza', 'Nivel'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalogTable.map((row, i) => {
                const cfg = nivelConfig[row.nivel];
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: '#334155' }}>{row.alerta}</td>
                    <td className="px-4 py-2.5" style={{ color: '#64748b', maxWidth: 280 }}>{row.cuando}</td>
                    <td className="px-4 py-2.5" style={{ color: '#64748b' }}>{row.donde}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.icon} {row.nivel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active alert cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm" style={{ color: '#0f172a' }}>
            Alertas Activas
            {filteredAlerts.length > 0 && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
              >
                {filteredAlerts.length} activas
              </span>
            )}
          </h2>
        </div>

        {filteredAlerts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-md"
            style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <span className="text-3xl mb-3">✓</span>
            <div className="font-semibold text-sm" style={{ color: '#16a34a' }}>
              No hay alertas activas para los filtros seleccionados.
            </div>
            <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Ajuste los filtros para ver otras alertas.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const cfg = nivelConfig[alert.nivel];
              return (
                <div
                  key={alert.id}
                  className="rounded-md overflow-hidden"
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${cfg.borderLeft}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="flex items-start justify-between p-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>{alert.titulo}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            {alert.nivel}
                          </span>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: '#64748b', lineHeight: 1.6 }}>{alert.descripcion}</p>
                        <div className="grid gap-2 mt-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(alert.datos.length, 4)}, minmax(0, 1fr))` }}>
                          {alert.datos.map((d) => (
                            <div
                              key={d.label}
                              className="px-2.5 py-1.5 rounded"
                              style={{ background: d.destacado ? cfg.bg : '#f8fafc', border: `1px solid ${d.destacado ? cfg.border : '#f1f5f9'}` }}
                            >
                              <div style={{ color: '#94a3b8', fontSize: 10.5 }}>{d.label}</div>
                              <div className="font-mono font-semibold text-xs mt-0.5" style={{ color: d.destacado ? cfg.color : '#0f172a' }}>{d.value}</div>
                            </div>
                          ))}
                        </div>
                        {alert.progreso !== undefined && (
                          <div className="mt-2.5 rounded-full overflow-hidden" style={{ height: 5, background: '#e2e8f0' }}>
                            <div className="h-full rounded-full" style={{ width: `${alert.progreso}%`, background: cfg.color }} />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2.5">
                          <span className="text-xs" style={{ color: '#94a3b8' }}>
                            Escenario: <strong style={{ color: '#64748b' }}>{alert.escenarioLabel}</strong>
                          </span>
                          <span className="text-xs" style={{ color: '#94a3b8' }}>
                            Tipo: <strong style={{ color: '#64748b' }}>{alert.tipo}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => navigate(alert.destino)}
                        className="text-xs px-3 py-1.5 rounded font-semibold"
                        style={{ background: cfg.color, color: '#fff', border: 'none' }}
                      >
                        {alert.accion}
                      </button>
                      <button
                        onClick={() => setDismissed((prev) => [...prev, alert.id])}
                        className="text-xs px-2 py-1.5 rounded"
                        style={{ border: '1px solid var(--border)', color: '#94a3b8', background: '#f8fafc' }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>
    </div>
  );
}
