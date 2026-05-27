import { useState, useEffect } from 'react'

export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gimimo-cart')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem('gimimo-cart', JSON.stringify(cart))
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

  return { cart, items, totalQty, setQty, getQty, removeItem, clearCart }
}
