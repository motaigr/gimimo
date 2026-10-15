// =====================================================
// CATÁLOGO GIMIMO
// - Tipos de produto (pins, canecas, garrafas…) aparecem na barra inferior.
// - Cada item pertence a um tipo e a um tema (São Paulo, uma banda…).
// - As imagens ficam em /public/images/NOME-DO-TEMA/ (de preferência .webp
//   quadrado com ~400px).
// =====================================================

import type { LucideIcon } from 'lucide-react'
import { CircleDot, Coffee, Milk } from 'lucide-react'

export const WHATSAPP_NUMBER = '5511982204504' // DDI + DDD + número, sem espaços
export const EMAIL_LOJA = 'gimimoandco@gmail.com'

// URL do Google Apps Script que recebe os pedidos e preenche a planilha do
// Google Sheets (ver apps-script/Code.gs e o README). Formato:
// https://script.google.com/macros/s/XXXXXXXX/exec
export const PLANILHA_ENDPOINT = ''

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

export const THEMES: Theme[] = [{ id: 'sao-paulo', name: 'São Paulo' }]

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

export const PRODUCTS: Product[] = [
  customItem('pins', 'Pin personalizado'),
  ...SAO_PAULO_NUMBERS.map((n): Product => {
    const padded = String(n).padStart(3, '0')
    return {
      id: `SP-${padded}`,
      name: `São Paulo ${String(n).padStart(2, '0')}`,
      type: 'pins',
      theme: 'sao-paulo',
      image: `/images/sao-paulo/${padded}.webp`,
    }
  }),

  // Canecas e garrafas: por enquanto só sob encomenda (arte do cliente).
  // Para adicionar modelos prontos, siga o formato dos pins acima.
  customItem('canecas', 'Caneca personalizada'),
  customItem('garrafas', 'Garrafa personalizada'),
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
