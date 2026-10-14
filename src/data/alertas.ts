import type { Screen } from '../App';
import { CORE, ESCENARIOS_DETALLE, ESCENARIOS_PENDIENTES, REF_SUPERIOR_IC, formatNum } from './constants';

export type NivelAlerta = 'Crítica' | 'Advertencia' | 'Error' | 'Informativa';

export interface Alerta {
  id: string;
  tipo: 'Meta fuera de las bandas' | 'Brecha de capacidad' | 'Clases sin aula' | 'Valor fuera de límite' | 'Estado de la simulación';
  nivel: NivelAlerta;
  titulo: string;
  descripcion: string;
  // null = applies to every scenario (e.g. the Meta ICPNA itself)
  escenarioId: string | null;
  escenarioLabel: string;
  sedes: string[];
  periodos: string[];
  datos: { label: string; value: string; destacado?: boolean }[];
  progreso?: number;
  accion: string;
  destino: Screen;
}

const ORDEN_NIVEL: Record<NivelAlerta, number> = { 'Crítica': 0, 'Error': 1, 'Advertencia': 2, 'Informativa': 3 };

const etiqueta = (e: { codigo: string; nombreCorto: string; descripcion: string }) => `${e.nombreCorto} — ${e.descripcion}`;

const alertas: Alerta[] = [];

// Meta fuera de las bandas: the Meta ICPNA is above the Baseline's upper confidence limit
if (CORE.meta > REF_SUPERIOR_IC) {
  alertas.push({
    id: 'meta-bandas',
    tipo: 'Meta fuera de las bandas',
    nivel: 'Advertencia',
    titulo: 'Meta por encima del rango estadístico',
    descripcion: `La Meta ICPNA supera el límite superior del IC 95% del Baseline. Es una meta exigente: no se bloquea, pero requiere justificarse con intervenciones.`,
    escenarioId: null,
    escenarioLabel: 'Meta ICPNA · aplica a todos los escenarios',
    sedes: [],
    periodos: ['2027-01', '2027-02', '2027-03'],
    datos: [
      { label: 'Meta ICPNA', value: formatNum(CORE.meta) },
      { label: 'Límite superior IC 95%', value: formatNum(REF_SUPERIOR_IC) },
      { label: 'Exceso sobre la banda', value: `+${formatNum(CORE.meta - REF_SUPERIOR_IC)}`, destacado: true },
    ],
    accion: 'Ver bandas',
    destino: 'resumen',
  });
}

// Brecha de capacidad: one alert per scenario whose required classes exceed availability
for (const e of ESCENARIOS_DETALLE) {
  const brechas = e.capacidad.filter((c) => c.requerida > c.disponible);
  if (!brechas.length) continue;
  const total = brechas.reduce((a, c) => a + c.requerida - c.disponible, 0);
  alertas.push({
    id: `brecha-${e.id}`,
    tipo: 'Brecha de capacidad',
    nivel: 'Crítica',
    titulo: `Brecha de capacidad: el escenario no es factible tal cual en ${brechas.length} sede${brechas.length > 1 ? 's' : ''}`,
    descripcion: `El escenario requiere +${total} clases por encima de la capacidad disponible. Revise la distribución por franjas o ajuste las intervenciones.`,
    escenarioId: e.id,
    escenarioLabel: etiqueta(e),
    sedes: brechas.map((c) => c.sede),
    periodos: [...new Set(brechas.map((c) => c.periodo))],
    datos: brechas.map((c) => ({
      label: `${c.sede} · ${c.periodo}`,
      value: `${c.requerida} / ${c.disponible} (+${c.requerida - c.disponible})`,
      destacado: true,
    })),
    accion: 'Revisar horarios',
    destino: 'granular',
  });
}

// Clases sin aula: after trying to relocate classes, no room is left (the not-feasible scenario)
const noFactible = ESCENARIOS_DETALLE.find((e) => e.factibilidad === 'No factible');
if (noFactible) {
  alertas.push({
    id: `sin-aula-${noFactible.id}`,
    tipo: 'Clases sin aula',
    nivel: 'Crítica',
    titulo: 'Clases sin aula después de reubicar',
    descripcion: 'Se intentó mover las clases excedentes a otras franjas horarias, pero no quedan aulas libres en la sede.',
    escenarioId: noFactible.id,
    escenarioLabel: etiqueta(noFactible),
    sedes: ['Miraflores'],
    periodos: ['2027-03'],
    datos: [
      { label: 'Sede · Periodo', value: 'Miraflores · 2027-03' },
      { label: 'Franja', value: 'Lun–Vie · 19:00–21:00' },
      { label: 'Clases reubicadas', value: '7 de 11' },
      { label: 'Clases sin aula', value: '4', destacado: true },
    ],
    accion: 'Ver franjas',
    destino: 'granular',
  });
}

// Valor fuera de límite: raised when registering an intervention; blocks the draft from being simulated
const borrador = ESCENARIOS_PENDIENTES.find((e) => e.estado === 'Borrador');
if (borrador) {
  alertas.push({
    id: `limite-${borrador.id}`,
    tipo: 'Valor fuera de límite',
    nivel: 'Error',
    titulo: 'Valor fuera de límite: retención mayor a 100%',
    descripcion: 'El ajuste registrado lleva la retención por encima del máximo permitido (0% a 100%). La intervención no se puede guardar hasta corregir el valor.',
    escenarioId: borrador.id,
    escenarioLabel: etiqueta(borrador),
    sedes: [],
    periodos: ['2027-01'],
    datos: [
      { label: 'Retención actual', value: '78.3%' },
      { label: 'Ajuste registrado', value: '+26.0 pts' },
      { label: 'Resultado', value: '104.3%', destacado: true },
      { label: 'Máximo permitido', value: '100.0%' },
    ],
    accion: 'Corregir valor',
    destino: 'intervenciones',
  });
}

// Estado de la simulación: heavy simulations running in the background
for (const e of ESCENARIOS_PENDIENTES.filter((x) => x.estado === 'En proceso')) {
  alertas.push({
    id: `proceso-${e.id}`,
    tipo: 'Estado de la simulación',
    nivel: 'Informativa',
    titulo: 'Simulación en proceso',
    descripcion: 'El escenario se está simulando en segundo plano. Puede seguir trabajando; el resultado estará disponible en la lista de escenarios.',
    escenarioId: e.id,
    escenarioLabel: etiqueta(e),
    sedes: [],
    periodos: [],
    datos: [
      { label: 'Intervenciones', value: String(e.intervenciones.length) },
      { label: 'Estado', value: 'Procesando · 62%' },
    ],
    progreso: 62,
    accion: 'Ver escenarios',
    destino: 'listaEscenarios',
  });
}

export const ALERTAS: Alerta[] = alertas.sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);

// Alerts that need attention (shown as the red badge in the navigation)
export const ALERTAS_PENDIENTES = ALERTAS.filter((a) => a.nivel !== 'Informativa').length;
