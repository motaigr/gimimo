import { PrintArea } from './PrintArea'

// Garrafa térmica branca (tampa preta com bico e alça) com a estampa
// "sua arte aqui".
export function GarrafaArt() {
  return (
    <svg viewBox="0 0 260 420" className="h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="gf-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D0D0CE" />
          <stop offset="14%" stopColor="#F3F3F1" />
          <stop offset="32%" stopColor="#FFFFFF" />
          <stop offset="72%" stopColor="#F2F2F0" />
          <stop offset="100%" stopColor="#C9C9C7" />
        </linearGradient>
        <linearGradient id="gf-black" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#111" />
          <stop offset="30%" stopColor="#3A3A3A" />
          <stop offset="60%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#0A0A0A" />
        </linearGradient>
        <filter id="gf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="gf-soft" x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="132" cy="398" rx="88" ry="11" fill="#000" opacity="0.2" filter="url(#gf-blur)" />

      {/* corpo com ombros arredondados */}
      <path
        d="M56 136 Q56 106 92 100 L168 100 Q204 106 204 136 L204 374 Q204 392 186 392 L74 392 Q56 392 56 374 Z"
        fill="url(#gf-body)"
      />
      <rect x="78" y="126" width="12" height="250" rx="6" fill="#fff" opacity="0.9" filter="url(#gf-soft)" />

      {/* gargalo: anel preto, faixa branca, anel preto */}
      <rect x="86" y="92" width="88" height="10" rx="3" fill="url(#gf-black)" />
      <rect x="88" y="70" width="84" height="23" fill="url(#gf-body)" />
      <rect x="86" y="62" width="88" height="9" rx="3" fill="url(#gf-black)" />

      {/* tampa com bico */}
      <path d="M92 62 L96 38 Q97 34 102 34 L158 34 Q163 34 164 38 L168 62 Z" fill="url(#gf-black)" />
      <rect x="112" y="18" width="36" height="18" rx="4" fill="url(#gf-black)" />
      <rect x="116" y="14" width="28" height="6" rx="3" fill="#2E2E2E" />
      {/* alça da tampa */}
      <path d="M164 42 Q200 42 200 72 Q200 96 186 104" fill="none" stroke="#151515" strokeWidth="8" strokeLinecap="round" />
      <path d="M166 40 Q196 42 197 68" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />

      {/* estampa */}
      <PrintArea x={74} y={180} width={112} height={128} />
    </svg>
  )
}
