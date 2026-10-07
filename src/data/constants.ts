// Core scenario values — consistent across all screens
export const CORE = {
  baseline: 184_250,
  meta: 200_000,
  escenario: 196_840,
  brecha: -3_160,
  cumplimiento: 98.4,
  // Contributions
  retencion: 5_100,
  campana: 4_200,
  horarios: 2_400,
  precioMix: 890,
  totalContribucion: 12_590,
};

// Monthly time-series data (all periods sum to annual totals)
export const MENSUAL = [
  { periodo: 'Ene', mes: '2027-01', baseline: 14_200, escenario: 15_400, meta: 15_800, capacidad: 17_500, equilibrio: 11_000, icSup: 14_993, icInf: 13_407 },
  { periodo: 'Feb', mes: '2027-02', baseline: 16_800, escenario: 17_800, meta: 18_200, capacidad: 18_500, equilibrio: 11_000, icSup: 17_725, icInf: 15_875 },
  { periodo: 'Mar', mes: '2027-03', baseline: 17_500, escenario: 19_200, meta: 19_700, capacidad: 18_800, equilibrio: 11_000, icSup: 18_463, icInf: 16_538, alertCapacidad: true },
  { periodo: 'Abr', mes: '2027-04', baseline: 15_200, escenario: 16_300, meta: 16_800, capacidad: 17_800, equilibrio: 11_000, icSup: 16_036, icInf: 14_364 },
  { periodo: 'May', mes: '2027-05', baseline: 16_100, escenario: 17_100, meta: 17_600, capacidad: 18_800, equilibrio: 11_000, icSup: 16_986, icInf: 15_215 },
  { periodo: 'Jun', mes: '2027-06', baseline: 15_800, escenario: 16_700, meta: 17_200, capacidad: 18_800, equilibrio: 11_000, icSup: 16_670, icInf: 14_930 },
  { periodo: 'Jul', mes: '2027-07', baseline: 14_500, escenario: 15_200, meta: 15_600, capacidad: 16_500, equilibrio: 11_000, icSup: 15_298, icInf: 13_703 },
  { periodo: 'Ago', mes: '2027-08', baseline: 16_400, escenario: 17_200, meta: 17_700, capacidad: 18_800, equilibrio: 11_000, icSup: 17_302, icInf: 15_498 },
  { periodo: 'Set', mes: '2027-09', baseline: 16_200, escenario: 17_000, meta: 17_500, capacidad: 18_800, equilibrio: 11_000, icSup: 17_091, icInf: 15_309 },
  { periodo: 'Oct', mes: '2027-10', baseline: 15_900, escenario: 16_700, meta: 17_200, capacidad: 18_800, equilibrio: 11_000, icSup: 16_775, icInf: 15_026 },
  { periodo: 'Nov', mes: '2027-11', baseline: 13_500, escenario: 14_300, meta: 14_700, capacidad: 16_000, equilibrio: 11_000, icSup: 14_243, icInf: 12_758 },
  { periodo: 'Dic', mes: '2027-12', baseline: 12_150, escenario: 13_940, meta: 12_000, capacidad: 15_000, equilibrio: 11_000, icSup: 12_818, icInf: 11_483 },
];

// Waterfall data for Screen 3
export const WATERFALL = [
  { name: 'Baseline', value: 184_250, type: 'base' },
  { name: 'Retención', value: 5_100, type: 'positive' },
  { name: 'Campaña Comercial', value: 4_200, type: 'positive' },
  { name: 'Nuevos Horarios', value: 2_400, type: 'positive' },
  { name: 'Precio / Mix', value: 890, type: 'positive' },
  { name: 'Escenario', value: 196_840, type: 'result' },
];

// Scenario detail (Screen 3) and scenario list. Contributions sum to matriculas − baseline.
export type FactibilidadEscenario = 'Factible' | 'Factible con restricciones' | 'No factible';
// Borrador: intervenciones registradas, nunca simulado · En proceso: simulación en segundo plano
// Simulado: resultados vigentes · Aprobado: elegido por la Gerencia como Meta Factible (Meta oficial)
export type EstadoEscenario = 'Borrador' | 'En proceso' | 'Simulado' | 'Aprobado';
export type EstadoConResultados = Extract<EstadoEscenario, 'Simulado' | 'Aprobado'>;

export interface CapacidadSede {
  sede: string;
  periodo: string;
  disponible: number;
  requerida: number;
}

