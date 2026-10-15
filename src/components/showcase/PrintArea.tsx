// Estampa "SUA ARTE AQUI!" (moldura pontilhada + linhas + texto condensado),
// a mesma do botton, para usar na caneca e na garrafa.
interface PrintAreaProps {
  x: number
  y: number
  width: number
  height: number
}

export function PrintArea({ x, y, width, height }: PrintAreaProps) {
  const cx = x + width / 2
  const pad = width * 0.1
  const big = width * 0.31
  const small = width * 0.215
  const textTop = y + height / 2 - (small + big) / 2 + small * 0.82

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={width * 0.08}
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2"
        strokeDasharray="0.1 5.5"
        strokeLinecap="round"
      />
      <line x1={x + pad} y1={y + height * 0.2} x2={x + width - pad} y2={y + height * 0.2} stroke="#1c1c1c" strokeWidth="2.2" />
      <line x1={x + pad} y1={y + height * 0.8} x2={x + width - pad} y2={y + height * 0.8} stroke="#1c1c1c" strokeWidth="2.2" />
      <text
        x={cx}
        y={textTop}
        textAnchor="middle"
        fontFamily="Oswald, 'Arial Narrow', sans-serif"
        fontWeight="700"
        fontSize={small}
        fill="#1c1c1c"
      >
        SUA ARTE
      </text>
      <text
        x={cx}
        y={textTop + big * 0.95}
        textAnchor="middle"
        fontFamily="Oswald, 'Arial Narrow', sans-serif"
        fontWeight="700"
        fontSize={big}
        fill="#1c1c1c"
      >
        AQUI!
      </text>
    </g>
  )
}
