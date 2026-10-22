import type { LenguajeScript } from '../data/tiposIntervencion';

// Marks a block as a code snippet without exposing a file name
export default function CodeTag({ lenguaje, color = '#1e40af', bg = '#eff6ff', border = '#bfdbfe' }: { lenguaje: LenguajeScript; color?: string; bg?: string; border?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 rounded font-medium whitespace-nowrap" style={{ fontSize: 10.5, color, background: bg, border: `1px solid ${border}` }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
      </svg>
      Script · {lenguaje}
    </span>
  );
}
