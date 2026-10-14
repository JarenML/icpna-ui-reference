import { useState, type FormEvent } from 'react';
import { Spinner } from '../components/EstadoBadge';
import LoginShowcase from '../components/LoginShowcase';

interface Props {
  onLogin: () => void;
}

// Demo credentials, prefilled so the visitor only has to press "Ingresar"
const DEMO_EMAIL = 'gerencia.comercial@icpna.edu.pe';
const DEMO_PASSWORD = 'Icpna2027$';

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="9.5" height="9.5" fill="#f25022" />
    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7fba00" />
    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00a4ef" />
    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#ffb900" />
  </svg>
);

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [verPassword, setVerPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState<'credenciales' | 'microsoft' | null>(null);

  const ingresar = (via: 'credenciales' | 'microsoft') => {
    if (cargando) return;
    setCargando(via);
    window.setTimeout(onLogin, 1100);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ingresar('credenciales');
  };

  const inputWrap = 'flex items-center gap-2.5 rounded-md px-3 transition-shadow focus-within:ring-2 focus-within:ring-blue-600/25';

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fafc' }}>
      <LoginShowcase />

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full" style={{ maxWidth: 380 }}>
          {/* Compact logo for small screens */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div
              className="flex items-center justify-center font-bold text-xs"
              style={{ width: 34, height: 34, background: '#2563eb', borderRadius: 5, color: '#fff', letterSpacing: '0.1em' }}
            >
              IC
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>ICPNA</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Planificación de Matrícula</div>
            </div>
          </div>

          <h2 className="font-semibold" style={{ fontSize: 24, color: '#0f172a' }}>Iniciar sesión</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Ingrese con su cuenta institucional ICPNA</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium mb-1.5" style={{ color: '#334155' }}>
                Correo institucional
              </label>
              <div className={inputWrap} style={{ background: '#fff', border: '1px solid #cbd5e1', height: 42 }}>
                <span style={{ color: '#94a3b8' }}><MailIcon /></span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                  style={{ color: '#0f172a' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium mb-1.5" style={{ color: '#334155' }}>
                Contraseña
              </label>
              <div className={inputWrap} style={{ background: '#fff', border: '1px solid #cbd5e1', height: 42 }}>
                <span style={{ color: '#94a3b8' }}><LockIcon /></span>
                <input
                  id="login-password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                  style={{ color: '#0f172a', letterSpacing: verPassword ? undefined : '0.12em' }}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="flex items-center justify-center rounded transition-colors hover:bg-slate-100"
                  style={{ width: 28, height: 28, color: verPassword ? '#1e40af' : '#94a3b8' }}
                >
                  <EyeIcon off={verPassword} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="accent-blue-800"
                  style={{ width: 14, height: 14 }}
                />
                Recordarme
              </label>
              <button type="button" className="font-medium hover:underline" style={{ color: '#1e40af' }}>
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors bg-blue-800 hover:bg-blue-900 disabled:opacity-90"
              style={{ height: 42, color: '#fff', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(30, 64, 175, 0.18)' }}
            >
              {cargando === 'credenciales' ? (
                <>
                  <Spinner size={13} />
                  Validando credenciales…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1" style={{ height: 1, background: '#e2e8f0' }} />
            <span className="text-xs" style={{ color: '#94a3b8' }}>o</span>
            <div className="flex-1" style={{ height: 1, background: '#e2e8f0' }} />
          </div>

          <button
            type="button"
            onClick={() => ingresar('microsoft')}
            disabled={cargando !== null}
            className="w-full flex items-center justify-center gap-2.5 rounded-md text-sm font-medium transition-colors hover:bg-slate-50"
            style={{ height: 42, background: '#fff', color: '#334155', border: '1px solid #cbd5e1' }}
          >
            {cargando === 'microsoft' ? <Spinner size={13} /> : <MicrosoftIcon />}
            Continuar con Microsoft Entra ID
          </button>

          <div className="flex items-start gap-2 mt-8 text-xs" style={{ color: '#94a3b8' }}>
            <span style={{ marginTop: 1 }}><LockIcon /></span>
            <span>Acceso restringido a personal autorizado de ICPNA. Las sesiones y operaciones quedan registradas para auditoría.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
