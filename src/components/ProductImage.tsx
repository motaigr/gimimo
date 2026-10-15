import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Product } from '@/lib/catalog'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  product: Product
  className?: string
  iconClassName?: string
  eager?: boolean
}

// Imagem redonda do produto. Item personalizado (ou foto que não carregou)
// vira um círculo tracejado com "+".
export function ProductImage({ product, className, iconClassName, eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (product.custom || !product.image || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-cream text-gray-400',
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
      className={cn('rounded-full object-cover', className)}
    />
  )
}
