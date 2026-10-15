import { ReactNode, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { ProductCard } from '@/components/ProductCard'
import { QuickViewModal } from '@/components/QuickViewModal'
import { BottonArt } from '@/components/showcase/BottonArt'
import { CanecaArt } from '@/components/showcase/CanecaArt'
import { GarrafaArt } from '@/components/showcase/GarrafaArt'
import { TiltStage } from '@/components/showcase/TiltStage'
import { PRODUCTS, Product, ProductTypeId, THEMES, getProductType, whatsappLink } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import useCartStore from '@/stores/useCartStore'

// Ilustração de cada tipo de produto, entre o título e a lista
const SHOWCASE: Record<ProductTypeId, { art: ReactNode; width: string; label: string; caption: string }> = {
  pins: {
    art: <BottonArt />,
    width: 'max-w-[340px] md:max-w-[440px]',
    label: 'Ilustração de um botton com a sua arte',
    caption: 'a gente transforma em botton.',
  },
  canecas: {
    art: <CanecaArt />,
    width: 'max-w-[300px] md:max-w-[380px]',
    label: 'Ilustração de uma caneca com a sua arte',
    caption: 'a gente estampa na caneca.',
  },
  garrafas: {
    art: <GarrafaArt />,
    width: 'max-w-[190px] md:max-w-[230px]',
    label: 'Ilustração de uma garrafa com a sua arte',
    caption: 'a gente estampa na garrafa.',
  },
}

export default function Index() {
  const [params, setParams] = useSearchParams()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { getQty } = useCartStore()

  const type = getProductType(params.get('tipo'))
  const ofType = useMemo(() => PRODUCTS.filter((p) => p.type === type.id), [type.id])

  // temas que têm produtos deste tipo; os chips só aparecem se houver mais de um
  const themes = THEMES.filter((t) => ofType.some((p) => p.theme === t.id))
  const themeId = themes.some((t) => t.id === params.get('tema')) ? params.get('tema') : null

  const products = themeId
    ? ofType.filter((p) => p.theme === themeId || p.custom)
    : ofType
  const onlyCustom = ofType.every((p) => p.custom)
  const showcase = SHOWCASE[type.id]

  const selectType = (id: ProductTypeId) => {
    setParams(id === 'pins' ? {} : { tipo: id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectTheme = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('tema', id)
    else next.delete('tema')
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="container mx-auto flex flex-col items-center px-6 pb-24 pt-10 md:pt-20">
        <section className="mb-12 text-center animate-fade-in-down md:mb-20" key={type.id}>
          <h1 className="mb-5 font-serif text-5xl leading-none tracking-tight md:text-[5.5rem]">
            {type.title}
          </h1>
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-gray-500 md:text-xs">
            {type.subtitle}
          </p>
        </section>

        <section className="-mt-4 mb-16 w-full animate-fade-in md:-mt-8 md:mb-24" key={`art-${type.id}`}>
          <TiltStage label={showcase.label} className={showcase.width}>
            {showcase.art}
          </TiltStage>
          <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
            {onlyCustom ? 'Envie a sua arte' : 'Escolha um dos nossos temas ou envie a sua arte'} —{' '}
            <span className="text-black">{showcase.caption}</span>
          </p>
        </section>

        {themes.length > 1 && (
          <div className="-mt-4 mb-12 flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:mb-16">
            {[{ id: null, name: 'Todos' }, ...themes].map((t) => (
              <button
                key={t.id ?? 'todos'}
                onClick={() => selectTheme(t.id)}
                className={cn(
                  'shrink-0 rounded-full border px-5 py-2 text-[10px] font-medium uppercase tracking-widest transition-colors',
                  themeId === t.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-500 hover:border-black hover:text-black',
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <section className="mx-auto w-full max-w-6xl">
          <div
            className={cn(
              'grid items-start gap-x-6 gap-y-10 md:gap-x-12 md:gap-y-14',
              onlyCustom
                ? 'mx-auto max-w-[220px] grid-cols-1'
                : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
            )}
            key={`${type.id}-${themeId}`} // refaz a animação ao trocar de filtro
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={getQty(product.id)}
                index={index}
                onClick={setSelectedProduct}
              />
            ))}
          </div>

          {onlyCustom && (
            <div className="mx-auto mt-14 max-w-md space-y-4 text-center animate-fade-in">
              <p className="text-sm leading-relaxed text-gray-500">
                Em breve teremos modelos prontos de {type.label.toLowerCase()}. Por enquanto,
                faça a sua com a arte que quiser: adicione ao pedido e envie as imagens no final.
              </p>
              <a
                href={whatsappLink(`Olá! Quero um orçamento de ${type.label.toLowerCase()} personalizadas.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-600 underline-offset-4 hover:text-black hover:underline"
              >
                <MessageCircle className="h-4 w-4" /> tirar dúvidas no WhatsApp
              </a>
            </div>
          )}
        </section>
      </div>

      <BottomNav active={type.id} onSelect={selectType} />

      <QuickViewModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
