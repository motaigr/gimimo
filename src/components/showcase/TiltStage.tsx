import { PointerEvent, ReactNode, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Palco das ilustrações de produto: flutua devagar e inclina acompanhando o
// mouse/dedo, para a peça parecer um objeto de verdade. Sem movimento para
// quem prefere menos animação (prefers-reduced-motion).
interface TiltStageProps {
  children: ReactNode
  label: string
  className?: string // largura máxima da ilustração
}

export function TiltStage({ children, label, className }: TiltStageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMove = (e: PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: py * -16, y: px * 16 })
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className={cn('mx-auto w-full select-none [perspective:900px]', className)}
    >
      <div className="motion-safe:animate-float">
        <div
          className="transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
