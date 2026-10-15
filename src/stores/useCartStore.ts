import { useSyncExternalStore } from 'react'
import { PRODUCTS, Product } from '@/lib/catalog'

export type CartItem = Product & { qty: number }

const STORAGE_KEY = 'gimimo-cart'
const productsById = new Map(PRODUCTS.map((p) => [p.id, p]))

// Guarda só { id: quantidade }; nome/imagem vêm sempre do catálogo atual,
// então o carrinho salvo nunca fica desatualizado.
type Quantities = Record<string, number>

function load(): Quantities {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const clean: Quantities = {}
    for (const [id, qty] of Object.entries(saved)) {
      if (productsById.has(id) && typeof qty === 'number' && qty > 0) clean[id] = qty
    }
    return clean
  } catch {
    return {}
  }
}

let quantities = load()
let items = toItems(quantities)
const listeners = new Set<() => void>()

function toItems(q: Quantities): CartItem[] {
  return Object.entries(q).map(([id, qty]) => ({ ...productsById.get(id)!, qty }))
}

function commit(next: Quantities) {
  quantities = next
  items = toItems(next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* navegação privada / armazenamento cheio: segue só em memória */
  }
  listeners.forEach((l) => l())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const actions = {
  setQty: (id: string, qty: number) => {
    const n = Math.max(0, Math.floor(qty) || 0)
    const next = { ...quantities }
    if (n === 0) delete next[id]
    else next[id] = n
    commit(next)
  },
  getQty: (id: string) => quantities[id] || 0,
  removeItem: (id: string) => actions.setQty(id, 0),
  clear: () => commit({}),
}

export default function useCartStore() {
  const cart = useSyncExternalStore(subscribe, () => items)
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)
  return { cart, totalItems, hasCustomItem: cart.some((i) => i.custom), ...actions }
}
