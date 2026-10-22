// Motor configuration: each intervention type is backed by a script the processing engine accepts.
// Every intervention registered in a scenario is a parameter set passed to its type's script.
// Script languages, versions, dates and owners are provisional mock data.

export type LenguajeScript = 'Python' | 'JavaScript';
export type EstadoTipo = 'Activo' | 'Borrador';

export interface TipoIntervencion {
  clave: string;
  nombre: string;
  descripcion: string;
  // Fields specific to this type, on top of PARAMETROS_COMUNES
  parametros: string[];
  lenguaje: LenguajeScript;
  script: string;
  version: number;
  estado: EstadoTipo;
  responsable: string;
  modificado: string;
  personalizado?: boolean;
}

// Fields every intervention captures in Construcción de Escenario
export const PARAMETROS_COMUNES = ['Impacto', 'Periodo', 'Alcance', 'Clasificación'];

export const aClave = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Engine contract shared by every intervention-type script (illustrative)
export const plantillaScript = (lenguaje: LenguajeScript, clave: string) =>
  lenguaje === 'Python'
    ? `# Tipo de intervención: ${clave}
# El motor invoca procesar(ctx, intervencion) por cada intervención
# de este tipo registrada en el escenario.
#   intervencion.impacto / .periodo / .alcance → parámetros de la intervención
#   ctx.baseline → registros del Baseline activo (solo lectura)
# Devuelve el efecto en matrículas por periodo dentro del alcance.

def procesar(ctx, intervencion):
    base = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo)
    efecto = {}
    for periodo, matriculas in base.por_periodo():
        efecto[periodo] = matriculas * intervencion.impacto
    return efecto
`
    : `// Tipo de intervención: ${clave}
// El motor invoca procesar(ctx, intervencion) por cada intervención
// de este tipo registrada en el escenario.
//   intervencion.impacto / .periodo / .alcance → parámetros de la intervención
//   ctx.baseline → registros del Baseline activo (solo lectura)
// Devuelve el efecto en matrículas por periodo dentro del alcance.

export function procesar(ctx, intervencion) {
  const base = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo);
  const efecto = {};
  for (const [periodo, matriculas] of base.porPeriodo()) {
    efecto[periodo] = matriculas * intervencion.impacto;
  }
  return efecto;
}
`;

