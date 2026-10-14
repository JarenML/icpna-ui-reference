// Brand panel of the login: a quiet presentation of the platform.
export default function LoginShowcase() {
  return (
    <aside
      className="relative hidden lg:flex flex-col justify-between overflow-hidden px-12 py-10"
      style={{ width: '46%', background: '#1a2744', color: '#e2e8f0' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(180deg, transparent, #000 40%, #000 60%, transparent)',
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div
          className="flex items-center justify-center font-bold text-sm"
          style={{ width: 38, height: 38, background: '#2563eb', borderRadius: 6, color: '#fff', letterSpacing: '0.1em' }}
        >
          IC
        </div>
        <div className="font-semibold text-sm" style={{ color: '#f8fafc', letterSpacing: '0.06em' }}>ICPNA</div>
      </div>

      {/* Presentation */}
      <div className="relative max-w-md">
        <div style={{ width: 32, height: 2, background: '#2563eb', marginBottom: 20 }} />
        <h1 className="font-semibold" style={{ fontSize: 30, lineHeight: 1.2, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          Plataforma de Planificación de Matrícula
        </h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: '#94a3b8' }}>
          Metas, escenarios y factibilidad operativa en un solo lugar.
        </p>
      </div>

      <div className="relative text-xs" style={{ color: '#475569' }}>
        © 2026 ICPNA
      </div>
    </aside>
  );
}
