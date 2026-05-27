import { Link } from 'react-router-dom'
import { bands } from '../data/catalog'

export default function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <p className="home-sub">escolha uma banda ou tema</p>
      </div>

      <div className="bands-grid">
        {bands.map(band => (
          <Link
            key={band.id}
            to={`/catalogo/${band.id}`}
            className="band-card"
            style={{ '--band-color': band.color }}
          >
            <div className="band-emoji">{band.emoji}</div>
            <div className="band-info">
              <span className="band-name">{band.name}</span>
              <span className="band-count">{band.pins.length} modelos</span>
            </div>
            <svg className="band-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
