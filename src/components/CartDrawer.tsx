import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Trash2 } from 'lucide-react'
import useCartStore from '@/stores/useCartStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ProductImage } from './ProductImage'
import { QtyControl } from './QtyControl'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function CartDrawer() {
  const { cart, totalItems, setQty, removeItem } = useCartStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const finalizar = () => {
    setOpen(false)
    navigate('/pedido')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-transparent"
          aria-label={`Abrir sacola (${plural(totalItems, 'item', 'itens')})`}
        >
          <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-coral px-1 text-[10px] font-semibold text-white">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col border-l-0 font-sans shadow-2xl sm:max-w-md">
        <SheetHeader className="space-y-1 pb-4 text-left">
          <SheetTitle className="font-serif text-2xl font-normal tracking-wide">
            Seu pedido
          </SheetTitle>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {plural(totalItems, 'unidade', 'unidades')} · {plural(cart.length, 'modelo', 'modelos')}
          </p>
        </SheetHeader>

        <Separator />

        <ScrollArea className="-mx-6 flex-1 px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 stroke-[1]" />
              <p className="text-sm uppercase tracking-wider">Nenhum item ainda</p>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <ProductImage
                    product={item}
                    className="h-16 w-16 shrink-0 shadow-md"
                    iconClassName="h-5 w-5"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-medium leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      <QtyControl
                        value={item.qty}
                        onChange={(q) => setQty(item.id, q)}
                        label={item.name}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`remover ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="mt-auto space-y-4 border-t pt-6">
            <div className="flex items-center justify-between font-serif text-lg">
              <span>Total</span>
              <span>{plural(totalItems, 'unidade', 'unidades')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pedido para orçamento: a Gimimo responde com valores e prazo.
            </p>
            <Button
              onClick={finalizar}
              className="h-12 w-full rounded-full bg-black text-sm font-medium uppercase tracking-widest hover:bg-black/90"
            >
              Finalizar pedido
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
