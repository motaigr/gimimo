import { Outlet } from 'react-router-dom'
import { Mail, MessageCircle } from 'lucide-react'
import { EMAIL_LOJA, formatPhone, WHATSAPP_NUMBER, whatsappLink } from '@/lib/catalog'
import { Header } from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-black selection:bg-brand-coral/30 selection:text-black">
      <Header />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-cream/60 pb-32 pt-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-6 text-center">
          <p className="font-serif text-xl">Gimimo</p>
          <p className="max-w-sm text-xs leading-relaxed text-gray-500">
            Pins, bottons e produtos personalizados feitos à mão. Monte seu pedido e receba o
            orçamento por e-mail ou WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-black">
              <MessageCircle className="h-3.5 w-3.5" /> {formatPhone(WHATSAPP_NUMBER)}
            </a>
            <a href={`mailto:${EMAIL_LOJA}`} className="inline-flex items-center gap-1.5 hover:text-black">
              <Mail className="h-3.5 w-3.5" /> {EMAIL_LOJA}
            </a>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            © {new Date().getFullYear()} Gimimo
          </p>
        </div>
      </footer>
    </div>
  )
}
