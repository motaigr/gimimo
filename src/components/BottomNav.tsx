import { PRODUCT_TYPES, ProductTypeId } from '@/lib/catalog'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  active: ProductTypeId
  onSelect: (type: ProductTypeId) => void
}

// Barra flutuante com os tipos de produto. Rola na horizontal no celular
// quando houver muitos tipos.
export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 animate-fade-in-up pointer-events-none">
      <nav
        aria-label="Tipos de produto"
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-gray-200/50 bg-white/90 px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl saturate-150 [scrollbar-width:none]"
      >
        {PRODUCT_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = active === type.id

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-full px-5 py-2 transition-all duration-300 sm:px-6',
                isActive ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-black',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform duration-300',
                  isActive ? 'scale-110' : 'group-hover:scale-110',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-widest',
                  isActive && 'font-semibold',
                )}
              >
                {type.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
