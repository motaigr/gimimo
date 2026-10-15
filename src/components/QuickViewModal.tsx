import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Product, getProductType, getTheme } from '@/lib/catalog'
import useCartStore from '@/stores/useCartStore'
import { ShoppingBag } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { QtyControl } from './QtyControl'

interface QuickViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { getQty, setQty } = useCartStore()
  const inCart = product ? getQty(product.id) : 0
  const [qty, setLocalQty] = useState(1)

  // ao abrir, começa com a quantidade que já está no pedido (ou 1)
  useEffect(() => {
    if (product) setLocalQty(inCart || 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  if (!product) return null

  const save = () => {
    setQty(product.id, qty)
    onClose()
  }

  const label = getTheme(product.theme)?.name ?? getProductType(product.type).label

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-none p-0 shadow-2xl sm:max-w-[425px]">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">Escolha a quantidade de {product.name}</DialogDescription>

        <div className="flex w-full items-center justify-center bg-cream p-10 sm:p-12">
          <ProductImage
            product={product}
            eager
            className="aspect-square w-full max-w-[280px] shadow-2xl animate-fade-in"
          />
        </div>

        <div className="space-y-6 bg-white p-8 text-center">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
            <h2 className="font-serif text-3xl font-normal tracking-wide">{product.name}</h2>
            {product.custom && (
              <p className="text-sm text-muted-foreground">
                Você envia a sua arte ou imagens de referência ao finalizar o pedido.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              quantidade
            </span>
            <QtyControl value={qty} onChange={setLocalQty} label={product.name} size="lg" />
          </div>

          <div className="space-y-3">
            <Button
              onClick={save}
              disabled={qty === 0 && inCart === 0}
              className="group h-14 w-full rounded-full text-sm font-medium uppercase tracking-widest transition-all"
            >
              <ShoppingBag className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              {inCart === 0
                ? 'Adicionar ao pedido'
                : qty === 0
                  ? 'Remover do pedido'
                  : 'Atualizar pedido'}
            </Button>
            {inCart > 0 && (
              <p className="text-xs text-muted-foreground">{inCart} já no seu pedido</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