export interface EscenarioDetalle {
  id: string;
  codigo: string;
  nombreCorto: string;
  descripcion: string;
  version: number;
  autor: string;
  modificado: string;
  estado: EstadoConResultados;
  matriculas: number;
  cumplimiento: number;
  brecha: number;
  contribuciones: { name: string; value: number }[];
  clasesRequeridas: number;
  ocupabilidad: number;
  factibilidad: FactibilidadEscenario;
  capacidad: CapacidadSede[];
}

export const REF_SUPERIOR_IC = 194_600;
export const META_FACTIBLE = 198_300;

export const ESCENARIOS_DETALLE: EscenarioDetalle[] = [
  {
    id: 'esc01', codigo: 'ESC-01', nombreCorto: 'Escenario 01', descripcion: 'Retención y Campaña', version: 2,
    autor: 'Planificación Académica', modificado: '30/09/2026 10:20', estado: 'Simulado',
    matriculas: 191_400, cumplimiento: 95.7, brecha: -8_600,
    contribuciones: [
      { name: 'Retención', value: 3_800 },
      { name: 'Campaña Comercial', value: 2_500 },
      { name: 'Precio / Mix', value: 850 },
    ],
    clasesRequeridas: 8_192, ocupabilidad: 81, factibilidad: 'Factible',
    capacidad: [
      { sede: 'Miraflores', periodo: '2027-03', disponible: 410, requerida: 401 },
      { sede: 'San Miguel', periodo: '2027-04', disponible: 355, requerida: 346 },
      { sede: 'Surco', periodo: '2027-03', disponible: 395, requerida: 364 },
    ],
  },
  {
    id: 'esc02', codigo: 'ESC-02', nombreCorto: 'Escenario 02', descripcion: 'Crecimiento Balanceado', version: 4,
    autor: 'Gerencia Comercial', modificado: '02/10/2026 18:05', estado: 'Simulado',
    matriculas: 198_100, cumplimiento: 99.1, brecha: -1_900,
    contribuciones: [
      { name: 'Retención', value: 5_300 },
      { name: 'Campaña Comercial', value: 4_600 },
      { name: 'Nuevos Horarios', value: 3_100 },
      { name: 'Precio / Mix', value: 850 },
    ],
    clasesRequeridas: 8_479, ocupabilidad: 89, factibilidad: 'Factible',
    capacidad: [
      { sede: 'Miraflores', periodo: '2027-03', disponible: 410, requerida: 409 },
      { sede: 'San Miguel', periodo: '2027-04', disponible: 355, requerida: 352 },
      { sede: 'Surco', periodo: '2027-03', disponible: 395, requerida: 385 },
    ],
  },
  {
    id: 'esc03', codigo: 'ESC-03', nombreCorto: 'Escenario 03', descripcion: 'Crecimiento Moderado 2027', version: 4,
    autor: 'Gerencia Comercial', modificado: '05/10/2026 16:42', estado: 'Aprobado',
    matriculas: CORE.escenario, cumplimiento: CORE.cumplimiento, brecha: CORE.brecha,
    contribuciones: [
      { name: 'Retención', value: CORE.retencion },
      { name: 'Campaña Comercial', value: CORE.campana },
      { name: 'Nuevos Horarios', value: CORE.horarios },
      { name: 'Precio / Mix', value: CORE.precioMix },
    ],
    clasesRequeridas: 8_425, ocupabilidad: 89, factibilidad: 'Factible con restricciones',
    capacidad: [
      { sede: 'Miraflores', periodo: '2027-03', disponible: 410, requerida: 424 },
      { sede: 'San Miguel', periodo: '2027-04', disponible: 355, requerida: 362 },
      { sede: 'Surco', periodo: '2027-03', disponible: 395, requerida: 382 },
    ],
  },
  {
    id: 'esc04', codigo: 'ESC-04', nombreCorto: 'Escenario 04', descripcion: 'Expansión Acelerada', version: 1,
    autor: 'Gerencia Comercial', modificado: '01/10/2026 15:48', estado: 'Simulado',
    matriculas: 201_800, cumplimiento: 100.9, brecha: 1_800,
    contribuciones: [
      { name: 'Retención', value: 5_600 },
      { name: 'Campaña Comercial', value: 5_800 },
      { name: 'Nuevos Horarios', value: 4_100 },
      { name: 'Precio / Mix', value: 1_200 },
      { name: 'Nuevo Curso', value: 850 },
    ],
    clasesRequeridas: 8_637, ocupabilidad: 103, factibilidad: 'No factible',
    capacidad: [
      { sede: 'Miraflores', periodo: '2027-03', disponible: 410, requerida: 421 },
      { sede: 'San Miguel', periodo: '2027-04', disponible: 355, requerida: 360 },
      { sede: 'Surco', periodo: '2027-03', disponible: 395, requerida: 397 },
    ],
  },
];

