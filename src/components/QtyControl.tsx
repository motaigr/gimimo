import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QtyControlProps {
  value: number
  onChange: (qty: number) => void
  label: string
  size?: 'sm' | 'lg'
  min?: number
}

// Botões −/+ e campo numérico: dá para digitar quantidades grandes direto.
export function QtyControl({ value, onChange, label, size = 'sm', min = 0 }: QtyControlProps) {
  const lg = size === 'lg'
  const btn = cn(
    'flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent',
    lg ? 'h-12 w-12' : 'h-8 w-8',
  )

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`diminuir ${label}`}
      >
        <Minus className={lg ? 'h-4 w-4' : 'h-3 w-3'} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.floor(Number(e.target.value)) || 0))}
        onFocus={(e) => e.target.select()}
        aria-label={`quantidade de ${label}`}
        className={cn(
          'bg-transparent text-center font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          lg ? 'w-16 text-lg' : 'w-10 text-sm',
        )}
      />
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        aria-label={`aumentar ${label}`}
      >
        <Plus className={lg ? 'h-4 w-4' : 'h-3 w-3'} />
      </button>
    </div>
  )
}
