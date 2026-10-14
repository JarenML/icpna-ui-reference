// Power BI sheets that replicate the formats shared by each area (HU chapter 22)
export interface FormatoArea {
  nombre: string;
  area: string;
  descripcion: string;
  fuente: string;
  vistaPrevia?: boolean;
}

export const FORMATOS_AREA: FormatoArea[] = [
  {
    nombre: 'Hoja Formato GAGSI',
    area: 'GAGSI',
    descripcion: 'Matriz con la estructura del archivo compartido por GAGSI, con segmentadores y filtros para su análisis.',
    fuente: 'PPTO 2026 GAGSI.xlsx',
  },
  {
    nombre: 'Hoja Formato RRHH',
    area: 'Recursos Humanos',
    descripcion: 'Matriz con la estructura del archivo compartido por Recursos Humanos, con segmentadores y filtros para su análisis.',
    fuente: 'PPTO 2026 RRHH.xlsx',
  },
  {
    nombre: 'Hoja Formato Finanzas',
    area: 'Finanzas',
    descripcion: 'Matriz con estructura idéntica al archivo de Finanzas (columnas A–BQ); la columna "Código Ceco" no se visualiza.',
    fuente: 'Archivo de Finanzas',
    vistaPrevia: true,
  },
];
