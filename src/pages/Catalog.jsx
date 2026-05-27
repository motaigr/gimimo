import { useParams, Link } from 'react-router-dom'
import { bands } from '../data/catalog'
import { useCart } from '../hooks/useCart'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3Esem foto%3C/text%3E%3C/svg%3E"

export default function Catalog() {
  const { bandId } = useParams()
  const band = bands.find(b => b.id === bandId)
  const { setQty, getQty, totalQty } = useCart()

  if (!band) return (
    <div className="not-found">
      <p>Banda não encontrada.</p>
      <Link to="/">← voltar</Link>
    </div>
  )

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <Link to="/" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          voltar
        </Link>
        <div>
          <h1 className="catalog-title">{band.name}</h1>
          <p className="catalog-sub">toque em + para adicionar ao pedido</p>
        </div>
      </div>

      <div className="pins-grid">
        {band.pins.map(pin => {
          const qty = getQty(pin.id)
          return (
            <div key={pin.id} className={`pin-card ${qty > 0 ? 'pin-card--selected' : ''}`}>
              <div className="pin-img-wrap">
                <img
                  src={pin.image}
                  alt={pin.name}
                  className="pin-img"
                  onError={e => { e.target.src = PLACEHOLDER }}
                />
                {qty > 0 && (
                  <div className="pin-qty-badge">{qty}</div>
                )}
              </div>
              <div className="pin-footer">
                <span className="pin-name">{pin.name}</span>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => setQty(pin, qty - 1)}
                    aria-label="diminuir"
                    disabled={qty === 0}
                  >−</button>
                  <span className="qty-val">{qty}</span>
                  <button
                    className="qty-btn qty-btn--add"
                    onClick={() => setQty(pin, qty + 1)}
                    aria-label="adicionar"
                  >+</button>
                </div>
              </div>
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
