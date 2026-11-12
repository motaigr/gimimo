import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Product, isRound } from '@/lib/catalog'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  product: Product
  className?: string
  iconClassName?: string
  eager?: boolean
}

// Imagem do produto: redonda nos bottons, quadrada (cantos arredondados) nos
// outros. Item personalizado (ou foto que não carregou) vira um tracejado com "+".
export function ProductImage({ product, className, iconClassName, eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const forma = isRound(product) ? 'rounded-full' : 'rounded-2xl'

  if (product.custom || !product.image || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center border-2 border-dashed border-gray-300 bg-cream text-gray-400',
          forma,
          className,
        )}
      >
        {product.custom ? (
          <Plus className={cn('h-1/4 w-1/4 stroke-[1.5]', iconClassName)} />
        ) : (
          <span className="text-[10px] uppercase tracking-widest">sem foto</span>
        )}
      </div>
    )
  }

  return (
    <img
      src={product.image}
      alt={product.name}
      width={400}
      height={400}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(forma, 'object-cover', className)}
    />
  )
}
