import { Link } from 'react-router-dom'
import { bands } from '../data/catalog'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' rx='60' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='40'%3E%3F%3C/text%3E%3C/svg%3E"

export default function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">Bottons</h1>
        <p className="home-sub">escolha uma banda ou tema</p>
      </div>

      <div className="bands-pin-grid">
        {bands.map(band => (
          <Link
            key={band.id}
            to={`/catalogo/${band.id}`}
            className="band-pin-card"
          >
            <div className="band-pin-wrap">
              <img
                src={band.pins[0]?.image || PLACEHOLDER}
                alt={band.name}
                className="band-pin-img"
                onError={e => { e.target.src = PLACEHOLDER }}
              />
              <div className="band-pin-shine" />
            </div>
            <span className="band-pin-name">{band.name}</span>
            <span className="band-pin-count">{band.pins.length} modelos</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
