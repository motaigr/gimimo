import { Link } from 'react-router-dom'
import { CartDrawer } from './CartDrawer'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 md:h-24">
        <Link to="/" className="transition-opacity hover:opacity-80" aria-label="Gimimo — início">
          <img src="/images/logo/gimimo-header.webp" alt="Gimimo" width={88} height={48} className="h-10 w-auto md:h-12" />
        </Link>
        <div className="flex items-center gap-4">
          <CartDrawer />
        </div>
      </div>
    </header>
  )
}
