import { useEffect, useRef, useState } from 'react';
import { PARAMETROS_COMUNES, aClave, plantillaScript, type LenguajeScript, type TipoIntervencion } from '../data/tiposIntervencion';
import CodeTag from './CodeTag';

interface Props {
  open: boolean;
  existentes: TipoIntervencion[];
  onClose: () => void;
  onCreate: (t: TipoIntervencion) => void;
}

const RESPONSABLES = ['Planificación Académica', 'Gerencia Comercial', 'Gerencia Académica', 'Finanzas'];

const hoy = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const SectionTitle = ({ step, title, hint }: { step: number; title: string; hint?: string }) => (
  <div className="flex items-baseline justify-between mb-2.5">
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center font-semibold rounded-full"
        style={{ width: 18, height: 18, background: '#eff6ff', color: '#1e40af', fontSize: 10, border: '1px solid #bfdbfe' }}
      >
        {step}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#334155', fontSize: 10.5 }}>{title}</span>
    </div>
    {hint && <span className="text-xs" style={{ color: '#94a3b8' }}>{hint}</span>}
  </div>
);

const labelCls = 'text-xs font-medium block mb-1';
const inputCls = 'w-full text-sm px-3 py-2 rounded bg-white outline-none transition-shadow focus:ring-2 focus:ring-blue-200';
const inputStyle = { border: '1px solid var(--border)', color: '#0f172a' };

const chipStyle = { fontSize: 10.5, background: '#f8fafc', color: '#475569', border: '1px solid var(--border)' };