// Illustrative logic per type, consistent with the rules shown in Construcción de Escenario and Trazabilidad.
// Not the final engine code.
const SCRIPTS: Record<string, string> = {
  'Retención': `# Retención: solo alumnos únicos regulares (no afecta Reingresantes ni Nuevos)
# intervencion.impacto → puntos porcentuales de mejora en la tasa de retención

def procesar(ctx, intervencion):
    regulares = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo,
                                     tipo_alumno="Regular")
    efecto, arrastre = {}, 0
    for periodo, fila in regulares.por_periodo():
        tasa_base = fila.conservados / fila.regulares_periodo_anterior
        tasa_nueva = min(tasa_base + intervencion.impacto, 1.0)
        retenidos = fila.regulares_periodo_anterior * (tasa_nueva - tasa_base)
        # Acumulativo: los alumnos retenidos siguen en los periodos siguientes
        arrastre += retenidos
        efecto[periodo] = arrastre
    return efecto
`,
  'Crecimiento de matrícula': `# Crecimiento de matrícula: variación porcentual directa sobre el Baseline
# intervencion.impacto → % de crecimiento dentro del alcance

def procesar(ctx, intervencion):
    base = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo)
    return {
        periodo: matriculas * intervencion.impacto
        for periodo, matriculas in base.por_periodo()
    }
`,
  'Campaña comercial': `# Campaña comercial: captación de alumnos nuevos con decaimiento posterior
# intervencion.impacto → % adicional de captación durante la campaña

DECAIMIENTO_MENSUAL = 0.40

def procesar(ctx, intervencion):
    nuevos = ctx.baseline.filtrar(intervencion.alcance, tipo_alumno="Nuevo")
    inicio, fin = intervencion.periodo
    efecto = {}
    for periodo, matriculas in nuevos.por_periodo():
        if periodo < inicio:
            continue
        captados = matriculas * intervencion.impacto
        if periodo > fin:
            meses = ctx.meses_entre(fin, periodo)
            captados *= (1 - DECAIMIENTO_MENSUAL) ** meses
        efecto[periodo] = captados
    return efecto
`,
  'Precio / descuento': `# Precio / descuento: efecto vía elasticidad-precio de la demanda
# intervencion.impacto → variación % del precio (negativa = descuento)

def procesar(ctx, intervencion):
    base = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo)
    efecto = {}
    for (periodo, curso), matriculas in base.por(["periodo", "curso"]):
        elasticidad = ctx.historico.elasticidad_precio(curso)
        variacion_demanda = elasticidad * intervencion.impacto
        efecto[(periodo, curso)] = matriculas * variacion_demanda
    # El cambio de mix entre cursos se refleja en la agregación por curso
    return ctx.agrupar(efecto, por="periodo")
`,
  'Nueva sede': `# Nueva sede: no tiene historia propia; usa el patrón de una sede de referencia
# intervencion.proyeccion_inicial → matrícula inicial entregada por Comercial

def procesar(ctx, intervencion):
    patron = ctx.historico.pesos(sede=intervencion.sede_referencia,
                                 por=["modalidad", "curso", "horario"])
    efecto, asignado = {}, 0
    combinaciones = list(patron.items())
    for i, (combinacion, peso) in enumerate(combinaciones):
        ultima = i == len(combinaciones) - 1
        # La última combinación absorbe el redondeo para cuadrar con el total
        valor = (intervencion.proyeccion_inicial - asignado if ultima
                 else round(intervencion.proyeccion_inicial * peso))
        efecto[(intervencion.sede_nueva, *combinacion)] = valor
        asignado += valor
    return ctx.distribuir_en_periodos(efecto, intervencion.periodo)
`,
  'Nuevo curso': `# Nuevo curso: demanda estimada a partir de cursos comparables
# intervencion.impacto → participación esperada frente al curso comparable

def procesar(ctx, intervencion):
    comparable = ctx.historico.curso_comparable(intervencion.alcance)
    estacionalidad = ctx.historico.estacionalidad(comparable)
    base = ctx.baseline.filtrar(intervencion.alcance, intervencion.periodo,
                                curso=comparable)
    efecto = {}
    for periodo, matriculas in base.por_periodo():
        efecto[periodo] = matriculas * intervencion.impacto * estacionalidad[periodo.mes]
    return efecto
`,
  'Nuevo horario': `# Nuevo horario: demanda incremental + alumnos redistribuidos de sedes adyacentes
# intervencion.demanda_incremental / .redistribucion → estimados con horarios comparables

def procesar(ctx, intervencion):
    inicio = intervencion.periodo.desde
    curva = ctx.historico.curva_maduracion(horarios_comparables=True)
    efecto = {}
    for periodo in ctx.periodos(desde=inicio):
        avance = curva[ctx.meses_entre(inicio, periodo)]
        efecto[periodo] = (intervencion.demanda_incremental
                           + intervencion.redistribucion) * avance
    # La redistribución se descuenta de las sedes adyacentes en su propio alcance
    ctx.registrar_traslado(origen="sedes_adyacentes",
                           destino=intervencion.alcance,
                           alumnos=intervencion.redistribucion)
    return efecto
`,
  'Alumno promedio por clase': `# Alumno promedio por clase: no cambia matrículas, cambia clases requeridas
# intervencion.impacto → nuevo promedio de alumnos por clase

def procesar(ctx, intervencion):
    base = ctx.escenario.filtrar(intervencion.alcance, intervencion.periodo)
    efecto = {}
    for (periodo, sede), fila in base.por(["periodo", "sede"]):
        clases = ctx.redondear_arriba(fila.alumnos_estudiando / intervencion.impacto)
        efecto[(periodo, sede)] = {
            "clases_requeridas": clases - fila.clases_requeridas,
            "matriculas": 0,
        }
    # El motor valida luego estas clases contra la capacidad por sede
    return efecto
`,
};

const tipo = (
  nombre: string, descripcion: string, parametros: string[],
  version: number, responsable: string, modificado: string,
): TipoIntervencion => {
  const clave = aClave(nombre);
  return { clave, nombre, descripcion, parametros, lenguaje: 'Python', script: SCRIPTS[nombre], version, estado: 'Activo', responsable, modificado };
};

// The intervention types already available in Construcción de Escenario, each with its script
export const TIPOS_INTERVENCION: TipoIntervencion[] = [
  tipo('Retención', 'Mejora de la tasa de retención; aplica solo sobre alumnos únicos regulares.', [], 4, 'Gerencia Comercial', '12/09/2026'),
  tipo('Crecimiento de matrícula', 'Variación de matrícula dentro del alcance y periodo seleccionados.', [], 2, 'Planificación Académica', '01/09/2026'),
  tipo('Campaña comercial', 'Captación de alumnos nuevos durante el periodo de la campaña, con decaimiento posterior.', [], 3, 'Gerencia Comercial', '20/09/2026'),
  tipo('Precio / descuento', 'Efecto de cambios de precio o descuentos sobre la matrícula vía elasticidad-precio (Precio / Mix).', [], 2, 'Finanzas', '04/09/2026'),
  tipo('Nueva sede', 'Proyección inicial de la sede distribuida con el patrón de una sede de referencia.', ['Sede nueva', 'Sede de referencia', 'Proyección inicial'], 1, 'Planificación Académica', '06/10/2026'),
  tipo('Nuevo curso', 'Incorporación de un curso a la oferta, estimada con cursos comparables.', [], 1, 'Gerencia Académica', '04/09/2026'),
  tipo('Nuevo horario', 'Demanda incremental de una nueva oferta horaria y redistribución desde sedes adyacentes.', ['Demanda incremental', 'Redistribución'], 3, 'Planificación Académica', '20/09/2026'),
  tipo('Alumno promedio por clase', 'Ajuste de alumnos por clase; incide en clases requeridas y capacidad.', [], 2, 'Planificación Académica', '20/09/2026'),
];
