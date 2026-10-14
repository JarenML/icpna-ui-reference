import { useState } from 'react';
import type { Screen } from '../App';
import { FOOTNOTE } from '../data/constants';
import EstadoBadge from '../components/EstadoBadge';

interface Props {
  navigate: (s: Screen) => void;
}

const interventionSteps = [
  {
    id: 'int01',
    label: 'Intervención 01 — Retención +2.2%',
    tipo: 'Regla validada',
    responsable: 'Gerencia Comercial',
    detail: {
      baseAfectada: '82,300 alumnos regulares únicos',
      regla: 'Incrementar la tasa de retención en 2.2 pp sobre la base de alumnos regulares únicos del período.',
      efecto: '+5,100 matrículas a lo largo del horizonte de planificación.',
      fuente: 'Regla de negocio validada — aprobada por Gerencia Académica y Comercial.',
      alcance: 'Lima → Presencial → Alumnos Regulares',
      periodo: '2027-01 a 2027-12',
      persistencia: 'Acumulativo',
    },
  },
  {
    id: 'int02',
    label: 'Intervención 02 — Campaña de Captación Verano +3.0%',
    tipo: 'Supuesto gerencial',
    responsable: 'Gerencia Comercial',
    detail: {
      baseAfectada: '140,000 alumnos potenciales nuevos en Lima — verano 2027',
      regla: 'Aplicar un incremento de 3.0% en la captación de alumnos nuevos durante los períodos 2027-01 a 2027-03, con factor de decaimiento mensual del 40%.',
      efecto: '+4,200 matrículas concentradas en Q1 2027.',
      fuente: 'Supuesto de Gerencia Comercial basado en el plan de campaña estacional.',
      alcance: 'Lima → Todas las sedes → Alumnos Nuevos',
      periodo: '2027-01 a 2027-03',
      persistencia: 'Con decaimiento (40% mensual)',
    },
  },
  {
    id: 'int03',
    label: 'Intervención 03 — Nuevo Horario Sede San Miguel',
    tipo: 'Estimación estadística',
    responsable: 'Gerencia Académica',
    detail: {
      baseAfectada: 'Sede San Miguel — turnos nocturnos disponibles desde 2027-03',
      regla: 'Estimar demanda incremental en +1,350 alumnos y redistribución de +1,050 alumnos de sedes adyacentes, basado en comportamiento de horarios comparables en Miraflores (2024–2026).',
      efecto: '+2,400 matrículas netas (después de descuento por redistribución).',
      fuente: 'Estimación estadística con referencia a horarios históricos comparables.',
      alcance: 'San Miguel → Presencial → Noche (Sáb)',
      periodo: 'Desde 2027-03',
      persistencia: 'Permanente',
    },
  },
  {
    id: 'int04',
    label: 'Intervención 04 — Ajuste Precio / Mix de Cursos',
    tipo: 'Supuesto gerencial',
    responsable: 'Gerencia Comercial',
    detail: {
      baseAfectada: 'Nacional — cursos premium con elasticidad-precio estimada',
      regla: 'Supuesto de incremento moderado en participación de cursos Business English y Conversational English, con efecto de +890 matrículas derivado de la mejora en mix de valor.',
      efecto: '+890 matrículas netas a lo largo del horizonte.',
      fuente: 'Supuesto gerencial — análisis de mix histórico 2024–2026.',
      alcance: 'Nacional → Todas las sedes',
      periodo: '2027-04 a 2027-12',
      persistencia: 'Con decaimiento',
    },
  },
];

const steps = [
  { id: 'baseline', tipo: 'baseline', label: 'Baseline 2027.01', sublabel: '184,250 matrículas proyectadas — Solo lectura' },
  ...interventionSteps.map((i) => ({ id: i.id, tipo: 'intervention', label: i.label, sublabel: `${i.tipo} · ${i.responsable}`, intervention: i })),
  { id: 'engine', tipo: 'engine', label: 'Motor de Simulación', sublabel: 'Reglas + Parámetros + Estadística Simple · No ML' },
  { id: 'result', tipo: 'result', label: 'Resultado', sublabel: 'Escenario 02 — 198,100 matrículas' },
  { id: 'validation', tipo: 'validation', label: 'Validación de Capacidad', sublabel: 'Factible con restricciones en 2 sedes' },
];

const tipoConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  baseline: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '◈' },
  intervention: { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', icon: '⊕' },
  engine: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⚙' },
  result: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓' },
  validation: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⊡' },
};

const clasificacionBadge = (c: string) => {
  if (c === 'Regla validada') return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
  if (c === 'Supuesto gerencial') return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
};

