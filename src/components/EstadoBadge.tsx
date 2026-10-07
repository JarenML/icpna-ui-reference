import type { EstadoEscenario } from '../data/constants';

const ESTADO_STYLE: Record<EstadoEscenario, { color: string; bg: string; border: string; label: string; title: string }> = {
  'Borrador': {
    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Borrador',
    title: 'Tiene intervenciones registradas, pero nunca se simuló',
  },
  'En proceso': {
    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'En proceso',
    title: 'Simulación ejecutándose en segundo plano',
  },
  'Simulado': {
    color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', label: 'Simulado',
    title: 'Se ejecutó y sus resultados están vigentes',
  },
  'Aprobado': {
    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', label: 'Aprobado · Meta oficial',
    title: 'Escenario elegido por la Gerencia como Meta Factible',
  },
};

export const Spinner = ({ size = 10 }: { size?: number }) => (
  <span
    className="inline-block rounded-full animate-spin flex-shrink-0"
    style={{ width: size, height: size, border: '1.5px solid #bfdbfe', borderTopColor: '#2563eb' }}
    aria-hidden="true"
  />
);

export default function EstadoBadge({ estado, compact = false }: { estado: EstadoEscenario; compact?: boolean }) {
  const s = ESTADO_STYLE[estado];
  return (
    <span
      title={s.title}
      className="inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: compact ? 10 : 11,
        padding: compact ? '0 6px' : '1px 8px',
      }}
    >
      {estado === 'En proceso' ? (
        <Spinner size={compact ? 8 : 9} />
      ) : (
        <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: s.color, opacity: estado === 'Borrador' ? 0.5 : 1 }} />
      )}
      {compact && estado === 'Aprobado' ? 'Aprobado' : s.label}
    </span>
  );
}
