import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

export default function Header() {
  const { totalQty } = useCart()

  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-icon"><img src="/images/logo/gimimo.png" alt="logo gimimo" /></span>
        <span className="logo-text">Gimimo</span>
      </Link>
      <Link to="/pedido" className="cart-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {totalQty > 0 && (
          <span className="cart-count">{totalQty}</span>
        )}
      </Link>
    </header>
  )
}
