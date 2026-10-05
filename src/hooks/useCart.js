import { createContext, createElement, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'gimimo-cart'

// Carrinho compartilhado: um único estado para o app inteiro (Header,
// catálogo e pedido), para o contador do cabeçalho atualizar na hora.
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch { /* navegação privada / armazenamento cheio: segue só em memória */ }
  }, [cart])

  const setQty = (pin, qty) => {
    setCart(prev => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[pin.id]
        return next
      }
      return { ...prev, [pin.id]: { ...pin, qty } }
    })
  }

  const getQty = (pinId) => cart[pinId]?.qty || 0

  const removeItem = (pinId) => {
    setCart(prev => {
      const next = { ...prev }
      delete next[pinId]
      return next
    })
  }

  const clearCart = () => setCart({})

  const items = Object.values(cart)
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0)

  const value = { cart, items, totalQty, setQty, getQty, removeItem, clearCart }
  return createElement(CartContext.Provider, { value }, children)
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
