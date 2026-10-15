import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Download, ImagePlus, Mail, MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductImage } from '@/components/ProductImage'
import { QtyControl } from '@/components/QtyControl'
import {
  EMAIL_LOJA,
  FORMSPREE_ENDPOINT,
  WHATSAPP_NUMBER,
  formatPhone,
  whatsappLink,
} from '@/lib/catalog'
import useCartStore from '@/stores/useCartStore'

type Sent = null | {
  // o que não foi junto automaticamente e o cliente precisa mandar à parte
  planilhaBaixada: boolean
  imagensPendentes: boolean
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function Order() {
  const { cart, totalItems, hasCustomItem, setQty, removeItem, clear } = useCartStore()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [imagens, setImagens] = useState<File[]>([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [gerandoPlanilha, setGerandoPlanilha] = useState(false)
  const [sent, setSent] = useState<Sent>(null)
  const navigate = useNavigate()

  const buildMessage = (cliente: string) => {
    const linhas = cart.map((i) => `• ${i.name} — ${i.qty} un.`).join('\n')
    const aviso = hasCustomItem
      ? '\n\n(pedido com item personalizado — imagens de referência em anexo ou enviadas à parte)'
      : ''
    return `Olá! Sou ${cliente} e gostaria de um orçamento:\n\n${linhas}\n\nTotal: ${totalItems} unidades${aviso}`
  }

  const baixarPlanilha = async () => {
    setError('')
    setGerandoPlanilha(true)
    try {
      const { downloadOrderExcel } = await import('@/utils/orderExcel')
      await downloadOrderExcel(cart, nome.trim())
    } catch {
      setError('Não foi possível gerar a planilha. Tente novamente.')
    } finally {
      setGerandoPlanilha(false)
    }
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const cliente = nome.trim()
    const replyTo = email.trim()
    if (!cliente || !replyTo) {
      setError('Preencha seu nome e e-mail antes de enviar o pedido.')
      return
    }
    setError('')
    setEnviando(true)

    try {
      const { buildOrderExcelBlob } = await import('@/utils/orderExcel')
      const planilha = await buildOrderExcelBlob(cart, cliente)
      const message = buildMessage(cliente)

      const salvarPlanilha = () => {
        const url = URL.createObjectURL(planilha.blob)
        const a = Object.assign(document.createElement('a'), { href: url, download: planilha.filename })
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }

      // 1) Função serverless (Netlify + Resend): e-mail com planilha e imagens anexadas.
      const { sendOrderViaFunction } = await import('@/utils/sendOrder')
      if (await sendOrderViaFunction({ nome: cliente, email: replyTo, message, planilha, imagens })) {
        setSent({ planilhaBaixada: false, imagensPendentes: false })
        return
      }

      // 2) Formspree: o plano grátis não aceita anexos, então envia o texto
      // e baixa a planilha no aparelho do cliente.
      if (FORMSPREE_ENDPOINT) {
        const form = new FormData()
        form.append('nome', cliente)
        form.append('_replyto', replyTo)
        form.append('message', message)
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: form,
          headers: { Accept: 'application/json' },
        })
        if (res.ok) {
          salvarPlanilha()
          setSent({ planilhaBaixada: true, imagensPendentes: hasCustomItem })
          return
        }
      }

      // 3) Último recurso: baixa a planilha e abre o e-mail pronto.
      salvarPlanilha()
      const subject = encodeURIComponent(`Pedido Gimimo — ${cliente}`)
      const body = encodeURIComponent(`${message}\n\n(anexe a planilha que foi baixada)`)
      window.location.href = `mailto:${EMAIL_LOJA}?subject=${subject}&body=${body}`
      setSent({ planilhaBaixada: true, imagensPendentes: hasCustomItem })
    } catch {
      setError('Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const novoPedido = () => {
    clear()
    navigate('/')
  }

  if (sent) {
    const pendente = sent.planilhaBaixada || sent.imagensPendentes
    return (
      <div className="container mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center animate-fade-in-up">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-sage/30">
          <Check className="h-9 w-9 text-brand-sage-dark" />
        </div>
        <h1 className="mb-4 font-serif text-4xl">pedido enviado!</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          A Gimimo já recebeu seu pedido e responde com o orçamento no e-mail {email.trim()}.
        </p>

        {pendente && (
          <div className="mb-8 w-full space-y-3 rounded-2xl bg-cream p-6 text-left text-sm">
            <p className="font-medium">Para concluir, envie para a loja:</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-600">
              {sent.planilhaBaixada && <li>a planilha do pedido (já baixada no seu aparelho)</li>}
              {sent.imagensPendentes && <li>as imagens do item personalizado</li>}
            </ul>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs">
              <a href={`mailto:${EMAIL_LOJA}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                <Mail className="h-3.5 w-3.5" /> {EMAIL_LOJA}
              </a>
              <a
                href={whatsappLink(`Olá! Sou ${nome.trim()}, acabei de enviar um pedido pelo site.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        )}

        <Button onClick={novoPedido} className="h-12 rounded-full px-10 text-sm uppercase tracking-widest">
          fazer novo pedido
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-10 md:py-16">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" /> continuar escolhendo
      </Link>

      <h1 className="mb-2 font-serif text-4xl md:text-5xl">seu pedido</h1>
      <p className="mb-10 text-xs uppercase tracking-[0.2em] text-gray-500">
        pedido para orçamento · a gimimo responde com valores e prazo
      </p>

      {cart.length === 0 ? (
        <div className="space-y-6 rounded-3xl bg-cream px-6 py-16 text-center">
          <p className="text-sm text-gray-500">Nenhum item no pedido ainda.</p>
          <Button asChild className="h-12 rounded-full px-8 text-sm uppercase tracking-widest">
            <Link to="/">ver catálogo</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-10">
          <section className="divide-y divide-gray-100 rounded-3xl border border-gray-100 px-5">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <ProductImage product={item} className="h-14 w-14 shrink-0 shadow-md" iconClassName="h-5 w-5" />
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <QtyControl value={item.qty} onChange={(q) => setQty(item.id, q)} label={item.name} />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label={`remover ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between py-5 font-serif text-lg">
              <span>Total</span>
              <span>{plural(totalItems, 'unidade', 'unidades')}</span>
            </div>
          </section>

          {hasCustomItem && (
            <section className="space-y-3 rounded-3xl bg-cream p-6">
              <Label className="text-xs uppercase tracking-widest">imagens do item personalizado</Label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-600 transition-colors hover:border-black hover:text-black">
                <ImagePlus className="h-5 w-5" />
                {imagens.length > 0
                  ? `${plural(imagens.length, 'imagem selecionada', 'imagens selecionadas')}`
                  : 'escolher imagens de referência'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => setImagens(Array.from(e.target.files ?? []))}
                />
              </label>
              <p className="text-xs text-gray-500">
                Ou envie depois para {EMAIL_LOJA} ou pelo WhatsApp {formatPhone(WHATSAPP_NUMBER)},
                mencionando seu nome.
              </p>
            </section>
          )}

          <section className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs uppercase tracking-widest">seu nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="para identificar o pedido"
                autoComplete="name"
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest">seu e-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="para receber o orçamento"
                autoComplete="email"
                required
                className="h-12 rounded-xl"
              />
            </div>
          </section>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col items-center gap-4">
            <Button
              type="submit"
              disabled={enviando}
              className="h-14 w-full rounded-full text-sm font-medium uppercase tracking-widest"
            >
              <Mail className="mr-2 h-4 w-4" />
              {enviando ? 'enviando pedido…' : 'enviar pedido'}
            </Button>
            <button
              type="button"
              onClick={baixarPlanilha}
              disabled={gerandoPlanilha}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 underline-offset-4 hover:text-black hover:underline disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {gerandoPlanilha ? 'gerando planilha…' : 'baixar uma cópia da planilha'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
