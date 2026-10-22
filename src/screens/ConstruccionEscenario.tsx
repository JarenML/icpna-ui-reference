import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Screen } from '../App';
import { FOOTNOTE, ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES, type EscenarioPendiente } from '../data/constants';
import type { BaselineVersion } from '../data/baseline';
import { DIMENSIONES_ALCANCE } from '../data/granularidad';
import { USUARIO_ACTUAL } from '../data/sesion';

// Readable scope: the selected members in hierarchy order ("Presencial → Surco → Nuevo")
const alcanceDe = (granularidad: Record<string, string>) =>
  DIMENSIONES_ALCANCE.map((d) => granularidad[d.id]).filter(Boolean).join(' → ') || 'Toda la institución';

// Every scenario an intervention can belong to (with or without results)
const ESCENARIOS_BASE = [...ESCENARIOS_DETALLE, ...ESCENARIOS_PENDIENTES];

interface Intervention {
  id: number;
  nombre: string;
  impacto: string;
  periodo: string;
  alcance: string;
  clasificacion: 'Regla validada' | 'Supuesto gerencial' | 'Estimación estadística';
  justificacion: string;
  responsable: string;
  tipo?: string;
  escenario: string;
  // Nueva sede: Comercial's initial projection distributed with the pattern of a reference sede
  referencia?: { sedeNueva: string; sedeReferencia: string; proyeccion: number };
}

// Historical weight of each level in the existing sedes (mock data), used to copy the pattern to a new sede
const PATRONES_SEDE: Record<string, { nivel: string; peso: number }[]> = {
  Surco: [
    { nivel: 'Básico', peso: 40 }, { nivel: 'Intermedio', peso: 25 },
    { nivel: 'Avanzado', peso: 15 }, { nivel: 'Kids & Teens', peso: 20 },
  ],
  'San Miguel': [
    { nivel: 'Básico', peso: 45 }, { nivel: 'Intermedio', peso: 22 },
    { nivel: 'Avanzado', peso: 10 }, { nivel: 'Kids & Teens', peso: 23 },
  ],
  Miraflores: [
    { nivel: 'Básico', peso: 30 }, { nivel: 'Intermedio', peso: 28 },
    { nivel: 'Avanzado', peso: 27 }, { nivel: 'Kids & Teens', peso: 15 },
  ],
  'San Isidro': [
    { nivel: 'Básico', peso: 28 }, { nivel: 'Intermedio', peso: 30 },
    { nivel: 'Avanzado', peso: 30 }, { nivel: 'Kids & Teens', peso: 12 },
  ],
  'La Molina': [
    { nivel: 'Básico', peso: 35 }, { nivel: 'Intermedio', peso: 22 },
    { nivel: 'Avanzado', peso: 13 }, { nivel: 'Kids & Teens', peso: 30 },
  ],
};

// Distributes the total with the reference weights; the last row absorbs rounding so it adds up to the total
interface MesInputProps {
  placeholder: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  className: string;
  style: CSSProperties;
}

