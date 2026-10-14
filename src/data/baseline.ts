// Baseline versions and pre-integration checks (Paso 0).
// Versions other than 2027.01 (184,250) and all dates/totals here are provisional mock data.

export type EstadoBaseline = 'Activo' | 'Archivado' | 'No apto';
export type ResultadoCheck = 'ok' | 'warn' | 'fail';

export interface BaselineVersion {
  codigo: string;
  estado: EstadoBaseline;
  total: number;
  variacion: number | null; // % vs previous valid version
  periodos: string;
  filas: number;
  cargado: string;
  validadoPor: string;
  origen: string;
  checks: { ok: number; warn: number; fail: number };
  motivo?: string;
  revision?: string; // external confirmation of a statistical warning
}

export const BASELINE_VERSIONES: BaselineVersion[] = [
  {
    codigo: '2027.01', estado: 'Activo', total: 184_250, variacion: 1.3, periodos: '2027-01 a 2027-12',
    filas: 52_416, cargado: '01 Sep 2026 · 09:15', validadoPor: 'Motor de verificación', origen: 'DWH ICPNA',
    checks: { ok: 7, warn: 0, fail: 0 },
  },
  {
    codigo: '2026.04', estado: 'Archivado', total: 181_900, variacion: 1.4, periodos: '2026-07 a 2027-06',
    filas: 51_870, cargado: '02 Jun 2026 · 10:40', validadoPor: 'Motor de verificación', origen: 'DWH ICPNA',
    checks: { ok: 6, warn: 1, fail: 0 },
  },
  {
    codigo: '2026.03', estado: 'No apto', total: 183_100, variacion: null, periodos: '2026-04 a 2027-03',
    filas: 50_932, cargado: '15 Abr 2026 · 16:05', validadoPor: 'Motor de verificación', origen: 'DWH ICPNA',
    checks: { ok: 5, warn: 0, fail: 2 }, motivo: 'Total por jerarquía no cuadra con el total anual; periodo 2027-03 incompleto',
  },
  {
    codigo: '2026.02', estado: 'Archivado', total: 179_400, variacion: null, periodos: '2026-03 a 2027-02',
    filas: 50_118, cargado: '03 Mar 2026 · 11:20', validadoPor: 'Motor de verificación', origen: 'DWH ICPNA',
    checks: { ok: 7, warn: 0, fail: 0 },
  },
];

// New version available at the source the first time the user checks
export const BASELINE_CANDIDATO = {
  codigo: '2027.02', total: 185_630, variacion: 0.75, periodos: '2027-01 a 2027-12',
  filas: 52_604, generado: '14 Oct 2026 · 07:30', origen: 'DWH ICPNA',
  // Same version when it differs strongly from the active one (demo case)
  atipico: { total: 218_150, variacion: 18.4 },
};

// Demo cases for the verification flow
export type CasoVerificacion = 'normal' | 'atipico' | 'critico';

// Crítica: blocks the integration, no exceptions. Estadística: unusual vs history, warning that can be confirmed by an external reviewer.
export type TipoCheck = 'Crítica' | 'Estadística';

export interface CheckBaseline {
  id: string;
  label: string;
  fuente: 'Paso 0' | 'Técnico';
  tipo: TipoCheck;
  resultado: Record<'normal', { res: ResultadoCheck; detalle: string }> &
    Partial<Record<CasoVerificacion, { res: ResultadoCheck; detalle: string }>>;
}

export const resultadoCheck = (c: CheckBaseline, caso: CasoVerificacion) => c.resultado[caso] ?? c.resultado.normal;

export const REVISORES = ['Responsable del modelo de proyección', 'Business Analytics', 'Gerencia Comercial'];

export const CHECKS_BASELINE: CheckBaseline[] = [
  {
    id: 'esquema', label: 'Estructura y tipos de columnas', fuente: 'Técnico', tipo: 'Crítica',
    resultado: { normal: { res: 'ok', detalle: '17/17 columnas esperadas' } },
  },
  {
    id: 'llave', label: 'Llave de granularidad sin duplicados', fuente: 'Técnico', tipo: 'Crítica',
    resultado: { normal: { res: 'ok', detalle: '0 duplicados' } },
  },
  {
    id: 'periodos', label: '12 periodos completos, sin nulos ni negativos', fuente: 'Paso 0', tipo: 'Crítica',
    resultado: {
      normal: { res: 'ok', detalle: '12/12 periodos · 0 nulos · 0 negativos' },
      critico: { res: 'fail', detalle: 'Periodo 2027-12 incompleto · 214 pronósticos nulos' },
    },
  },
  {
    id: 'jerarquia', label: 'Total por nivel de jerarquía = total anual', fuente: 'Paso 0', tipo: 'Crítica',
    resultado: {
      normal: { res: 'ok', detalle: 'Cuadra en los 6 niveles' },
      critico: { res: 'fail', detalle: 'Diferencia de 1,240 matrículas en el nivel Sede' },
    },
  },
  {
    id: 'composicion', label: 'Alumnos = Conservados + Reingresantes + Nuevos', fuente: 'Paso 0', tipo: 'Crítica',
    resultado: { normal: { res: 'ok', detalle: 'Cuadra en el 100% de combinaciones' } },
  },
  {
    id: 'bandas', label: 'Límite inferior ≤ valor central ≤ límite superior', fuente: 'Paso 0', tipo: 'Estadística',
    resultado: { normal: { res: 'warn', detalle: '3 combinaciones sin banda (no bloqueante)' } },
  },
  {
    id: 'variacion', label: 'Variación vs versión activa dentro del rango histórico (±5%)', fuente: 'Paso 0', tipo: 'Estadística',
    resultado: {
      normal: { res: 'ok', detalle: '+0.75% vs 2027.01' },
      atipico: { res: 'warn', detalle: '+18.4% vs 2027.01 · fuera del rango histórico, variación inusual frente a versiones anteriores' },
    },
  },
];
