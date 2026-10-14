import { useEffect, useRef, useState } from 'react';
import { formatNum } from '../data/constants';
import {
  BASELINE_CANDIDATO, CHECKS_BASELINE, REVISORES, resultadoCheck,
  type CasoVerificacion, type ResultadoCheck, type TipoCheck,
} from '../data/baseline';
import { Spinner } from './EstadoBadge';

interface Props {
  open: boolean;
  hayNueva: boolean;
  activo: string;
  onClose: () => void;
  onIntegrar: (atipico: boolean, revisor: string | null) => void;
  onRechazar: () => void;
}

type Fase = 'buscando' | 'sinNovedades' | 'encontrado' | 'verificando' | 'resultado';
type EstadoCheck = 'pendiente' | 'ejecutando' | ResultadoCheck;
type Revision = 'sinSolicitar' | 'enviada' | 'confirmada';

const tipoStyle: Record<TipoCheck, { color: string; bg: string; border: string; title: string }> = {
  'Crítica': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', title: 'Si falla, bloquea la integración. No admite excepción.' },
  'Estadística': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', title: 'Compara la versión con el comportamiento histórico. Si la variación es inusual, genera una advertencia que puede confirmar un revisor externo.' },
};

const CASOS: { id: CasoVerificacion; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'atipico', label: 'Variación atípica' },
  { id: 'critico', label: 'Error crítico' },
];

