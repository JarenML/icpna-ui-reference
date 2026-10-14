import { useState } from 'react';
import type { Screen } from '../App';
import { FOOTNOTE, ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES, type EscenarioPendiente } from '../data/constants';

// Every scenario an intervention can belong to (with or without results)
const ESCENARIOS_BASE = [...ESCENARIOS_DETALLE, ...ESCENARIOS_PENDIENTES];

interface Intervention {
  id: number;
  nombre: string;
  impacto: string;
  periodo: string;
  alcance: string;
  clasificacion: 'Regla validada' | 'Supuesto gerencial' | 'Estimación estadística';
  persistencia: string;
  justificacion: string;
  responsable: string;
  tipo?: string;
  escenario: string;
}

const clasificacionBadge = (c: Intervention['clasificacion']) => {
  const map = {
    'Regla validada': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'Supuesto gerencial': { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    'Estimación estadística': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  };
  const s = map[c];
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {c}
    </span>
  );
};

const initialInterventions: Intervention[] = [
  {
    id: 1,
    nombre: 'Mejora de Retención',
    impacto: '+2.2% → +5,100 mat.',
    periodo: '2027-01 a 2027-12',
    alcance: 'Lima → Presencial → Alumnos Regulares',
    clasificacion: 'Regla validada',
    persistencia: 'Acumulativo',
    justificacion: 'Objetivo de mejora de continuidad académica aprobado para planificación.',
    responsable: 'Gerencia Comercial',
    escenario: 'esc03',
    tipo: 'Retención',
  },
  {
    id: 2,
    nombre: 'Campaña de Captación — Verano 2027',
    impacto: '+3.0% alumnos nuevos → +4,200 mat.',
    periodo: '2027-01 a 2027-03',
    alcance: 'Lima → Todas las sedes → Alumnos Nuevos',
    clasificacion: 'Supuesto gerencial',
    persistencia: 'Con decaimiento',
    justificacion: 'Campaña estacional considerada dentro del plan comercial.',
    responsable: 'Gerencia Comercial',
    escenario: 'esc03',
    tipo: 'Campaña comercial',
  },
  {
    id: 3,
    nombre: 'Nuevo Horario — Sede San Miguel',
    impacto: '+1,350 alumnos nuevos · +1,050 redistribuidos',
    periodo: 'Desde 2027-03',
    alcance: 'San Miguel → Presencial → Noche (Sáb)',
    clasificacion: 'Estimación estadística',
    persistencia: 'Permanente',
    justificacion: 'Análisis de horarios comparables históricos en otras sedes.',
    responsable: 'Gerencia Académica',
    escenario: 'esc03',
    tipo: 'Nuevo horario',
  },
  {
    id: 4,
    nombre: 'Ajuste de Precio / Mix de Cursos',
    impacto: '+890 mat. (efecto precio-elasticidad)',
    periodo: '2027-04 a 2027-12',
    alcance: 'Nacional → Todas las sedes → Mixto',
    clasificacion: 'Supuesto gerencial',
    persistencia: 'Con decaimiento',
    justificacion: 'Supuesto de incremento moderado en participación de cursos premium.',
    responsable: 'Gerencia Comercial',
    escenario: 'esc03',
    tipo: 'Precio / descuento',
  },
];

const TIPOS_INTERVENCION = [
  'Retención', 'Crecimiento de matrícula', 'Campaña comercial',
  'Precio / descuento', 'Nueva sede', 'Nuevo curso', 'Nuevo horario',
  'Alumno promedio por clase',
];

interface Props {
  navigate: (s: Screen) => void;
  onSimulate: () => void;
  creados: EscenarioPendiente[];
}

