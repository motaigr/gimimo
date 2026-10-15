import { PrintArea } from './PrintArea'

// Caneca de cerâmica branca com a estampa "sua arte aqui".
export function CanecaArt() {
  return (
    <svg viewBox="0 0 420 360" className="h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        {/* sombreado de cilindro: escuro nas laterais, claro perto da esquerda */}
        <linearGradient id="cn-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D2D2D0" />
          <stop offset="12%" stopColor="#F2F2F0" />
          <stop offset="30%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F3F3F1" />
          <stop offset="92%" stopColor="#DCDCDA" />
          <stop offset="100%" stopColor="#C8C8C6" />
        </linearGradient>
        <linearGradient id="cn-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFCFCD" />
          <stop offset="100%" stopColor="#F4F4F2" />
        </linearGradient>
        <linearGradient id="cn-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E6E6E4" />
          <stop offset="55%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CDCDCB" />
        </linearGradient>
        <filter id="cn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="cn-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="200" cy="322" rx="150" ry="14" fill="#000" opacity="0.18" filter="url(#cn-blur)" />

      {/* alça (atrás do corpo, à direita) */}
      <path d="M296 92 C 392 86, 402 282, 296 276" fill="none" stroke="#C4C4C2" strokeWidth="34" strokeLinecap="round" />
      <path d="M296 92 C 388 88, 396 280, 296 276" fill="none" stroke="url(#cn-handle)" strokeWidth="28" strokeLinecap="round" />
      <path d="M300 100 C 372 100, 380 262, 300 266" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" filter="url(#cn-soft)" />

      {/* corpo */}
      <path d="M50 58 V296 A125 16 0 0 0 300 296 V58 Z" fill="url(#cn-body)" />
      {/* reflexo vertical */}
      <rect x="86" y="80" width="14" height="210" rx="7" fill="#fff" opacity="0.9" filter="url(#cn-soft)" />

      {/* boca */}
      <ellipse cx="175" cy="58" rx="125" ry="18" fill="#F7F7F5" stroke="#DADAD8" strokeWidth="1.5" />
      <ellipse cx="175" cy="59" rx="114" ry="13" fill="url(#cn-inside)" />

      {/* estampa */}
      <PrintArea x={110} y={112} width={150} height={150} />
    </svg>
  )
}
