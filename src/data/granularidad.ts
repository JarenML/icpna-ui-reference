import { CORE, MENSUAL, type EscenarioDetalle } from './constants';

// Order follows the planning hierarchy (Año/Periodo → Modalidad → Programa → Sede → Tipo de Alumno → Curso → Horario)
export type Granularidad =
  | 'general'
  | 'periodo'
  | 'modalidad'
  | 'programa'
  | 'sede'
  | 'tipoAlumno'
  | 'curso'
  | 'horario';

export const GRANULARIDADES: { id: Granularidad; label: string; descripcion: string }[] = [
  { id: 'general', label: 'Resumen general', descripcion: 'Total anual consolidado' },
  { id: 'periodo', label: 'Periodo', descripcion: 'Mensual, 2027-01 a 2027-12' },
  { id: 'modalidad', label: 'Modalidad', descripcion: 'Presencial, Virtual, Semipresencial' },
  { id: 'programa', label: 'Programa', descripcion: 'General, Business, Conversational' },
  { id: 'sede', label: 'Sede', descripcion: '5 sedes de Lima' },
  { id: 'tipoAlumno', label: 'Tipo de Alumno', descripcion: 'Regular, Reingresante, Nuevo' },
  { id: 'curso', label: 'Curso', descripcion: 'Básico a Preparación de exámenes' },
  { id: 'horario', label: 'Horario', descripcion: 'Franjas mañana, tarde, noche y fin de semana' },
];

export interface ComparacionConfig {
  nombre: string;
  escenarios: string[];
  granularidad: Granularidad;
}

// base: share of Baseline (and Meta); lift: share of the scenario's increment over Baseline
interface Miembro {
  nombre: string;
  base: number;
  lift: number;
  meta?: number;
}

const totalBaselineMensual = MENSUAL.reduce((a, m) => a + m.baseline, 0);
const totalMetaMensual = MENSUAL.reduce((a, m) => a + m.meta, 0);
const totalLiftMensual = MENSUAL.reduce((a, m) => a + (m.escenario - m.baseline), 0);

const MIEMBROS: Record<Exclude<Granularidad, 'tipoAlumno'>, Miembro[]> = {
  general: [{ nombre: 'Total ICPNA', base: 1, lift: 1 }],
  periodo: MENSUAL.map((m) => ({
    nombre: m.mes,
    base: m.baseline / totalBaselineMensual,
    lift: (m.escenario - m.baseline) / totalLiftMensual,
    meta: m.meta / totalMetaMensual,
  })),
  modalidad: [
    { nombre: 'Presencial', base: 0.58, lift: 0.5 },
    { nombre: 'Virtual', base: 0.3, lift: 0.38 },
    { nombre: 'Semipresencial', base: 0.12, lift: 0.12 },
  ],
  programa: [
    { nombre: 'General English', base: 0.62, lift: 0.55 },
    { nombre: 'Business English', base: 0.22, lift: 0.27 },
    { nombre: 'Conversational', base: 0.16, lift: 0.18 },
  ],
  sede: [
    { nombre: 'Miraflores', base: 0.24, lift: 0.22 },
    { nombre: 'San Miguel', base: 0.21, lift: 0.26 },
    { nombre: 'Surco', base: 0.19, lift: 0.18 },
    { nombre: 'San Isidro', base: 0.18, lift: 0.17 },
    { nombre: 'La Molina', base: 0.18, lift: 0.17 },
  ],
  curso: [
    { nombre: 'Básico', base: 0.36, lift: 0.4 },
    { nombre: 'Intermedio', base: 0.34, lift: 0.33 },
    { nombre: 'Avanzado', base: 0.22, lift: 0.19 },
    { nombre: 'Preparación de exámenes', base: 0.08, lift: 0.08 },
  ],
  horario: [
    { nombre: 'Mañana', base: 0.24, lift: 0.2 },
    { nombre: 'Tarde', base: 0.3, lift: 0.28 },
    { nombre: 'Noche', base: 0.34, lift: 0.38 },
    { nombre: 'Fin de semana', base: 0.12, lift: 0.14 },
  ],
};

// Retención only applies to Regular students; other interventions split across the three types
const TIPOS_ALUMNO = [
  { nombre: 'Regular', base: 0.68, otros: 0.25 },
  { nombre: 'Reingresante', base: 0.12, otros: 0.2 },
  { nombre: 'Nuevo', base: 0.2, otros: 0.55 },
];