export default function NuevoTipoIntervencionModal({ open, existentes, onClose, onCreate }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [parametros, setParametros] = useState<string[]>([]);
  const [nuevoParametro, setNuevoParametro] = useState('');
  const [responsable, setResponsable] = useState(RESPONSABLES[0]);
  const [lenguaje, setLenguaje] = useState<LenguajeScript>('Python');
  const [script, setScript] = useState('');
  const [editado, setEditado] = useState(false);
  const [archivo, setArchivo] = useState('');
  const [probado, setProbado] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const clave = aClave(nombre);

  useEffect(() => {
    if (!open) return;
    setNombre('');
    setDescripcion('');
    setParametros([]);
    setNuevoParametro('');
    setResponsable(RESPONSABLES[0]);
    setLenguaje('Python');
    setEditado(false);
    setArchivo('');
    setProbado(false);
    setIntentado(false);
  }, [open]); // reset only when the modal opens

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // While the user has not touched the script, the template follows the type key and language
  useEffect(() => {
    if (open && !editado) setScript(plantillaScript(lenguaje, clave || 'nuevo_tipo'));
  }, [open, editado, lenguaje, clave]);

  // Any change to the script invalidates the previous contract check
  useEffect(() => setProbado(false), [script, lenguaje]);

  if (!open) return null;

  const errorNombre = !nombre.trim()
    ? 'Ingrese un nombre para el tipo de intervención.'
    : existentes.some((t) => t.clave === clave) ? 'Ya existe un tipo de intervención con ese nombre.' : '';
  const errorScript = !script.trim() ? 'Escriba o cargue el script del tipo de intervención.' : '';

  // Simulated contract validation against the engine
  const checks = [
    { label: 'Define la función procesar(ctx, intervencion)', ok: /procesar\s*\(\s*ctx\s*,\s*intervencion\s*\)/.test(script) },
    { label: 'Usa los parámetros de la intervención', ok: /intervencion\./.test(script) },
    { label: 'Lee el Baseline sin escribir sobre él', ok: !/ctx\.baseline\s*(\[[^\]]*\]\s*)?=[^=]/.test(script) },
    { label: 'Devuelve el efecto por periodo', ok: /return/.test(script) },
  ];
  const contratoOk = checks.every((c) => c.ok);

  const agregarParametro = () => {
    const p = nuevoParametro.trim();
    const repetido = [...PARAMETROS_COMUNES, ...parametros].some((x) => x.toLowerCase() === p.toLowerCase());
    if (p && !repetido) setParametros((prev) => [...prev, p]);
    setNuevoParametro('');
  };

  const cargarArchivo = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScript(String(reader.result ?? ''));
      setLenguaje(f.name.endsWith('.js') ? 'JavaScript' : 'Python');
      setEditado(true);
      setArchivo(f.name);
    };
    reader.readAsText(f);
  };

  const crear = () => {
    setIntentado(true);
    if (errorNombre || errorScript) return;
    onCreate({
      clave, nombre: nombre.trim(), descripcion: descripcion.trim() || 'Tipo de intervención definido por script.',
      parametros, lenguaje, script, version: 1, estado: 'Borrador', responsable, modificado: hoy(), personalizado: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-tipo-title"
        className="flex flex-col w-full"
        style={{
          maxWidth: 720,
          maxHeight: 'calc(100vh - 48px)',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.22)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 id="nuevo-tipo-title" className="font-semibold text-base" style={{ color: '#0f172a' }}>
              Nuevo tipo de intervención
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Registre el script que el motor aplicará a cada intervención de este tipo; se crea como Borrador
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center rounded transition-colors hover:bg-slate-100"
            style={{ width: 28, height: 28, color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Identificación */}
          <div>
            <SectionTitle step={1} title="Identificación" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: '#475569' }} htmlFor="tipo-nombre">Nombre</label>
                <input
                  id="tipo-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Convenio institucional"
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: intentado && errorNombre ? '#fca5a5' : 'var(--border)' }}
                />
                <div className="mt-1 text-xs" style={{ color: intentado && errorNombre ? '#dc2626' : '#94a3b8' }}>
                  {intentado && errorNombre ? errorNombre : <>Identificador: <span className="font-mono">{clave || '—'}</span></>}
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: '#475569' }} htmlFor="tipo-resp">Responsable</label>
                <select id="tipo-resp" value={responsable} onChange={(e) => setResponsable(e.target.value)} className={inputCls} style={inputStyle}>
                  {RESPONSABLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls} style={{ color: '#475569' }} htmlFor="tipo-desc">
                  Descripción <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  id="tipo-desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Matrícula adicional por convenios con colegios y empresas"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Parámetros */}
          <div>
            <SectionTitle step={2} title="Parámetros de la intervención" hint="Lo que el usuario completa al registrar la intervención" />
            <div className="flex flex-wrap items-center gap-1.5">
              {PARAMETROS_COMUNES.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded" style={chipStyle} title="Parámetro común a todos los tipos">{p}</span>
              ))}
              {parametros.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium" style={{ fontSize: 10.5, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                  {p}
                  <button type="button" aria-label={`Quitar ${p}`} onClick={() => setParametros((prev) => prev.filter((x) => x !== p))} style={{ color: '#64748b' }}>✕</button>
                </span>
              ))}
              <input
                value={nuevoParametro}
                onChange={(e) => setNuevoParametro(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarParametro(); } }}
                placeholder="+ Parámetro adicional"
                aria-label="Parámetro adicional"
                className="text-xs px-2 py-0.5 rounded outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: '1px dashed #cbd5e1', width: 150 }}
              />
            </div>
            <div className="mt-1.5 text-xs" style={{ color: '#94a3b8' }}>
              Los parámetros comunes se capturan en toda intervención; agregue los propios de este tipo y pulse Enter
            </div>
          </div>

          {/* Script */}
          <div>
            <SectionTitle step={3} title="Script del tipo de intervención" hint="Entorno aislado · solo lectura sobre el Baseline" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Lenguaje">
                {(['Python', 'JavaScript'] as LenguajeScript[]).map((l) => {
                  const active = lenguaje === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => { setLenguaje(l); setEditado(false); setArchivo(''); }}
                      className="text-xs px-2.5 py-1 rounded font-medium transition-colors"
                      style={{
                        background: active ? '#eff6ff' : '#fff',
                        color: active ? '#1e40af' : '#64748b',
                        border: `1px solid ${active ? '#bfdbfe' : 'var(--border)'}`,
                      }}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                {archivo && <span className="text-xs" style={{ color: '#94a3b8' }}>Cargado desde archivo</span>}
                <CodeTag lenguaje={lenguaje} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded font-medium transition-colors bg-white hover:bg-slate-100"
                  style={{ border: '1px solid var(--border)', color: '#334155' }}
                >
                  Cargar archivo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".py,.js"
                  className="hidden"
                  onChange={(e) => { cargarArchivo(e.target.files?.[0]); e.target.value = ''; }}
                />
              </div>
            </div>
            <textarea
              value={script}
              onChange={(e) => { setScript(e.target.value); setEditado(true); }}
              rows={13}
              spellCheck={false}
              aria-label="Script del tipo de intervención"
              className="w-full px-3 py-2 rounded outline-none resize-y"
              style={{
                border: `1px solid ${intentado && errorScript ? '#fca5a5' : 'var(--border)'}`,
                background: '#0f172a', color: '#e2e8f0',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.6,
              }}
            />
            {intentado && errorScript && <div className="text-xs mt-1" style={{ color: '#dc2626' }}>{errorScript}</div>}
            <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Plantilla referencial: el contrato definitivo con el motor se definirá en la etapa de diseño funcional
            </div>
          </div>

          {/* Validación */}
          <div>
            <SectionTitle step={4} title="Validación del contrato del motor" hint="Opcional antes de registrar" />
            <div className="rounded px-3 py-2.5" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs" style={{ color: '#475569' }}>
                  {probado
                    ? contratoOk
                      ? <span style={{ color: '#15803d' }}>✓ El script cumple el contrato y puede ejecutarse con una intervención de prueba sobre el Baseline activo</span>
                      : <span style={{ color: '#b45309' }}>El script no cumple el contrato; revise los puntos marcados</span>
                    : 'Verifica que el motor pueda aceptar el script, sin guardar ni afectar escenarios.'}
                </div>
                <button
                  type="button"
                  onClick={() => setProbado(true)}
                  className="text-xs px-3 py-1.5 rounded font-medium transition-colors bg-white hover:bg-slate-100 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', color: '#334155' }}
                >
                  Validar script
                </button>
              </div>
              {probado && (
                <ul className="mt-2 space-y-1">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-xs" style={{ color: c.ok ? '#15803d' : '#b45309' }}>
                      <span style={{ width: 12 }}>{c.ok ? '✓' : '!'}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)', background: '#f8fafc', borderRadius: '0 0 8px 8px' }}
        >
          <div className="text-xs" style={{ color: '#64748b' }}>
            <span className="font-semibold" style={{ color: '#1e40af' }}>{nombre.trim() || 'Nuevo tipo'}</span>
            {' · '}{PARAMETROS_COMUNES.length + parametros.length} parámetros · v1 · Borrador
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3.5 py-2 rounded font-medium transition-colors bg-white hover:bg-slate-100"
              style={{ border: '1px solid var(--border)', color: '#334155' }}
            >
              Cancelar
            </button>
            <button
              onClick={crear}
              className="text-xs px-3.5 py-2 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
              style={{ color: '#fff', border: 'none' }}
            >
              Registrar tipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
