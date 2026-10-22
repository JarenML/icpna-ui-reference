import { useState } from 'react';
import { FOOTNOTE } from '../data/constants';
import { PARAMETROS_COMUNES, type TipoIntervencion } from '../data/tiposIntervencion';
import NuevoTipoIntervencionModal from '../components/NuevoTipoIntervencionModal';
import CodeTag from '../components/CodeTag';

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);

const EstadoChip = ({ estado }: { estado: TipoIntervencion['estado'] }) =>
  estado === 'Activo' ? (
    <span className="inline-block px-1.5 rounded font-medium" style={{ fontSize: 10.5, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Activo</span>
  ) : (
    <span className="inline-block px-1.5 rounded font-medium" style={{ fontSize: 10.5, background: '#f8fafc', color: '#64748b', border: '1px solid var(--border)' }}>Borrador</span>
  );

const FLUJO = [
  { titulo: 'Intervención', detalle: 'Parámetros: impacto, periodo, alcance…' },
  { titulo: 'Script del tipo', detalle: 'Un script por cada tipo de intervención' },
  { titulo: 'Motor de Simulación', detalle: 'Reglas + Parámetros + Estadística Simple' },
  { titulo: 'Resultado', detalle: 'Contribución de cada intervención al escenario' },
];

const REGLAS = [
  'Cada intervención de un escenario es un conjunto de parámetros que el motor pasa al script de su tipo.',
  'Los scripts leen el Baseline en modo solo lectura; nunca lo modifican ni lo recalculan.',
  'Un tipo en Borrador no aparece en Construcción de Escenario hasta que se activa.',
  'Cada cambio de script genera una nueva versión y queda registrado en la Trazabilidad.',
  'Los scripts se ejecutan en un entorno aislado, sin acceso a red ni escritura.',
];

interface Props {
  tipos: TipoIntervencion[];
  onCrear: (t: TipoIntervencion) => void;
  onActivar: (clave: string) => void;
}

export default function ConfiguracionMotor({ tipos, onCrear, onActivar }: Props) {
  const [seleccion, setSeleccion] = useState(tipos[0].clave);
  const [modalOpen, setModalOpen] = useState(false);

  const actual = tipos.find((t) => t.clave === seleccion) ?? tipos[0];
  const activos = tipos.filter((t) => t.estado === 'Activo').length;

  return (
    <div className="p-5 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg" style={{ color: '#0f172a' }}>Configuración del motor</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Tipos de intervención que procesa el Motor de Simulación y el script asociado a cada uno
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium transition-colors bg-blue-800 hover:bg-blue-900"
          style={{ color: '#fff', border: 'none' }}
        >
          + Nuevo tipo de intervención
        </button>
      </div>

      {/* Engine flow */}
      <Card style={{ padding: '14px 20px' }}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b', fontSize: 10.5 }}>
          Cómo procesa el motor una intervención
        </span>
        <div className="grid items-stretch gap-2 mt-3" style={{ gridTemplateColumns: '1fr 20px 1fr 20px 1fr 20px 1fr' }}>
          {FLUJO.flatMap((f, i) => {
            const destacado = i === 1;
            const card = (
              <div
                key={f.titulo}
                className="rounded px-3 py-2.5"
                style={{ background: destacado ? '#eff6ff' : '#f8fafc', border: `1px solid ${destacado ? '#bfdbfe' : 'var(--border)'}` }}
              >
                <div className="text-xs font-semibold" style={{ color: destacado ? '#1e40af' : '#0f172a' }}>{f.titulo}</div>
                <div className="mt-0.5" style={{ color: '#64748b', fontSize: 11, lineHeight: 1.45 }}>{f.detalle}</div>
              </div>
            );
            return i < FLUJO.length - 1
              ? [card, <div key={`arrow-${i}`} className="flex items-center justify-center" style={{ color: '#94a3b8' }}>→</div>]
              : [card];
          })}
        </div>
      </Card>

      {/* Intervention types */}
      <Card>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Tipos de intervención</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {tipos.length} tipos · {activos} activos. Seleccione uno para ver su script y los parámetros que recibe
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {tipos.map((t) => {
            const active = t.clave === actual.clave;
            return (
              <button
                key={t.clave}
                onClick={() => setSeleccion(t.clave)}
                className={`flex flex-col text-left rounded p-3 transition-colors border ${active ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                style={{ boxShadow: active ? '0 0 0 1px #2563eb' : undefined }}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{t.nombre}</span>
                  <EstadoChip estado={t.estado} />
                </div>
                <div className="text-xs mt-1 flex-1" style={{ color: '#64748b', lineHeight: 1.45 }}>{t.descripcion}</div>
                <div className="flex items-center justify-between w-full mt-2.5 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <CodeTag lenguaje={t.lenguaje} />
                  <span style={{ color: '#94a3b8', fontSize: 10.5 }}>
                    {PARAMETROS_COMUNES.length + t.parametros.length} parámetros · {t.personalizado ? 'Nuevo · ' : ''}v{t.version}
                  </span>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setModalOpen(true)}
            className="flex flex-col items-center justify-center text-center rounded p-3 transition-colors hover:bg-slate-50"
            style={{ border: '1.5px dashed #cbd5e1', background: '#fcfcfd', minHeight: 110 }}
          >
            <span className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, border: '1px dashed #94a3b8', color: '#64748b' }}>+</span>
            <div className="text-sm font-semibold mt-1.5" style={{ color: '#475569' }}>Agregar tipo de intervención</div>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8', lineHeight: 1.45 }}>
              Registre un nuevo script en Python o JavaScript
            </p>
          </button>
        </div>
      </Card>

      {/* Script detail + rules */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
        <Card>
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Script · {actual.nombre}</div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {actual.lenguaje} · v{actual.version} · {actual.responsable} · modificado {actual.modificado}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <EstadoChip estado={actual.estado} />
              {actual.estado === 'Borrador' && (
                <button
                  onClick={() => onActivar(actual.clave)}
                  className="text-xs px-2.5 py-1 rounded font-medium transition-colors hover:bg-blue-100"
                  style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
                >
                  Activar tipo
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#64748b', fontSize: 10.5 }}>
                Parámetros que recibe de cada intervención
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PARAMETROS_COMUNES.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded" style={{ fontSize: 10.5, background: '#f8fafc', color: '#475569', border: '1px solid var(--border)' }}>{p}</span>
                ))}
                {actual.parametros.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded font-medium" style={{ fontSize: 10.5, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>{p}</span>
                ))}
              </div>
            </div>
            <div className="rounded overflow-hidden" style={{ border: '1px solid #1e293b' }}>
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#1e293b' }}>
                <CodeTag lenguaje={actual.lenguaje} color="#cbd5e1" bg="#0f172a" border="#334155" />
                <div className="flex items-center gap-2">
                  <span className="px-1.5 rounded font-medium" style={{ fontSize: 10, background: '#422006', color: '#fcd34d', border: '1px solid #854d0e' }}>
                    Código referencial
                  </span>
                  <span style={{ color: '#64748b', fontSize: 10.5 }}>Solo lectura</span>
                </div>
              </div>
              <pre
                className="px-3 py-2.5 overflow-x-auto"
                style={{ background: '#0f172a', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, lineHeight: 1.6, margin: 0 }}
              >
                {actual.script}
              </pre>
            </div>
            <p className="text-xs" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
              El código es solo referencial: ilustra la lógica conceptual de cada tipo de intervención. Los scripts definitivos, su lenguaje y el contrato con el motor se definirán en la etapa de diseño funcional.
            </p>
          </div>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Reglas de uso</div>
          <ul className="mt-2.5 space-y-2.5">
            {REGLAS.map((r) => (
              <li key={r} className="flex gap-2 text-xs" style={{ color: '#475569', lineHeight: 1.5 }}>
                <span style={{ color: '#2563eb' }}>•</span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-xs text-center pt-2 pb-4" style={{ color: '#94a3b8' }}>{FOOTNOTE}</p>

      <NuevoTipoIntervencionModal
        open={modalOpen}
        existentes={tipos}
        onClose={() => setModalOpen(false)}
        onCreate={(t) => { onCrear(t); setSeleccion(t.clave); setModalOpen(false); }}
      />
    </div>
  );
}