// Native month inputs show "---- de ----" when empty and don't support placeholders,
// so the field stays as text (showing the placeholder) until it is focused or has a value
function MesInput({ placeholder, value, min, max, onChange, className, style }: MesInputProps) {
  const [editando, setEditando] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const esMes = editando || value !== '';

  useEffect(() => {
    if (!editando) return;
    try {
      ref.current?.showPicker();
    } catch {
      // showPicker is not supported or not allowed: the user can still type or open the picker manually
    }
  }, [editando]);

  return (
    <input
      ref={ref}
      type={esMes ? 'month' : 'text'}
      aria-label={placeholder}
      placeholder={placeholder}
      className={className}
      style={style}
      min={min}
      max={max}
      value={value}
      onFocus={() => setEditando(true)}
      onBlur={() => setEditando(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

const distribuir = (total: number, sede: string) => {
  const patron = PATRONES_SEDE[sede];
  let asignado = 0;
  return patron.map((p, i) => {
    const matriculas = i === patron.length - 1 ? total - asignado : Math.round((total * p.peso) / 100);
    asignado += matriculas;
    return { ...p, matriculas };
  });
};

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
    justificacion: 'Supuesto de incremento moderado en participación de cursos premium.',
    responsable: 'Gerencia Comercial',
    escenario: 'esc03',
    tipo: 'Precio / descuento',
  },
];

const PASOS = ['Información e identificación', 'Impacto y sustento', 'Vigencia y alcance'];

const TIPOS_INTERVENCION = [
  'Retención', 'Crecimiento de matrícula', 'Campaña comercial',
  'Precio / descuento', 'Nueva sede', 'Nuevo curso', 'Nuevo horario',
  'Alumno promedio por clase',
];

interface Props {
  navigate: (s: Screen) => void;
  onSimulate: () => void;
  creados: EscenarioPendiente[];
  baseline: BaselineVersion;
}

export default function ConstruccionEscenario({ navigate, onSimulate, creados, baseline }: Props) {
  // An intervention can only apply within the periods covered by the scenario's baseline ("2027-01 a 2027-12")
  const [periodoMin, periodoMax] = baseline.periodos.split(' a ');
  const ESCENARIOS = [...ESCENARIOS_BASE, ...creados].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const escenarioDe = (id: string) => ESCENARIOS.find((e) => e.id === id);
  const [interventions, setInterventions] = useState(initialInterventions);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paso, setPaso] = useState(0);
  const formInicial = {
    nombre: '', periodoDesde: '', periodoHasta: '', granularidad: {} as Record<string, string>, tipo: TIPOS_INTERVENCION[0],
    impacto: '', justificacion: '', escenario: 'esc03',
    clasificacion: 'Supuesto gerencial' as Intervention['clasificacion'],
    sedeNueva: 'Chorrillos', proyeccion: '300', sedeReferencia: 'Surco',
  };
  const [form, setForm] = useState(formInicial);
  const esNuevaSede = form.tipo === 'Nueva sede';
  const proyeccion = Math.max(0, parseInt(form.proyeccion, 10) || 0);

  const handleAddIntervention = () => {
    // The name is on the first step: go back there so the user sees what is missing
    if (!form.nombre) { setPaso(0); return; }
    setInterventions(prev => [...prev, {
      id: prev.length + 1,
      nombre: form.nombre,
      impacto: form.impacto,
      periodo: form.periodoDesde && form.periodoHasta
        ? `${form.periodoDesde} a ${form.periodoHasta}`
        : form.periodoDesde ? `Desde ${form.periodoDesde}` : '',
      alcance: alcanceDe(form.granularidad),
      clasificacion: form.clasificacion,
      justificacion: form.justificacion,
      responsable: USUARIO_ACTUAL.nombre,
      tipo: form.tipo,
      escenario: form.escenario,
      referencia: esNuevaSede
        ? { sedeNueva: form.sedeNueva, sedeReferencia: form.sedeReferencia, proyeccion }
        : undefined,
    }]);
    setPanelOpen(false);
    setForm(formInicial);
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
            onClick={() => { setPaso(0); setPanelOpen(true); }}
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

              <div className="grid grid-cols-3 gap-4 px-4 py-3 text-xs">
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Periodo</div>
                  <div style={{ color: '#334155' }}>{inv.periodo}</div>
                </div>
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alcance / Granularidad</div>
                  <div style={{ color: '#334155' }}>{inv.alcance}</div>
                </div>
                <div>
                  <div className="font-medium mb-0.5" style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsable</div>
                  <div style={{ color: '#334155' }}>{inv.responsable}</div>
                </div>
              </div>

              <div className="px-4 pb-3 text-xs" style={{ color: '#64748b' }}>
                <span className="font-medium" style={{ color: '#475569' }}>Justificación:</span> {inv.justificacion}
                {inv.referencia && (
                  <div
                    className="flex gap-1.5 mt-2 p-2 rounded text-xs"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
                  >
                    <span>⇢</span>
                    <span>
                      <strong>{inv.referencia.sedeNueva}</strong> copia el patrón de <strong>{inv.referencia.sedeReferencia}</strong>:{' '}
                      {inv.referencia.proyeccion.toLocaleString('en-US')} matrículas iniciales (Comercial) repartidas con los pesos históricos de la sede de referencia.
                    </span>
                  </div>
                )}
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

      {/* New intervention modal */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(15, 23, 42, 0.45)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPanelOpen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nueva-intervencion-title"
            className="flex flex-col w-full"
            style={{
              maxWidth: 960,
              maxHeight: 'calc(100vh - 48px)',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
            }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 id="nueva-intervencion-title" className="font-semibold" style={{ color: '#0f172a' }}>Nueva Intervención</h3>
              <button
                onClick={() => setPanelOpen(false)}
                style={{ color: '#94a3b8', fontSize: 18, border: 'none', background: 'none' }}
              >
                ✕
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center px-8 py-3" style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              {PASOS.map((nombre, i) => (
                <Fragment key={nombre}>
                  <button
                    onClick={() => setPaso(i)}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                      style={{
                        width: 24, height: 24, transition: 'background 500ms, color 500ms',
                        background: i <= paso ? '#1e40af' : '#e2e8f0',
                        color: i <= paso ? '#fff' : '#64748b',
                      }}
                    >
                      {i < paso ? '✓' : i + 1}
                    </span>
                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: i === paso ? '#0f172a' : '#64748b' }}>{nombre}</span>
                  </button>
                  {/* The connectors take all the free width, spreading the steps across the bar */}
                  {i < PASOS.length - 1 && (
                    <span className="flex-1 mx-5" style={{ height: 2, background: i < paso ? '#1e40af' : '#e2e8f0', transition: 'background 500ms' }} />
                  )}
                </Fragment>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Pages slide horizontally: each step is a full-width page */}
              <div
                className="flex items-stretch"
                style={{ transform: `translateX(-${paso * 100}%)`, transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <section className="w-full flex-shrink-0 flex flex-col px-5 py-4" inert={paso !== 0} aria-hidden={paso !== 0}>
                  <div className="flex items-baseline gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-mono font-semibold text-xs" style={{ color: '#2563eb' }}>01</span>
                    <h4 className="font-semibold text-sm" style={{ color: '#0f172a' }}>Información e identificación</h4>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Qué es, quién la registra y su sustento</span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3 flex-1 content-start">
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

                    <div>
                      <label className={labelCls} style={{ color: '#334155' }}>Nombre de la intervención</label>
                      <input
                        type="text"
                        className={inputCls}
                        style={inputStyle}
                        placeholder="Ej. Campaña de Captación Semestre 2"
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className={labelCls} style={{ color: '#334155' }}>Responsable</label>
                      <input
                        type="text"
                        readOnly
                        className={inputCls}
                        style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                        title="Se asigna automáticamente al usuario con sesión iniciada"
                        value={USUARIO_ACTUAL.nombre}
                      />
                    </div>

                    <div className="col-span-3">
                      <label className={labelCls} style={{ color: '#334155' }}>Justificación / Fuente</label>
                      <textarea
                        rows={5}
                        className={inputCls}
                        style={inputStyle}
                        placeholder="Describa el sustento de esta intervención"
                        value={form.justificacion}
                        onChange={(e) => setForm((prev) => ({ ...prev, justificacion: e.target.value }))}
                      />
                    </div>
                  </div>
                </section>

                <section className="w-full flex-shrink-0 flex flex-col px-5 py-4" inert={paso !== 1} aria-hidden={paso !== 1}>
                  <div className="flex items-baseline gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-mono font-semibold text-xs" style={{ color: '#2563eb' }}>02</span>
                    <h4 className="font-semibold text-sm" style={{ color: '#0f172a' }}>Impacto y sustento</h4>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Tipo, método de cálculo y magnitud aplicada</span>
                  </div>
                  <div className={`grid ${esNuevaSede ? 'grid-cols-3' : 'grid-cols-1'} gap-x-4 gap-y-3 flex-1 content-start`}>
                    <div>
                      <label className={labelCls} style={{ color: '#334155' }}>Tipo de intervención</label>
                      <select
                        className={inputCls}
                        style={inputStyle}
                        value={form.tipo}
                        onChange={(e) => {
                          const tipo = e.target.value;
                          // A new sede has no history of its own: it is always estimated from a reference sede
                          setForm((prev) => ({ ...prev, tipo, ...(tipo === 'Nueva sede' && { clasificacion: 'Estimación estadística' as const }) }));
                        }}
                      >
                        {TIPOS_INTERVENCION.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelCls} style={{ color: '#334155' }}>Clasificación</label>
                      <select
                        className={inputCls}
                        style={{ ...inputStyle, ...(esNuevaSede && { background: '#f1f5f9', color: '#64748b' }) }}
                        value={form.clasificacion}
                        disabled={esNuevaSede}
                        title={esNuevaSede ? 'Se estima con la historia de la sede de referencia' : undefined}
                        onChange={(e) => setForm((prev) => ({ ...prev, clasificacion: e.target.value as any }))}
                      >
                        {['Regla validada', 'Supuesto gerencial', 'Estimación estadística'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelCls} style={{ color: '#334155' }}>Impacto estimado</label>
                      <input
                        type="text"
                        className={inputCls}
                        style={inputStyle}
                        placeholder="Ej. +2.5% alumnos nuevos"
                        value={form.impacto}
                        onChange={(e) => setForm((prev) => ({ ...prev, impacto: e.target.value }))}
                      />
                    </div>

                    {esNuevaSede && (
                      <div className="col-span-3 rounded-md p-3 space-y-3" style={{ background: '#f8fafc', border: '1px solid #bfdbfe' }}>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: '#1e40af' }}>Sede de referencia</div>
                          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                            La sede nueva no tiene historia propia: el total lo define Comercial y se reparte como en una sede parecida.
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls} style={{ color: '#334155' }}>Sede nueva</label>
                            <input
                              type="text"
                              className={inputCls}
                              style={inputStyle}
                              value={form.sedeNueva}
                              onChange={(e) => setForm((prev) => ({ ...prev, sedeNueva: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className={labelCls} style={{ color: '#334155' }}>
                              Proyección inicial <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Comercial)</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              className={inputCls}
                              style={inputStyle}
                              value={form.proyeccion}
                              onChange={(e) => setForm((prev) => ({ ...prev, proyeccion: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={labelCls} style={{ color: '#334155' }}>
                            Copiar patrón de <span style={{ color: '#94a3b8', fontWeight: 400 }}>(definida por GOP)</span>
                          </label>
                          <select
                            className={inputCls}
                            style={inputStyle}
                            value={form.sedeReferencia}
                            onChange={(e) => setForm((prev) => ({ ...prev, sedeReferencia: e.target.value }))}
                          >
                            {Object.keys(PATRONES_SEDE).map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-medium mb-1" style={{ color: '#334155' }}>
                            Vista previa — cómo quedaría {form.sedeNueva || 'la sede nueva'}
                          </div>
                          <table className="w-full text-xs" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', color: '#64748b' }}>
                                <th className="text-left font-medium px-2 py-1">Nivel</th>
                                <th className="text-right font-medium px-2 py-1">Peso en {form.sedeReferencia}</th>
                                <th className="text-right font-medium px-2 py-1">Matrículas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {distribuir(proyeccion, form.sedeReferencia).map((r) => (
                                <tr key={r.nivel} style={{ borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                                  <td className="px-2 py-1">{r.nivel}</td>
                                  <td className="px-2 py-1 text-right font-mono">{r.peso}%</td>
                                  <td className="px-2 py-1 text-right font-mono">{r.matriculas.toLocaleString('en-US')}</td>
                                </tr>
                              ))}
                              <tr className="font-semibold" style={{ borderTop: '1px solid var(--border)', color: '#0f172a' }}>
                                <td className="px-2 py-1">Total</td>
                                <td className="px-2 py-1 text-right font-mono">100%</td>
                                <td className="px-2 py-1 text-right font-mono">{proyeccion.toLocaleString('en-US')}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="w-full flex-shrink-0 flex flex-col px-5 py-4" inert={paso !== 2} aria-hidden={paso !== 2}>
                  <div className="flex items-baseline gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-mono font-semibold text-xs" style={{ color: '#2563eb' }}>03</span>
                    <h4 className="font-semibold text-sm" style={{ color: '#0f172a' }}>Vigencia y alcance</h4>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Cuándo tiene efecto y a qué combinación de la jerarquía se aplica</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 flex-1 content-evenly">
                    <div className="col-span-2">
                      <label className={labelCls} style={{ color: '#334155' }}>Periodo de aplicación</label>
                        <>
                          <div className="flex items-center gap-2">
                            <MesInput
                              placeholder="Inicio"
                              className={inputCls}
                              style={inputStyle}
                              min={periodoMin}
                              max={periodoMax}
                              value={form.periodoDesde}
                              onChange={(desde) => {
                                // Keep the range valid: the end can't be earlier than the start
                                setForm((prev) => ({ ...prev, periodoDesde: desde, periodoHasta: prev.periodoHasta && prev.periodoHasta < desde ? desde : prev.periodoHasta }));
                              }}
                            />
                            <span className="text-xs" style={{ color: '#64748b' }}>a</span>
                            <MesInput
                              placeholder="Fin"
                              className={inputCls}
                              style={inputStyle}
                              min={form.periodoDesde || periodoMin}
                              max={periodoMax}
                              value={form.periodoHasta}
                              onChange={(hasta) => setForm((prev) => ({ ...prev, periodoHasta: hasta }))}
                            />
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                            Limitado al Baseline {baseline.codigo} ({periodoMin} a {periodoMax})
                          </div>
                        </>
                    </div>

                    <div className="col-span-2 rounded-md p-3" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                        {DIMENSIONES_ALCANCE.map((d) => (
                          <div key={d.id}>
                            <label className="block mb-0.5" style={{ color: '#64748b', fontSize: 11 }}>{d.label}</label>
                            <select
                              className={inputCls}
                              style={inputStyle}
                              value={form.granularidad[d.id] ?? ''}
                              onChange={(e) => setForm((prev) => ({ ...prev, granularidad: { ...prev.granularidad, [d.id]: e.target.value } }))}
                            >
                              <option value="">Todos</option>
                              {d.opciones.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs mt-2.5 pt-2" style={{ borderTop: '1px solid var(--border)', color: '#64748b' }}>
                        Alcance: <span className="font-medium" style={{ color: '#0f172a' }}>{alcanceDe(form.granularidad)}</span>
                      </div>
                      {alcanceDe(form.granularidad) === 'Toda la institución' && (
                        <div className="text-xs mt-1" style={{ color: '#b45309' }}>
                          Sin dimensiones seleccionadas, la intervención afecta a toda la institución.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setPanelOpen(false)}
                className="px-4 py-2 rounded font-medium text-sm"
                style={{ border: '1px solid var(--border)', color: '#64748b', background: '#f8fafc' }}
              >
                Cancelar
              </button>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setPaso((p) => Math.max(0, p - 1))}
                  disabled={paso === 0}
                  aria-label="Paso anterior"
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                  style={{ width: 36, height: 36, border: '1px solid var(--border)', color: '#334155', background: '#fff' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                {paso < PASOS.length - 1 ? (
                  <button
                    onClick={() => setPaso((p) => p + 1)}
                    className="flex items-center gap-1.5 pl-5 pr-4 py-2 rounded font-semibold text-sm transition-colors hover:bg-blue-900"
                    style={{ background: '#1e40af', color: '#fff', border: 'none' }}
                  >
                    Siguiente
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleAddIntervention}
                    className="px-5 py-2 rounded font-semibold text-sm"
                    style={{ background: '#1e40af', color: '#fff', border: 'none' }}
                  >
                    Añadir intervención
                  </button>
                )}
              </div>
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
