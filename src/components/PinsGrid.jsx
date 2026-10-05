import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3Esem foto%3C/text%3E%3C/svg%3E"

export default function PinsGrid({ band, showBack = false }) {
  const { setQty, getQty, totalQty } = useCart()
  const [openPinId, setOpenPinId] = useState(null)

  const changeQty = (pin, value) => {
    const n = Math.max(0, Math.floor(Number(value)) || 0)
    setQty(pin, n)
  }

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        {showBack && (
          <Link to="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            voltar
          </Link>
        )}
        <div>
          <h1 className="catalog-title">{band.name}</h1>
          <p className="catalog-sub">toque na imagem para adicionar ao pedido</p>
        </div>
      </div>

      <div className="pins-grid">
        {band.pins.map(pin => {
          const qty = getQty(pin.id)
          const isOpen = openPinId === pin.id
          return (
            <div key={pin.id} className={`pin-card ${qty > 0 ? 'pin-card--selected' : ''}`}>
              <div
                className={`pin-wrap ${pin.custom ? 'pin-wrap--custom' : ''}`}
                onClick={() => setOpenPinId(isOpen ? null : pin.id)}
              >
                {pin.custom ? (
                  <span className="pin-custom-plus">+</span>
                ) : (
                  <img
                    src={pin.image}
                    alt={pin.name}
                    className="pin-img"
                    width="400"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    onError={e => { e.target.src = PLACEHOLDER }}
                  />
                )}
                <div className="pin-shine" />
              </div>
              {isOpen && (
                <div className="pin-details">
                  <span className="pin-name">{pin.name}</span>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => setQty(pin, qty - 1)}
                      aria-label="diminuir"
                      disabled={qty === 0}
                    >−</button>
                    <input
                      className="qty-input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={qty}
                      onChange={e => changeQty(pin, e.target.value)}
                      onFocus={e => e.target.select()}
                      aria-label={`quantidade de ${pin.name}`}
                    />
                    <button
                      className="qty-btn qty-btn--add"
                      onClick={() => setQty(pin, qty + 1)}
                      aria-label="adicionar"
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalQty > 0 && (
        <div className="sticky-bar">
          <span>{totalQty} {totalQty === 1 ? 'item' : 'itens'} no pedido</span>
          <Link to="/pedido" className="sticky-btn">ver pedido →</Link>
        </div>
      )}
    </div>
  )
}
