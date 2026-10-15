import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const NotFound = () => (
  <div className="container mx-auto flex flex-col items-center px-6 py-24 text-center">
    <p className="mb-4 font-serif text-7xl">404</p>
    <p className="mb-8 text-sm uppercase tracking-widest text-gray-500">página não encontrada</p>
    <Button asChild className="h-12 rounded-full px-8 text-sm uppercase tracking-widest">
      <Link to="/">voltar ao catálogo</Link>
    </Button>
  </div>
)

export default NotFound