// Scenarios without results yet: calculated fields are shown as "—" (or "Procesando…")
export interface EscenarioPendiente {
  id: string;
  codigo: string;
  nombreCorto: string;
  descripcion: string;
  version: number;
  autor: string;
  modificado: string;
  estado: Exclude<EstadoEscenario, EstadoConResultados>;
  intervenciones: string[];
}

export const ESCENARIOS_PENDIENTES: EscenarioPendiente[] = [
  {
    id: 'esc05', codigo: 'ESC-05', nombreCorto: 'Escenario 05', descripcion: 'Apertura Sede Norte', version: 1,
    autor: 'Planificación Académica', modificado: '06/10/2026 12:10', estado: 'Borrador',
    intervenciones: ['Nueva sede', 'Campaña comercial'],
  },
  {
    id: 'esc06', codigo: 'ESC-06', nombreCorto: 'Escenario 06', descripcion: 'Ajuste de Precio y Retención', version: 2,
    autor: 'Gerencia Comercial', modificado: '07/10/2026 09:05', estado: 'En proceso',
    intervenciones: ['Precio / descuento', 'Retención', 'Alumno promedio por clase'],
  },
];

// Granular data — by period (Screen 5 matrix)
export const GRANULAR_PERIODO = [
  { periodo: 'Ene', base: 14_200, meta: 15_800, baseEstud: 12_300, metaEstud: 13_700, baseClases: 622, metaClases: 694 },
  { periodo: 'Feb', base: 16_800, meta: 18_200, baseEstud: 14_600, metaEstud: 15_800, baseClases: 741, metaClases: 803 },
  { periodo: 'Mar', base: 17_500, meta: 19_700, baseEstud: 15_200, metaEstud: 17_100, baseClases: 768, metaClases: 866 },
  { periodo: 'Abr', base: 15_200, meta: 16_800, baseEstud: 13_200, metaEstud: 14_600, baseClases: 668, metaClases: 740 },
  { periodo: 'May', base: 16_100, meta: 17_600, baseEstud: 13_990, metaEstud: 15_300, baseClases: 710, metaClases: 775 },
  { periodo: 'Jun', base: 15_800, meta: 17_200, baseEstud: 13_720, metaEstud: 14_940, baseClases: 698, metaClases: 759 },
  { periodo: 'Jul', base: 14_500, meta: 15_600, baseEstud: 12_590, metaEstud: 13_550, baseClases: 640, metaClases: 689 },
  { periodo: 'Ago', base: 16_400, meta: 17_700, baseEstud: 14_240, metaEstud: 15_370, baseClases: 723, metaClases: 780 },
  { periodo: 'Set', base: 16_200, meta: 17_500, baseEstud: 14_070, metaEstud: 15_200, baseClases: 714, metaClases: 772 },
  { periodo: 'Oct', base: 15_900, meta: 17_200, baseEstud: 13_810, metaEstud: 14_940, baseClases: 701, metaClases: 759 },
  { periodo: 'Nov', base: 13_500, meta: 14_700, baseEstud: 11_730, metaEstud: 12_770, baseClases: 596, metaClases: 649 },
  { periodo: 'Dic', base: 12_150, meta: 12_000, baseEstud: 10_560, metaEstud: 10_420, baseClases: 536, metaClases: 529 },
  { periodo: 'TOTAL', base: 184_250, meta: 200_000, baseEstud: 160_010, metaEstud: 173_690, baseClases: 8_117, metaClases: 8_815 },
];