// Splits total into parts by share; the last part absorbs rounding so parts add up to total
const repartir = (total: number, shares: number[]) => {
  const parts = shares.map((s) => Math.round(total * s));
  parts[parts.length - 1] = total - parts.slice(0, -1).reduce((a, b) => a + b, 0);
  return parts;
};

export interface FilaGranular {
  nombre: string;
  baseline: number;
  meta: number;
  escenarios: Record<string, number>;
}

export const desglosar = (granularidad: Granularidad, escenarios: EscenarioDetalle[]): FilaGranular[] => {
  if (granularidad === 'tipoAlumno') {
    const baseline = repartir(CORE.baseline, TIPOS_ALUMNO.map((t) => t.base));
    const meta = repartir(CORE.meta, TIPOS_ALUMNO.map((t) => t.base));
    const porEscenario = escenarios.map((e) => {
      const retencion = e.contribuciones.find((c) => c.name === 'Retención')?.value ?? 0;
      const otros = repartir(e.matriculas - CORE.baseline - retencion, TIPOS_ALUMNO.map((t) => t.otros));
      return otros.map((o, i) => baseline[i] + o + (i === 0 ? retencion : 0));
    });
    return TIPOS_ALUMNO.map((t, i) => ({
      nombre: t.nombre,
      baseline: baseline[i],
      meta: meta[i],
      escenarios: Object.fromEntries(escenarios.map((e, j) => [e.id, porEscenario[j][i]])),
    }));
  }

  const miembros = MIEMBROS[granularidad];
  const baseline = repartir(CORE.baseline, miembros.map((m) => m.base));
  const meta = repartir(CORE.meta, miembros.map((m) => m.meta ?? m.base));
  const porEscenario = escenarios.map((e) => {
    const lift = repartir(e.matriculas - CORE.baseline, miembros.map((m) => m.lift));
    return lift.map((l, i) => baseline[i] + l);
  });
  return miembros.map((m, i) => ({
    nombre: m.nombre,
    baseline: baseline[i],
    meta: meta[i],
    escenarios: Object.fromEntries(escenarios.map((e, j) => [e.id, porEscenario[j][i]])),
  }));
};

// Hierarchy matrix (Reporte Granular): Modalidad → Curso → Horario, Base vs Meta ICPNA.
// Children always add up exactly to their parent, and the top level adds up to Baseline / Meta.
export interface NodoJerarquia {
  id: string;
  nombre: string;
  base: number;
  meta: number;
  hijos?: NodoJerarquia[];
}

const MODALIDADES = MIEMBROS.modalidad;
const CURSOS = MIEMBROS.curso;
const HORARIOS = MIEMBROS.horario;

// Deterministic variation of the growth split so sibling groups don't all grow at the same rate
const variar = (shares: number[], semilla: number) => {
  const v = shares.map((s, i) => s * (1 + 0.18 * Math.sin(semilla * 2.3 + i * 1.7)));
  const total = v.reduce((a, b) => a + b, 0);
  return v.map((x) => x / total);
};

const repartirNodo = (
  base: number,
  meta: number,
  miembros: Miembro[],
  semilla: number,
  idPadre: string,
  hijos?: (nodo: NodoJerarquia, i: number) => NodoJerarquia[],
): NodoJerarquia[] => {
  const bases = repartir(base, miembros.map((m) => m.base));
  const lifts = repartir(meta - base, variar(miembros.map((m) => m.lift), semilla));
  return miembros.map((m, i) => {
    const nodo: NodoJerarquia = { id: `${idPadre}/${m.nombre}`, nombre: m.nombre, base: bases[i], meta: bases[i] + lifts[i] };
    if (hijos) nodo.hijos = hijos(nodo, i);
    return nodo;
  });
};

export const JERARQUIA_MODALIDAD: NodoJerarquia[] = repartirNodo(
  CORE.baseline, CORE.meta, MODALIDADES, 0, 'root',
  (mod, mi) => repartirNodo(
    mod.base, mod.meta, CURSOS, mi + 1, mod.id,
    (cur, ci) => repartirNodo(cur.base, cur.meta, HORARIOS, (mi + 1) * 10 + ci, cur.id),
  ),
);
