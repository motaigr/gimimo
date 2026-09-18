import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { WHATSAPP_NUMBER, EMAIL_LOJA, FORMSPREE_ENDPOINT } from '../data/catalog'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3Esem foto%3C/text%3E%3C/svg%3E"

function formatPhone(number) {
  const country = number.slice(0, 2)
  const ddd = number.slice(2, 4)
  const rest = number.slice(4)
  return `+${country} ${ddd} ${rest.slice(0, -4)}-${rest.slice(-4)}`
}

export default function Order() {
  const { items, totalQty, clearCart, removeItem } = useCart()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [semAnexo, setSemAnexo] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [gerandoPlanilha, setGerandoPlanilha] = useState(false)
  const [imagensPersonalizadas, setImagensPersonalizadas] = useState([])
  const navigate = useNavigate()

  const hasCustomItem = items.some(i => i.custom)

  const buildMessage = () => {
    const nomeCliente = nome.trim() || 'cliente'
    const linhas = items.map(i => `• ${i.name} — ${i.qty} un.`).join('\n')
    const aviso = hasCustomItem
      ? '\n\n(o cliente pode enviar imagens de referência do item personalizado em anexo)'
      : ''
    return `Olá! Sou ${nomeCliente} e gostaria de fazer um pedido:\n\n${linhas}\n\nTotal: ${totalQty} unidades${aviso}`
  }

  const handleBaixarPlanilha = async () => {
    if (items.length === 0) return
    setError('')
    setGerandoPlanilha(true)
    try {
      const { downloadOrderExcel } = await import('../utils/orderExcel')
      await downloadOrderExcel(items, nome.trim())
    } catch {
      setError('Não foi possível gerar a planilha. Tente novamente.')
    } finally {
      setGerandoPlanilha(false)
    }
  }

  const handleEnviarPedido = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    if (!nome.trim() || !email.trim()) {
      setError('Preencha seu nome e e-mail antes de enviar o pedido.')
      return
    }
    setError('')
    setEnviando(true)

    try {
      const { buildOrderExcelBlob, downloadOrderExcel } = await import('../utils/orderExcel')
      const { blob, filename } = await buildOrderExcelBlob(items, nome.trim())

      // 1) Função serverless (Netlify + Resend): e-mail com anexo de verdade.
      // Se a função não estiver implantada/configurada ainda, ela não
      // responde no formato esperado e caímos no próximo método.
      const { sendOrderViaFunction } = await import('../utils/sendOrder')
      const enviadoPelaFuncao = await sendOrderViaFunction({
        nome: nome.trim(),
        email: email.trim(),
        message: buildMessage(),
        planilha: { blob, filename },
        imagens: imagensPersonalizadas,
      })
      if (enviadoPelaFuncao) {
        setSent(true)
        return
      }

      // 2) Formspree: envia pelo menos o texto do pedido automaticamente.
      // O plano grátis não aceita anexos, então a planilha é baixada à parte.
      if (FORMSPREE_ENDPOINT) {
        const formData = new FormData()
        formData.append('nome', nome.trim())
        formData.append('_replyto', email.trim())
        formData.append('message', buildMessage())
        formData.append('planilha', blob, filename)
        imagensPersonalizadas.forEach((file, i) => {
          formData.append(`imagem_personalizada_${i + 1}`, file, file.name)
        })

        let res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        })

        if (res.ok) {
          setSent(true)
          return
        }

        let errBody = null
        try { errBody = await res.json() } catch { /* ignora */ }
        const bloqueadoPorAnexo = errBody?.error === 'File Uploads Not Permitted'

        if (bloqueadoPorAnexo) {
          const textOnlyForm = new FormData()
          textOnlyForm.append('nome', nome.trim())
          textOnlyForm.append('_replyto', email.trim())
          textOnlyForm.append('message', buildMessage())

          res = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: textOnlyForm,
            headers: { Accept: 'application/json' },
          })

          if (res.ok) {
            await downloadOrderExcel(items, nome.trim())
            setSent(true)
            setSemAnexo(true)
            return
          }
        }

        setError('Não foi possível enviar o pedido. Tente novamente em instantes.')
        return
      }

      // 3) Último recurso: baixa a planilha e abre o e-mail pronto para o
      // cliente anexar manualmente antes de enviar.
      await downloadOrderExcel(items, nome.trim())
      const subject = encodeURIComponent(`Pedido Gimimo — ${nome.trim()}`)
      const body = encodeURIComponent(
        `${buildMessage()}\n\n(a planilha do pedido foi baixada agora — anexe-a antes de enviar)`
      )
      const win = window.open(`mailto:${EMAIL_LOJA}?subject=${subject}&body=${body}`, '_blank')
      if (win) {
        setSent(true)
      } else {
        setError('Não conseguimos abrir seu aplicativo de e-mail. A planilha já foi baixada — envie-a manualmente para ' + EMAIL_LOJA)
      }
    } catch {
      setError('Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const handleNewOrder = () => {
    clearCart()
    setSent(false)
    setSemAnexo(false)
    setImagensPersonalizadas([])
    navigate('/')
  }

  if (sent) {
    return (
      <div className="order-page">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 className="success-title">pedido enviado!</h2>
          {semAnexo ? (
            <p className="success-sub">
              a loja já recebeu os detalhes do seu pedido. a planilha foi baixada no seu
              aparelho — envie-a para {EMAIL_LOJA} para concluir.
            </p>
          ) : (
            <p className="success-sub">a loja vai confirmar seu pedido em breve.</p>
          )}
          <button className="btn-primary" onClick={handleNewOrder}>fazer novo pedido</button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-page">
      <div className="order-header">
        <Link to="/" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          voltar
        </Link>
        <h1 className="catalog-title">seu pedido</h1>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>nenhum item no pedido ainda.</p>
          <Link to="/" className="btn-primary" style={{display:'inline-block',marginTop:'12px'}}>escolher pins</Link>
        </div>
      ) : (
        <form onSubmit={handleEnviarPedido}>
          <div className="order-name-field">
            <label className="field-label">seu nome *</label>
            <input
              className="field-input"
              type="text"
              placeholder="para identificar o pedido"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="order-name-field">
            <label className="field-label">seu e-mail *</label>
            <input
              className="field-input"
              type="email"
              placeholder="para a loja te responder"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="order-items">
            {items.map(item => (
              <div key={item.id} className="order-item">
                {item.custom ? (
                  <div className="order-item-img order-item-img--custom">+</div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="order-item-img"
                    onError={e => { e.target.src = PLACEHOLDER }}
                  />
                )}
                <div className="order-item-info">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-qty">{item.qty} {item.qty === 1 ? 'unidade' : 'unidades'}</span>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                  aria-label="remover"
                >×</button>
              </div>
            ))}
          </div>

          <div className="order-total">
            <span className="order-total-label">total</span>
            <span className="order-total-val">{totalQty} {totalQty === 1 ? 'unidade' : 'unidades'}</span>
          </div>

          {hasCustomItem && (
            <div className="custom-upload">
              <label className="field-label">imagens do item personalizado</label>
              <label className="custom-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setImagensPersonalizadas(Array.from(e.target.files))}
                  hidden
                />
                {imagensPersonalizadas.length > 0
                  ? `${imagensPersonalizadas.length} imagem${imagensPersonalizadas.length > 1 ? 'ns' : ''} selecionada${imagensPersonalizadas.length > 1 ? 's' : ''}`
                  : 'escolher imagens de referência'}
              </label>
              <p className="order-hint">
                ou envie direto para {EMAIL_LOJA} ou pelo WhatsApp {formatPhone(WHATSAPP_NUMBER)}, mencionando seu nome
              </p>
            </div>
          )}

          {error && <p className="order-error">{error}</p>}

          <div className="order-actions">
            <button type="submit" className="btn-send" disabled={enviando}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,12 2,6"/>
              </svg>
              {enviando ? 'enviando pedido…' : 'enviar pedido'}
            </button>

            <button type="button" className="btn-download-link" onClick={handleBaixarPlanilha} disabled={gerandoPlanilha}>
              {gerandoPlanilha ? 'gerando planilha…' : 'baixar uma cópia da planilha'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
