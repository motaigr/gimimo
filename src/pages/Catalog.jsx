import { useParams, Link } from 'react-router-dom'
import { bands } from '../data/catalog'
import PinsGrid from '../components/PinsGrid'

export default function Catalog() {
  const { bandId } = useParams()
  const band = bands.find(b => b.id === bandId)

  if (!band) return (
    <div className="not-found">
      <p>Banda não encontrada.</p>
      <Link to="/">← voltar</Link>
    </div>
  )

  return <PinsGrid band={band} showBack />
}
