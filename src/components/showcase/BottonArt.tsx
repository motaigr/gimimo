// Ilustração de botton (frente com "sua arte aqui" + verso com o alfinete),
// no estilo de mockup de produto. Para mudar a cor, troque BOTTON_COLOR.
const BOTTON_COLOR = { light: '#FBB0A6', base: '#F28B80', dark: '#D46C61', edge: '#B9554B' }

export function BottonArt() {
  const c = BOTTON_COLOR

  return (
    <svg viewBox="0 0 540 360" className="h-auto w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="bt-face" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        {/* verso de metal: aro escuro, chapa prateada e área central rebaixada */}
        <linearGradient id="bt-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8A8A8A" />
          <stop offset="50%" stopColor="#3E3E3E" />
          <stop offset="100%" stopColor="#262626" />
        </linearGradient>
        <linearGradient id="bt-steel" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0%" stopColor="#F7F7F7" />
          <stop offset="45%" stopColor="#C9C9C9" />
          <stop offset="100%" stopColor="#8F8F8F" />
        </linearGradient>
        <linearGradient id="bt-steel-in" x1="0.2" y1="0.1" x2="0.8" y2="0.95">
          <stop offset="0%" stopColor="#B4B4B4" />
          <stop offset="55%" stopColor="#D8D8D8" />
          <stop offset="100%" stopColor="#ECECEC" />
        </linearGradient>
        <linearGradient id="bt-step" x1="0.2" y1="0.1" x2="0.8" y2="0.95">
          <stop offset="0%" stopColor="#7A7A7A" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <radialGradient id="bt-shine" cx="30%" cy="22%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="bt-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="bt-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* sombras no chão */}
      <ellipse cx="380" cy="292" rx="112" ry="12" fill="#000" opacity="0.12" filter="url(#bt-blur)" />
      <ellipse cx="185" cy="330" rx="125" ry="13" fill="#000" opacity="0.2" filter="url(#bt-blur)" />

      {/* ===== VERSO de metal (atrás, à direita) ===== */}
      <g>
        <circle cx="374" cy="158" r="126" fill="url(#bt-rim)" />
        <circle cx="374" cy="158" r="119" fill="url(#bt-steel)" />
        {/* degrau da área central (claro embaixo, escuro em cima = rebaixado) */}
        <circle cx="374" cy="158" r="101" fill="url(#bt-steel-in)" />
        <circle cx="374" cy="158" r="101" fill="none" stroke="url(#bt-step)" strokeWidth="3" />
        {/* reflexos circulares do metal escovado */}
        <circle cx="374" cy="158" r="112" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
        <circle cx="374" cy="158" r="80" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />

        {/* alfinete */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* sombras */}
          <g stroke="#000" strokeOpacity="0.18" filter="url(#bt-soft)" transform="translate(1.5 3.5)">
            <path d="M322 140 h22 q0 14 -11 14 q-11 0 -11 -14 z" strokeWidth="3" />
            <path d="M330 141 L436 146" strokeWidth="2.5" />
          </g>
          {/* suporte em D (esquerda) */}
          <path d="M322 140 h22 q0 14 -11 14 q-11 0 -11 -14 z" stroke="#5E5E5E" strokeWidth="3.8" />
          <path d="M324 141.5 h18" stroke="#EDEDED" strokeWidth="1" />
          {/* agulha */}
          <path d="M330 141 L436 146" stroke="#626262" strokeWidth="3.4" />
          <path d="M332 140.2 L434 145" stroke="#F2F2F2" strokeWidth="0.9" />
          {/* trava com mola (direita) */}
          <path d="M436 146 q8 0 8 -4 q0 -4 -6 -4" stroke="#5E5E5E" strokeWidth="3.2" />
          <ellipse cx="428" cy="145.5" rx="3.4" ry="5.6" stroke="#5E5E5E" strokeWidth="2.2" />
          <ellipse cx="422" cy="145.2" rx="3.4" ry="5.6" stroke="#5E5E5E" strokeWidth="2.2" />
        </g>
      </g>

      {/* ===== FRENTE (na frente, à esquerda) ===== */}
      <g>
        {/* espessura */}
        <circle cx="186" cy="190" r="138" fill={c.edge} />
        {/* face */}
        <circle cx="180" cy="184" r="138" fill="url(#bt-face)" />

        {/* área da arte: círculo pontilhado */}
        <circle
          cx="180"
          cy="184"
          r="114"
          fill="none"
          stroke="#1c1c1c"
          strokeWidth="2.2"
          strokeDasharray="0.1 6"
          strokeLinecap="round"
        />

        {/* linhas acima e abaixo do texto */}
        <line x1="92" y1="122" x2="268" y2="122" stroke="#1c1c1c" strokeWidth="2.5" />
        <line x1="92" y1="252" x2="268" y2="252" stroke="#1c1c1c" strokeWidth="2.5" />

        <text
          x="180"
          y="178"
          textAnchor="middle"
          fontFamily="Oswald, 'Arial Narrow', sans-serif"
          fontWeight="700"
          fontSize="48"
          fill="#1c1c1c"
        >
          SUA ARTE
        </text>
        <text
          x="180"
          y="240"
          textAnchor="middle"
          fontFamily="Oswald, 'Arial Narrow', sans-serif"
          fontWeight="700"
          fontSize="70"
          letterSpacing="1"
          fill="#1c1c1c"
        >
          AQUI!
        </text>

        {/* brilho do acabamento */}
        <circle cx="180" cy="184" r="138" fill="url(#bt-shine)" />
        <path
          d="M58 150 A124 124 0 0 1 190 56"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
