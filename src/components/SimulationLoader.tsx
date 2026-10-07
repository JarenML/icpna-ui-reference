export default function SimulationLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex flex-col items-center gap-6 p-10 rounded-lg"
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          minWidth: 400,
        }}
      >
        {/* Spinner */}
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '3px solid #e2e8f0',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '3px solid transparent',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        <div className="text-center">
          <div className="font-semibold text-base mb-2" style={{ color: '#0f172a' }}>
            Procesando escenario…
          </div>
          <div className="text-sm" style={{ color: '#64748b' }}>
            Aplicando reglas, intervenciones y validaciones de capacidad.
          </div>
        </div>

        {/* Progress steps */}
        <div className="w-full space-y-2">
          {[
            { label: 'Aplicando intervenciones sobre Baseline', done: true },
            { label: 'Calculando contribución por iniciativa', done: true },
            { label: 'Evaluando factibilidad operativa', done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: step.done ? '#16a34a' : '#e2e8f0',
                  border: step.done ? 'none' : '2px solid #93c5fd',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 9,
                }}
              >
                {step.done ? '✓' : ''}
              </div>
              <span className="text-xs" style={{ color: step.done ? '#334155' : '#94a3b8' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="text-xs text-center"
          style={{ color: '#94a3b8' }}
        >
          Este proceso aplica reglas de negocio explícitas, no optimización automática.
        </div>
      </div>
    </div>
  );
}
