import type { Screen } from '../App';

const screenTitles: Record<Screen, string> = {
  resumen: 'Resumen Ejecutivo',
  listaEscenarios: 'Escenarios',
  escenarios: 'Resultado de Simulación',
  intervenciones: 'Construcción de Escenario',
  comparacion: 'Comparación de Escenarios',
  granular: 'Reporte Granular',
  alertas: 'Reporte de Alertas',
  trazabilidad: 'Trazabilidad del Escenario',
  powerbi: 'Reportes en Power BI',
};

interface Props {
  screen: Screen;
  navigate: (s: Screen) => void;
}

export default function Header({ screen, navigate }: Props) {
  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: 48,
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        zIndex: 10,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: '#1e40af' }}>ICPNA</span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span className="font-medium text-sm" style={{ color: '#334155' }}>Planificación de Matrícula</span>
        <span style={{ color: '#cbd5e1' }}>›</span>
        {screen === 'escenarios' && (
          <>
            <button
              onClick={() => navigate('listaEscenarios')}
              className="text-sm hover:underline"
              style={{ color: '#64748b' }}
            >
              Escenarios
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
          </>
        )}
        <span className="text-sm" style={{ color: '#64748b' }}>{screenTitles[screen]}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Year badge */}
        <div
          className="text-xs font-semibold px-2.5 py-1 rounded"
          style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
        >
          Ciclo 2027
        </div>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded"
          style={{ width: 32, height: 32, background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b' }}
        >
          <span style={{ fontSize: 14 }}>🔔</span>
          <span
            className="absolute"
            style={{
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: '#dc2626',
              borderRadius: '50%',
              border: '1.5px solid #fff',
            }}
          />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center font-semibold text-xs rounded-full"
            style={{ width: 30, height: 30, background: '#1e40af', color: '#fff' }}
          >
            GC
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-medium" style={{ color: '#334155' }}>Gerencia Comercial</div>
            <div className="text-xs" style={{ color: '#94a3b8' }}>ICPNA Planificación</div>
          </div>
        </div>
      </div>
    </header>
  );
}