export default function ConstruccionEscenario({ navigate, onSimulate, creados }: Props) {
  const ESCENARIOS = [...ESCENARIOS_BASE, ...creados].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const escenarioDe = (id: string) => ESCENARIOS.find((e) => e.id === id);
  const [interventions, setInterventions] = useState(initialInterventions);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '', periodo: '', granularidad: '', tipo: TIPOS_INTERVENCION[0],
    impacto: '', persistencia: 'Acumulativo', justificacion: '', responsable: '', escenario: 'esc03',
    clasificacion: 'Supuesto gerencial' as Intervention['clasificacion'],
  });

  const handleAddIntervention = () => {
    if (!form.nombre) return;
    setInterventions(prev => [...prev, {
      id: prev.length + 1,
      nombre: form.nombre,
      impacto: form.impacto,
      periodo: form.periodo,
      alcance: form.granularidad,
      clasificacion: form.clasificacion,
      persistencia: form.persistencia,
      justificacion: form.justificacion,
      responsable: form.responsable,
      tipo: form.tipo,
      escenario: form.escenario,
    }]);
    setPanelOpen(false);
    setForm({ nombre: '', periodo: '', granularidad: '', tipo: TIPOS_INTERVENCION[0], impacto: '', persistencia: 'Acumulativo', justificacion: '', responsable: '', escenario: 'esc03', clasificacion: 'Supuesto gerencial' });
  };

  const removeIntervention = (id: number) => {
    setInterventions(prev => prev.filter(i => i.id !== id));
  };

  const inputCls = "w-full border rounded px-2.5 py-1.5 text-sm";
  const inputStyle = { border: '1px solid var(--border)', borderRadius: 4, color: '#334155', background: '#fff' };
  const labelCls = "block text-xs font-medium mb-1";

  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Construcción de Escenario</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Configure las iniciativas que serán aplicadas sobre el Baseline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-3 py-1.5 rounded border font-medium"
            style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
          >
            Guardar versión
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded border font-medium"
            style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
          >
            Duplicar escenario
          </button>
          <button
            onClick={onSimulate}
            className="text-sm px-5 py-1.5 rounded font-semibold transition-colors"
            style={{ background: '#1e40af', color: '#fff', border: 'none' }}
          >
            ▶ Ejecutar simulación
          </button>
        </div>
      </div>

      {/* Baseline status banner */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded"
        style={{ background: '#f8fafc', border: '1px solid var(--border)' }}
      >
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded" style={{ background: '#e2e8f0', color: '#64748b' }}>
          Solo lectura
        </span>
        <span className="text-sm font-semibold" style={{ color: '#334155' }}>
          Baseline 2027 / Versión 2027.01
        </span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          · Generado externamente · No editable · 184,250 matrículas proyectadas
        </span>
      </div>

      {/* Intervention cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm" style={{ color: '#0f172a' }}>
            Intervenciones del Escenario
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
              style={{ background: '#eff6ff', color: '#1e40af' }}
            >
              {interventions.length} activas
            </span>
          </h2>
          <button
            onClick={() => setPanelOpen(true)}
            className="text-sm px-3 py-1.5 rounded font-medium transition-colors"
            style={{ background: '#fff', border: '1px solid #2563eb', color: '#2563eb' }}
          >
            + Añadir intervención
          </button>
        </div>

        <div className="space-y-3">
          {interventions.map((inv) => (
            <div
              key={inv.id}
              className="rounded-md"
              style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center text-xs font-bold rounded"
                    style={{ width: 24, height: 24, background: '#eff6ff', color: '#1e40af' }}
                  >
                    {inv.id.toString().padStart(2, '0')}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>{inv.nombre}</span>
                  {escenarioDe(inv.escenario) && (
                    <span
                      title={`Pertenece a ${escenarioDe(inv.escenario)!.nombreCorto} — ${escenarioDe(inv.escenario)!.descripcion}`}
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ background: '#fff', color: '#1e40af', border: '1px solid #bfdbfe' }}
                    >
                      <span className="font-mono font-semibold">{escenarioDe(inv.escenario)!.codigo}</span>
                      <span style={{ color: '#64748b' }}>{escenarioDe(inv.escenario)!.descripcion}</span>
                    </span>
                  )}
                  {clasificacionBadge(inv.clasificacion)}
                  {inv.tipo && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {inv.tipo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm" style={{ color: '#16a34a' }}>
                    {inv.impacto}
                  </span>
                  <button
                    onClick={() => removeIntervention(inv.id)}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 px-4 py-3 text-xs">
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Periodo</div>
                  <div style={{ color: '#334155' }}>{inv.periodo}</div>
                </div>
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alcance / Granularidad</div>
                  <div style={{ color: '#334155' }}>{inv.alcance}</div>
                </div>
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Persistencia</div>
                  <div style={{ color: '#334155' }}>{inv.persistencia}</div>
                </div>
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsable</div>
                  <div style={{ color: '#334155' }}>{inv.responsable}</div>
                </div>
              </div>

              <div className="px-4 pb-3 text-xs" style={{ color: '#64748b' }}>
                <span className="font-medium" style={{ color: '#475569' }}>Justificación:</span> {inv.justificacion}
                {inv.id === 1 && (
                  <div
                    className="flex gap-1.5 mt-2 p-2 rounded text-xs"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
                  >
                    <span>ℹ</span>
                    <span>Esta intervención aplica exclusivamente sobre alumnos <strong>Regulares</strong>. No afecta directamente a Reingresantes ni Nuevos.</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="flex items-center gap-6 px-5 py-3 rounded"
        style={{ background: '#fff', border: '1px solid var(--border)' }}
      >
        <div className="text-xs" style={{ color: '#64748b' }}>
          Contribución total estimada:
          <span className="font-mono font-bold text-sm ml-2" style={{ color: '#16a34a' }}>+12,590 matrículas</span>
        </div>
        <div className="text-xs" style={{ color: '#64748b' }}>
          Escenario proyectado:
          <span className="font-mono font-bold text-sm ml-2" style={{ color: '#1e40af' }}>196,840</span>
        </div>
        <div className="text-xs" style={{ color: '#64748b' }}>
          Cumplimiento de Meta:
          <span className="font-mono font-bold text-sm ml-2" style={{ color: '#16a34a' }}>98.4%</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={onSimulate}
            className="text-sm px-6 py-2 rounded font-semibold"
            style={{ background: '#1e40af', color: '#fff', border: 'none' }}
          >
            ▶ Ejecutar simulación
          </button>
        </div>
      </div>

      {/* Side panel overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(15,23,42,0.35)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPanelOpen(false); }}
        >
          <div
            className="flex flex-col h-full overflow-y-auto"
            style={{ width: 420, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold" style={{ color: '#0f172a' }}>Nueva Intervención</h3>
              <button
                onClick={() => setPanelOpen(false)}
                style={{ color: '#94a3b8', fontSize: 18, border: 'none', background: 'none' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              <div>
                <label className={labelCls} style={{ color: '#334155' }}>Escenario</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.escenario}
                  onChange={(e) => setForm((prev) => ({ ...prev, escenario: e.target.value }))}
                >
                  {ESCENARIOS.map((e) => (
                    <option key={e.id} value={e.id}>{e.codigo} — {e.descripcion}</option>
                  ))}
                </select>
              </div>

              {[
                { key: 'nombre', label: 'Nombre de la intervención', type: 'text', placeholder: 'Ej. Campaña de Captación Semestre 2' },
                { key: 'periodo', label: 'Periodo de aplicación', type: 'text', placeholder: 'Ej. 2027-04 a 2027-06' },
                { key: 'granularidad', label: 'Granularidad / Alcance', type: 'text', placeholder: 'Ej. Lima → Miraflores → Presencial' },
                { key: 'impacto', label: 'Impacto estimado', type: 'text', placeholder: 'Ej. +2.5% alumnos nuevos' },
                { key: 'responsable', label: 'Responsable', type: 'text', placeholder: 'Ej. Gerencia Comercial' },
                { key: 'justificacion', label: 'Justificación / Fuente', type: 'textarea', placeholder: 'Describa el sustento de esta intervención' },
              ].map((f) => (
                <div key={f.key}>
                  <label className={labelCls} style={{ color: '#334155' }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      className={inputCls}
                      style={inputStyle}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type="text"
                      className={inputCls}
                      style={inputStyle}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className={labelCls} style={{ color: '#334155' }}>Tipo de intervención</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                >
                  {TIPOS_INTERVENCION.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls} style={{ color: '#334155' }}>Clasificación</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.clasificacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, clasificacion: e.target.value as any }))}
                >
                  {['Regla validada', 'Supuesto gerencial', 'Estimación estadística'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} style={{ color: '#334155' }}>Persistencia</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.persistencia}
                  onChange={(e) => setForm((prev) => ({ ...prev, persistencia: e.target.value }))}
                >
                  {['Acumulativo', 'Con decaimiento', 'Permanente', 'Puntual'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 py-2 rounded font-medium text-sm"
                style={{ border: '1px solid var(--border)', color: '#64748b', background: '#f8fafc' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddIntervention}
                className="flex-1 py-2 rounded font-semibold text-sm"
                style={{ background: '#1e40af', color: '#fff', border: 'none' }}
              >
                Añadir intervención
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 pb-4">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>
      </div>
    </div>
  );
}
