import type { Screen } from '../App';

interface NavItem {
  id: Screen;
  label: string;
  icon: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: '◈' },
  { id: 'listaEscenarios', label: 'Escenarios', icon: '⊡' },
  { id: 'intervenciones', label: 'Intervenciones', icon: '⊕' },
  { id: 'comparacion', label: 'Comparación', icon: '⊞' },
  { id: 'granular', label: 'Reporte Granular', icon: '⊟' },
  { id: 'alertas', label: 'Alertas', icon: '⚠', badge: '3' },
  { id: 'trazabilidad', label: 'Trazabilidad', icon: '↺' },
];

interface Props {
  current: Screen;
  navigate: (s: Screen) => void;
}

export default function Sidebar({ current, navigate }: Props) {
  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{
        width: 220,
        background: 'var(--nav-bg)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center gap-2 px-4 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-center font-bold text-xs tracking-widest"
          style={{
            width: 32,
            height: 32,
            background: '#2563eb',
            borderRadius: 4,
            color: '#fff',
            letterSpacing: '0.1em',
          }}
        >
          IC
        </div>
        <div>
          <div className="font-semibold text-xs" style={{ color: '#f1f5f9', letterSpacing: '0.02em' }}>
            ICPNA
          </div>
          <div className="text-xs leading-tight" style={{ color: '#64748b', fontSize: 10 }}>
            Planif. de Matrícula
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569', fontSize: 10 }}>
          Navegación
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const active = current === item.id || (item.id === 'listaEscenarios' && current === 'escenarios');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded mb-0.5 text-left transition-colors duration-100"
              style={{
                background: active ? 'var(--nav-active-bg)' : 'transparent',
                color: active ? '#ffffff' : 'var(--nav-text)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                border: active ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--nav-hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.7, width: 16, textAlign: 'center' }}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className="text-xs font-semibold"
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '0 5px',
                    fontSize: 10,
                    lineHeight: '16px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs" style={{ color: '#475569' }}>
          <div className="font-medium mb-0.5" style={{ color: '#64748b' }}>Baseline activo</div>
          <div className="font-mono" style={{ color: '#94a3b8', fontSize: 11 }}>2027.01 — Solo lectura</div>
        </div>
      </div>
    </aside>
  );
}
