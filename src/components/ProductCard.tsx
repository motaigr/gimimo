import { Product } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import { ProductImage } from './ProductImage'

interface ProductCardProps {
  product: Product
  qty: number
  onClick: (product: Product) => void
  index: number
}

export function ProductCard({ product, qty, onClick, index }: ProductCardProps) {
  const selected = qty > 0

  return (
    <button
      type="button"
      className="group flex w-full flex-col items-center gap-3 self-start animate-fade-in-up focus-visible:outline-none"
      // atraso da animação limitado para listas grandes não demorarem a aparecer
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms`, animationFillMode: 'both' }}
      onClick={() => onClick(product)}
      aria-label={selected ? `${product.name} — ${qty} no pedido` : product.name}
    >
      <div
        className={cn(
          'relative aspect-square w-full shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105',
          'shadow-lg group-hover:shadow-float group-focus-visible:ring-2 group-focus-visible:ring-black group-focus-visible:ring-offset-4',
          selected && 'ring-[3px] ring-brand-coral ring-offset-4',
        )}
      >
        <ProductImage product={product} className="h-full w-full" />
        {/* brilho do botton */}
        {!product.custom && (
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_45%)] shadow-[inset_0_-6px_14px_rgba(0,0,0,0.18)]" />
        )}

        {selected && (
          <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-coral px-2 text-xs font-semibold text-white shadow-md animate-fade-in">
            {qty}
          </span>
        )}
      </div>

      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-widest text-gray-400 transition-colors group-hover:text-black',
          product.custom && 'text-gray-600',
        )}
      >
        {product.name}
      </span>
    </button>
  )
}
