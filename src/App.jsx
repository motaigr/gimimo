import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Order from './pages/Order'
import './styles/main.css'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo/:bandId" element={<Catalog />} />
          <Route path="/pedido" element={<Order />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