const checkStyle: Record<ResultadoCheck, { icon: string; color: string; bg: string; border: string; label: string }> = {
  ok: { icon: '✓', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', label: 'OK' },
  warn: { icon: '!', color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Advertencia' },
  fail: { icon: '✕', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: 'Falla' },
};

const labelStyle = { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

export default function VerificarBaselineModal({ open, hayNueva, activo, onClose, onIntegrar, onRechazar }: Props) {
  const [fase, setFase] = useState<Fase>('buscando');
  const [caso, setCaso] = useState<CasoVerificacion>('normal');
  const [revision, setRevision] = useState<Revision>('sinSolicitar');
  const [revisor, setRevisor] = useState(REVISORES[0]);
  const [estados, setEstados] = useState<EstadoCheck[]>([]);
  const timers = useRef<number[]>([]);

  const limpiar = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (!open) return;
    setFase('buscando');
    setCaso('normal');
    setRevision('sinSolicitar');
    setRevisor(REVISORES[0]);
    setEstados(CHECKS_BASELINE.map(() => 'pendiente'));
    timers.current.push(window.setTimeout(() => setFase(hayNueva ? 'encontrado' : 'sinNovedades'), 1200));
    return limpiar;
  }, [open]); // reset only when the modal opens

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && fase !== 'verificando') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, fase, onClose]);

  if (!open) return null;

  const verificar = () => {
    setFase('verificando');
    CHECKS_BASELINE.forEach((c, i) => {
      timers.current.push(window.setTimeout(() => {
        setEstados((prev) => prev.map((e, j) => (j === i ? 'ejecutando' : e)));
      }, i * 550));
      timers.current.push(window.setTimeout(() => {
        const res = resultadoCheck(c, caso).res;
        setEstados((prev) => prev.map((e, j) => (j === i ? res : e)));
        if (i === CHECKS_BASELINE.length - 1) setFase('resultado');
      }, i * 550 + 450));
    });
  };

  const fallas = estados.filter((e) => e === 'fail').length;
  const advertencias = estados.filter((e) => e === 'warn').length;
  const apto = fallas === 0;
  // A statistical check out of the historical range (variation) calls for an external confirmation
  const requiereRevision = apto && CHECKS_BASELINE.some((chk, i) => chk.id === 'variacion' && estados[i] === 'warn');
  const c = BASELINE_CANDIDATO;
  const total = caso === 'atipico' ? c.atipico.total : c.total;
  const variacion = caso === 'atipico' ? c.atipico.variacion : c.variacion;

  const solicitarRevision = () => {
    setRevision('enviada');
    timers.current.push(window.setTimeout(() => setRevision('confirmada'), 1800));
  };

  const resultadoBox = !apto
    ? { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: '✕', titulo: 'No apto — integración bloqueada' }
    : requiereRevision
      ? { color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: '!', titulo: 'Apto con advertencia estadística — se recomienda confirmar' }
      : { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', titulo: 'Apto para integrar' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && fase !== 'verificando') onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verificar-baseline-title"
        className="flex flex-col w-full"
        style={{
          maxWidth: 620,
          maxHeight: 'calc(100vh - 48px)',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div id="verificar-baseline-title" className="font-semibold text-base" style={{ color: '#0f172a' }}>
            Buscar nueva versión del Baseline
          </div>
          <div className="text-xs mt-1" style={{ color: '#64748b' }}>
            Una versión nueva queda en staging y solo se integra a <span className="font-mono">baseline_version</span> si pasa las verificaciones.
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-3 text-xs">
            {[
              { label: 'Origen (DWH)', on: true, info: 'Data warehouse de ICPNA donde el modelo de proyección publica cada versión del Baseline. Aquí se busca si existe una versión más reciente que la activa.' },
              { label: 'Staging', on: fase !== 'buscando' && fase !== 'sinNovedades', info: 'Área intermedia donde la versión nueva se copia tal como llega. Se revisa aquí sin afectar al Baseline activo ni a los escenarios.' },
              { label: 'Verificaciones', on: fase === 'verificando' || fase === 'resultado', info: 'Controles automáticos del Motor de verificación (Paso 0): estructura, periodos completos, cuadre por jerarquía, bandas y variación. El resultado queda registrado.' },
              { label: 'baseline_version', on: false, mono: true, info: 'Tabla oficial en Azure SQL con las versiones integradas. Solo llega una versión apta; la versión activa anterior pasa a Archivado.' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: '#cbd5e1' }}>→</span>}
                <span
                  className={`group relative inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-help ${s.mono ? 'font-mono' : ''}`}
                  tabIndex={0}
                  aria-label={`${s.label}: ${s.info}`}
                  style={{
                    background: s.on ? '#f0fdfa' : '#f8fafc',
                    color: s.on ? '#0f766e' : '#94a3b8',
                    border: `1px solid ${s.on ? '#99f6e4' : 'var(--border)'}`,
                  }}
                >
                  {s.label}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={{ opacity: 0.75 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-full mt-1.5 z-20 rounded-md px-2.5 py-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
                    style={{ width: 230, background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', fontSize: 11, lineHeight: 1.5, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)' }}
                  >
                    {s.info}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto">
          {fase === 'buscando' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Spinner size={22} />
              <div className="text-sm" style={{ color: '#334155' }}>Consultando el origen por nuevas versiones…</div>
            </div>
          )}

          {fase === 'sinNovedades' && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <div
                className="flex items-center justify-center rounded-full font-bold"
                style={{ width: 36, height: 36, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                ✓
              </div>
              <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>No hay nuevas versiones disponibles</div>
              <div className="text-xs" style={{ color: '#64748b' }}>
                La versión <span className="font-mono font-semibold">{activo}</span> sigue siendo la más reciente.
              </div>
            </div>
          )}

          {fase !== 'buscando' && fase !== 'sinNovedades' && (
            <>
              {/* Candidate */}
              <div className="rounded-md p-3 mb-4" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10 }}>Nueva versión detectada</span>
                    <span className="font-mono font-bold text-sm" style={{ color: '#0f172a' }}>{c.codigo}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Generada {c.generado}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total proyectado', value: formatNum(total) },
                    { label: 'Periodos', value: c.periodos },
                    { label: 'Filas', value: formatNum(c.filas) },
                    { label: `Vs ${activo}`, value: `+${variacion}%`, alerta: caso === 'atipico' },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="font-medium" style={labelStyle}>{f.label}</div>
                      <div className="text-xs font-semibold font-mono mt-0.5" style={{ color: f.alerta ? '#b45309' : '#334155' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checks */}
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#334155', fontSize: 10.5 }}>
                Verificaciones previas a la integración
              </div>
              <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {CHECKS_BASELINE.map((chk, i) => {
                  const est = estados[i];
                  const res = est === 'ok' || est === 'warn' || est === 'fail' ? checkStyle[est] : null;
                  const detalle = res ? resultadoCheck(chk, caso).detalle : null;
                  const tipo = tipoStyle[chk.tipo];
                  return (
                    <div
                      key={chk.id}
                      className="flex items-center gap-3 px-3 py-2"
                      style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined, background: est === 'ejecutando' ? '#f8fafc' : '#fff' }}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 20, height: 20 }}>
                        {est === 'ejecutando' ? (
                          <Spinner size={13} />
                        ) : res ? (
                          <span
                            className="flex items-center justify-center rounded-full font-bold"
                            style={{ width: 18, height: 18, fontSize: 10, background: res.bg, color: res.color, border: `1px solid ${res.border}` }}
                          >
                            {res.icon}
                          </span>
                        ) : (
                          <span className="rounded-full" style={{ width: 8, height: 8, background: '#e2e8f0' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium" style={{ color: est === 'pendiente' ? '#94a3b8' : '#0f172a' }}>
                          {chk.label}
                        </div>
                        {detalle && <div className="text-xs mt-0.5" style={{ color: res!.color }}>{detalle}</div>}
                      </div>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 cursor-help"
                        title={`${tipo.title} · ${chk.fuente}`}
                        style={{ background: tipo.bg, color: tipo.color, border: `1px solid ${tipo.border}`, fontSize: 10 }}
                      >
                        {chk.tipo}
                      </span>
                    </div>
                  );
                })}
              </div>

              {fase === 'encontrado' && (
                <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: '#94a3b8' }}>
                  <span>Simular caso (demo):</span>
                  <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {CASOS.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setCaso(k.id)}
                        className="px-2 py-0.5"
                        style={{ background: caso === k.id ? '#334155' : '#fff', color: caso === k.id ? '#fff' : '#64748b', fontSize: 11 }}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fase === 'resultado' && (
                <div
                  className="mt-4 p-3 rounded-md text-xs"
                  style={{ background: resultadoBox.bg, border: `1px solid ${resultadoBox.border}`, color: resultadoBox.color }}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-bold" style={{ fontSize: 14 }}>{resultadoBox.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{resultadoBox.titulo}</div>
                      <div className="mt-0.5" style={{ color: '#475569' }}>
                        {!apto
                          ? `${fallas} verificaciones críticas fallidas. Los errores críticos no admiten revisión externa ni excepción: la versión no se integra, queda registrada como No apto y se notifica al equipo responsable.`
                          : requiereRevision
                            ? `No hay errores críticos, pero la versión se aleja del comportamiento histórico (+${variacion}% vs ${activo}). Antes de integrarla, conviene que un revisor confirme que la variación es esperada.`
                            : `${CHECKS_BASELINE.length - advertencias} verificaciones OK${advertencias ? ` · ${advertencias} advertencia no bloqueante` : ''}. Al integrar, ${c.codigo} pasa a ser el Baseline activo y ${activo} queda archivada.`}
                      </div>
                    </div>
                  </div>

                  {requiereRevision && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #fde68a' }}>
                      {revision === 'sinSolicitar' && (
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#475569' }}>Revisor:</span>
                          <select
                            value={revisor}
                            onChange={(e) => setRevisor(e.target.value)}
                            className="flex-1 text-xs px-2 py-1 rounded"
                            style={{ border: '1px solid #fde68a', background: '#fff', color: '#0f172a' }}
                          >
                            {REVISORES.map((rv) => <option key={rv}>{rv}</option>)}
                          </select>
                          <button
                            onClick={solicitarRevision}
                            className="text-xs px-3 py-1 rounded font-medium"
                            style={{ background: '#b45309', color: '#fff' }}
                          >
                            Solicitar revisión
                          </button>
                        </div>
                      )}
                      {revision === 'enviada' && (
                        <div className="flex items-center gap-2" style={{ color: '#92400e' }}>
                          <Spinner size={11} />
                          <span>
                            Esperando confirmación de <span className="font-semibold">{revisor}</span>… La versión se mantiene en staging.
                          </span>
                        </div>
                      )}
                      {revision === 'confirmada' && (
                        <div className="flex items-start gap-2" style={{ color: '#15803d' }}>
                          <span className="font-bold">✓</span>
                          <span>
                            <span className="font-semibold">Confirmado por {revisor}:</span>{' '}
                            <span style={{ color: '#475569' }}>la variación responde a la apertura de nuevas sedes incluida en el modelo.</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--border)', background: '#f8fafc' }}>
          <span className="text-xs" style={{ color: '#94a3b8' }}>
            {fase === 'resultado' ? 'Resultado guardado en ctl_baseline_validacion' : ''}
          </span>
          <div className="flex gap-2">
            {fase === 'encontrado' && (
              <>
                <button onClick={onClose} className="text-xs px-3 py-1.5 rounded font-medium" style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}>
                  Cancelar
                </button>
                <button onClick={verificar} className="text-xs px-3 py-1.5 rounded font-medium" style={{ background: '#0f766e', color: '#fff' }}>
                  Ejecutar verificaciones
                </button>
              </>
            )}
            {fase === 'verificando' && (
              <button disabled className="text-xs px-3 py-1.5 rounded font-medium" style={{ background: '#e2e8f0', color: '#94a3b8' }}>
                Verificando…
              </button>
            )}
            {fase === 'resultado' && apto && (
              <>
                <button onClick={onClose} className="text-xs px-3 py-1.5 rounded font-medium" style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}>
                  Mantener {activo}
                </button>
                <button
                  onClick={() => onIntegrar(caso === 'atipico', revision === 'confirmada' ? revisor : null)}
                  disabled={revision === 'enviada'}
                  className="text-xs px-3 py-1.5 rounded font-medium"
                  style={
                    revision === 'enviada'
                      ? { background: '#e2e8f0', color: '#94a3b8' }
                      : requiereRevision && revision !== 'confirmada'
                        ? { background: '#fff', color: '#b45309', border: '1px solid #fde68a' }
                        : { background: '#0f766e', color: '#fff' }
                  }
                >
                  {requiereRevision && revision === 'sinSolicitar' ? 'Integrar sin revisión' : 'Integrar como Baseline activo'}
                </button>
              </>
            )}
            {fase === 'resultado' && !apto && (
              <button onClick={onRechazar} className="text-xs px-3 py-1.5 rounded font-medium" style={{ background: '#b91c1c', color: '#fff' }}>
                Registrar como No apto
              </button>
            )}
            {(fase === 'buscando' || fase === 'sinNovedades') && (
              <button onClick={onClose} className="text-xs px-3 py-1.5 rounded font-medium" style={{ border: '1px solid var(--border)', color: '#334155', background: '#fff' }}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