// Granular data — by student type
export const GRANULAR_TIPO = [
  { tipo: 'Regular', base: 107_700, meta: 115_100, baseEstud: 93_500, metaEstud: 99_960, varAbs: 7_400, varPct: 6.9, nota: 'Incluye efecto retención (+5,100)' },
  { tipo: 'Reingresante', base: 41_300, meta: 46_100, baseEstud: 35_880, metaEstud: 40_050, varAbs: 4_800, varPct: 11.6, nota: 'Campaña + Nuevos Horarios' },
  { tipo: 'Nuevo', base: 35_250, meta: 38_800, baseEstud: 30_630, metaEstud: 33_680, varAbs: 3_550, varPct: 10.1, nota: 'Campaña + Nuevos Horarios' },
];

// Capacity heatmap data for Screen 5
export const HEATMAP_CAPACIDAD = [
  { sede: 'Miraflores', lv_man: 95, lv_tar: 88, lv_noc: 72, sab_man: 91, sab_tar: 85 },
  { sede: 'San Miguel', lv_man: 98, lv_tar: 87, lv_noc: 68, sab_man: 94, sab_tar: 79 },
  { sede: 'Surco', lv_man: 82, lv_tar: 76, lv_noc: 61, sab_man: 79, sab_tar: 71 },
  { sede: 'San Isidro', lv_man: 88, lv_tar: 81, lv_noc: 64, sab_man: 84, sab_tar: 76 },
  { sede: 'La Molina', lv_man: 71, lv_tar: 65, lv_noc: 52, sab_man: 68, sab_tar: 60 },
  { sede: 'Jesús María', lv_man: 85, lv_tar: 80, lv_noc: 63, sab_man: 82, sab_tar: 74 },
  { sede: 'Pueblo Libre', lv_man: 76, lv_tar: 70, lv_noc: 55, sab_man: 73, sab_tar: 66 },
];

// Historical previous year (Screen 5 — behavioral comparison)
export const HISTORICO_PREV = [
  { periodo: 'Ene', real: 13_100, realEstud: 11_370, realClases: 577 },
  { periodo: 'Feb', real: 15_550, realEstud: 13_500, realClases: 686 },
  { periodo: 'Mar', real: 16_200, realEstud: 14_090, realClases: 714 },
  { periodo: 'Abr', real: 14_080, realEstud: 12_240, realClases: 621 },
  { periodo: 'May', real: 14_900, realEstud: 12_950, realClases: 657 },
  { periodo: 'Jun', real: 14_620, realEstud: 12_700, realClases: 645 },
  { periodo: 'Jul', real: 13_420, realEstud: 11_660, realClases: 592 },
  { periodo: 'Ago', real: 15_180, realEstud: 13_190, realClases: 670 },
  { periodo: 'Set', real: 14_990, realEstud: 13_020, realClases: 661 },
  { periodo: 'Oct', real: 14_710, realEstud: 12_780, realClases: 649 },
  { periodo: 'Nov', real: 12_490, realEstud: 10_850, realClases: 551 },
  { periodo: 'Dic', real: 11_240, realEstud: 9_780, realClases: 496 },
];

export const formatNum = (n: number) =>
  n.toLocaleString('es-PE');

export const formatPct = (n: number) =>
  `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

export const varColor = (pct: number) => {
  if (pct >= 15) return '#16a34a';
  if (pct >= 5) return '#4ade80';
  if (pct >= -5) return '#d97706';
  if (pct >= -15) return '#f97316';
  return '#dc2626';
};

export const varBg = (pct: number) => {
  if (pct >= 15) return '#f0fdf4';
  if (pct >= 5) return '#f0fdf4';
  if (pct >= -5) return '#fffbeb';
  if (pct >= -15) return '#fff7ed';
  return '#fef2f2';
};

// Top combinations for "Dónde más crece" panel
export const TOP_COMBINACIONES = [
  { combo: 'San Miguel — Presencial — Conv. Inglés — Noche (Sáb)', varAbs: 820, varPct: 18.4 },
  { combo: 'Miraflores — Presencial — Business English — Mañana (Lun-Vie)', varAbs: 710, varPct: 15.2 },
  { combo: 'Lima Centro — Virtual — Inglés General — Tarde (Lun-Vie)', varAbs: 640, varPct: 12.9 },
  { combo: 'La Molina — Presencial — Conv. Inglés — Tarde (Lun-Vie)', varAbs: 580, varPct: 11.7 },
  { combo: 'San Isidro — Presencial — Business English — Noche (Lun-Vie)', varAbs: 520, varPct: 10.3 },
];

export const FOOTNOTE = 'Diseño conceptual referencial de la solución propuesta. La disposición visual definitiva será validada durante la etapa de diseño funcional.';
