// =====================================================
// CATÁLOGO GIMIMO
// - Tipos de produto (pins, canecas, garrafas…) aparecem na barra inferior.
// - Cada item pertence a um tipo e a um tema (São Paulo, uma banda…).
// - Os produtos vêm da pasta "Catálogo Gimimo" no Google Drive: a cada
//   publicação, scripts/sync-catalog.mjs gera catalog.generated.json.
//   Enquanto um tipo não tiver fotos no Drive, vale o catálogo fixo abaixo.
// =====================================================

import type { LucideIcon } from 'lucide-react'
import { CircleDot, Coffee, Milk } from 'lucide-react'
import config from './config.json'

export const WHATSAPP_NUMBER = '5511982204504' // DDI + DDD + número, sem espaços
export const EMAIL_LOJA = 'gimimoandco@gmail.com'

// URL do Google Apps Script (planilha de pedidos + catálogo do Drive).
// Fica em src/lib/config.json → "planilhaEndpoint". Formato:
// https://script.google.com/macros/s/XXXXXXXX/exec
export const PLANILHA_ENDPOINT: string = config.planilhaEndpoint

// Plano B, se a planilha não responder: o Formspree (formspree.io) manda o
// texto do pedido por e-mail para a loja.
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/myezyqgn'

export type ProductTypeId = 'pins' | 'canecas' | 'garrafas'

export type ProductType = {
  id: ProductTypeId
  label: string // nome curto, na barra inferior
  title: string // título grande da página
  subtitle: string
  icon: LucideIcon
}

export type Theme = {
  id: string
  name: string
}

export type Product = {
  id: string
  name: string
  type: ProductTypeId
  theme: string | null // null = item personalizado, aparece em todos os temas
  image: string | null
  custom?: boolean // cliente envia a arte dele no pedido
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'pins',
    label: 'Pins',
    title: 'bottons',
    subtitle: 'escolha um tema ou crie o seu',
    icon: CircleDot,
  },
  {
    id: 'canecas',
    label: 'Canecas',
    title: 'canecas',
    subtitle: 'personalizadas com a sua arte',
    icon: Coffee,
  },
  {
    id: 'garrafas',
    label: 'Garrafas',
    title: 'garrafas',
    subtitle: 'personalizadas com a sua arte',
    icon: Milk,
  },
]

// ----- catálogo do Google Drive (gerado na publicação; pode não existir) -----
type GeneratedProduct = Omit<Product, 'theme'> & { theme: string; themeName: string }
const generated: GeneratedProduct[] =
  Object.values(import.meta.glob<GeneratedProduct[]>('./catalog.generated.json', { eager: true, import: 'default' }))[0] ?? []
const typesFromDrive = new Set(generated.map((p) => p.type))

// ----- catálogo fixo (usado enquanto o tipo não tiver fotos no Drive) -----
// Números disponíveis na coleção São Paulo (o 79 não existe)
const SAO_PAULO_NUMBERS = Array.from({ length: 117 }, (_, i) => i + 1).filter((n) => n !== 79)

const customItem = (type: ProductTypeId, name: string): Product => ({
  id: `${type}-custom`,
  name,
  type,
  theme: null,
  image: null,
  custom: true,
})

const STATIC_PRODUCTS: Product[] = SAO_PAULO_NUMBERS.map((n) => {
  const padded = String(n).padStart(3, '0')
  return {
    id: `SP-${padded}`,
    name: `São Paulo ${String(n).padStart(2, '0')}`,
    type: 'pins',
    theme: 'sao-paulo',
    image: `/images/sao-paulo/${padded}.webp`,
  }
})
const STATIC_THEMES: Theme[] = [{ id: 'sao-paulo', name: 'São Paulo' }]

// Para cada tipo: fotos do Drive, se houver; senão, o catálogo fixo.
const catalogProducts: Product[] = [
  ...STATIC_PRODUCTS.filter((p) => !typesFromDrive.has(p.type)),
  ...generated.map(({ themeName: _, ...p }) => p),
]

export const THEMES: Theme[] = [
  ...STATIC_THEMES.filter((t) => catalogProducts.some((p) => p.theme === t.id)),
  ...[...new Map(generated.map((p) => [p.theme, { id: p.theme, name: p.themeName }])).values()].filter(
    (t) => !STATIC_THEMES.some((s) => s.id === t.id),
  ),
]

// O item personalizado ("+") de cada tipo fica sempre fixo, no começo.
export const PRODUCTS: Product[] = [
  customItem('pins', 'Pin personalizado'),
  customItem('canecas', 'Caneca personalizada'),
  customItem('garrafas', 'Garrafa personalizada'),
  ...catalogProducts,
]

export const getProductType = (id: string | null) =>
  PRODUCT_TYPES.find((t) => t.id === id) ?? PRODUCT_TYPES[0]

export const getTheme = (id: string | null) => THEMES.find((t) => t.id === id)

export function formatPhone(number: string) {
  const country = number.slice(0, 2)
  const ddd = number.slice(2, 4)
  const rest = number.slice(4)
  return `+${country} ${ddd} ${rest.slice(0, -4)}-${rest.slice(-4)}`
}

export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`