export default function Trazabilidad({ navigate }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-5 min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Trazabilidad del Escenario</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color: '#64748b' }}>Escenario 02 — Crecimiento Balanceado / Versión 4</span>
            <EstadoBadge estado="Simulado" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('escenarios')}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
          >
            Ver resultado
          </button>
          <button
            onClick={() => navigate('intervenciones')}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
          >
            Editar escenario
          </button>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 280px' }}>
        {/* Flow */}
        <div>
          {/* Auditability badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['Auditable', 'Explicable', 'Reproducible', 'Versionado'].map((b) => (
              <span
                key={b}
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
              >
                ✓ {b}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            {steps.map((step, i) => {
              const cfg = tipoConfig[step.tipo];
              const isIntervention = step.tipo === 'intervention';
              const inv = isIntervention ? (step as any).intervention : null;
              const isExp = expanded.has(step.id);
              const badge = inv ? clasificacionBadge(inv.tipo) : null;

              return (
                <div key={step.id}>
                  {/* Connector */}
                  {i > 0 && (
                    <div className="flex justify-start ml-6 my-0.5">
                      <div style={{ width: 2, height: 16, background: '#e2e8f0', marginLeft: 11 }} />
                    </div>
                  )}

                  <div
                    className="rounded-md overflow-hidden"
                    style={{
                      border: `1px solid ${cfg.border}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3"
                      style={{ background: cfg.bg, textAlign: 'left' }}
                      onClick={() => isIntervention && toggle(step.id)}
                    >
                      <div
                        className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                        style={{ width: 28, height: 28, background: cfg.color, color: '#fff' }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>{step.label}</span>
                          {badge && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                            >
                              {inv.tipo}
                            </span>
                          )}
                          {inv && (
                            <span className="text-xs" style={{ color: '#94a3b8' }}>· {inv.responsable}</span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{step.sublabel}</div>
                      </div>
                      {isIntervention && (
                        <span style={{ color: '#94a3b8', fontSize: 14 }}>{isExp ? '▲' : '▼'}</span>
                      )}
                    </button>

                    {isIntervention && isExp && inv && (
                      <div className="px-4 py-4" style={{ background: '#fff', borderTop: `1px solid ${cfg.border}` }}>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {[
                            { label: 'Base afectada', value: inv.detail.baseAfectada },
                            { label: 'Alcance', value: inv.detail.alcance },
                            { label: 'Periodo', value: inv.detail.periodo },
                            { label: 'Persistencia', value: inv.detail.persistencia },
                          ].map((field) => (
                            <div key={field.label}>
                              <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {field.label}
                              </div>
                              <div style={{ color: '#334155' }}>{field.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-2 text-xs">
                          <div>
                            <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Regla / Supuesto aplicado
                            </div>
                            <div
                              className="p-2.5 rounded"
                              style={{ background: '#f8fafc', color: '#334155', border: '1px solid var(--border)', lineHeight: 1.6 }}
                            >
                              {inv.detail.regla}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Efecto estimado</div>
                              <div className="font-semibold" style={{ color: '#16a34a' }}>{inv.detail.efecto}</div>
                            </div>
                            <div>
                              <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fuente / Justificación</div>
                              <div style={{ color: '#64748b' }}>{inv.detail.fuente}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step.tipo === 'engine' && (
                      <div className="px-4 py-3" style={{ background: '#fff', borderTop: `1px solid ${cfg.border}` }}>
                        <div className="text-xs space-y-1" style={{ color: '#64748b' }}>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#7c3aed' }}>●</span>
                            <span>Aplica cada intervención de forma secuencial sobre el Baseline</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#7c3aed' }}>●</span>
                            <span>Valida restricciones de capacidad por sede, franja horaria y periodo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#7c3aed' }}>●</span>
                            <span>No recalcula ni reestima el Baseline — solo aplica intervenciones definidas por el usuario</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#7c3aed' }}>●</span>
                            <span>No utiliza Machine Learning ni optimización automática</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 mt-4 px-4 py-3 rounded text-xs"
            style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b' }}
          >
            <span style={{ color: '#7c3aed', fontSize: 16 }}>ℹ</span>
            <span>
              Haga clic en cada intervención para expandir el detalle del cálculo. Todos los parámetros son reproducibles
              y auditables por cualquier analista con acceso a este escenario.
            </span>
          </div>
        </div>

        {/* Version info panel */}
        <div className="space-y-3">
          <div
            className="rounded-md"
            style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Información de la Versión</div>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'ID Escenario', value: 'ESC-2027-004', mono: true },
                { label: 'Versión', value: '4', mono: true },
                { label: 'Baseline utilizado', value: '2027.01', mono: true },
                { label: 'Creado', value: '05 Sep 2026' },
                { label: 'Última modificación', value: '08 Sep 2026' },
                { label: 'Estado', value: 'Simulado', badge: true, badgeBg: '#eff6ff', badgeColor: '#1e40af' },
                { label: 'Autor', value: 'Gerencia Comercial' },
                { label: 'Intervenciones', value: '4 aplicadas', mono: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>{row.label}</span>
                  {row.badge ? (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: row.badgeBg, color: row.badgeColor }}
                    >
                      {row.value}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${row.mono ? 'font-mono' : ''}`}
                      style={{ color: '#334155' }}
                    >
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div
            className="rounded-md"
            style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Resumen del Flujo</div>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Baseline', value: '184,250', color: '#64748b' },
                { label: '+ Intervenciones', value: '+13,850', color: '#16a34a' },
                { label: 'Escenario 02', value: '198,100', color: '#1e40af', bold: true },
                { label: 'Meta ICPNA', value: '200,000', color: '#0369a1' },
                { label: 'Brecha', value: '−1,900', color: '#d97706' },
                { label: 'Cumplimiento', value: '99.1%', color: '#16a34a', bold: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#64748b' }}>{row.label}</span>
                  <span
                    className="font-mono text-sm"
                    style={{ color: row.color, fontWeight: row.bold ? 700 : 600 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation shortcuts */}
          <div
            className="rounded-md p-4"
            style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="font-semibold text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b', fontSize: 10 }}>
              Acciones
            </div>
            <div className="space-y-2">
              {[
                { label: 'Ver resultado completo', screen: 'escenarios' as Screen },
                { label: 'Editar intervenciones', screen: 'intervenciones' as Screen },
                { label: 'Comparar con otros escenarios', screen: 'comparacion' as Screen },
                { label: 'Ver alertas del escenario', screen: 'alertas' as Screen },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.screen)}
                  className="w-full text-left text-xs px-3 py-2 rounded transition-colors"
                  style={{
                    border: '1px solid var(--border)',
                    color: '#334155',
                    background: '#f8fafc',
                  }}
                >
                  {action.label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>
    </div>
  );
}
