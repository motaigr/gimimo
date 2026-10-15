import { PLANILHA_ENDPOINT, getProductType, getTheme } from '@/lib/catalog'
import type { CartItem } from '@/stores/useCartStore'
import { compressImage } from './compressImage'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

type SendOrderInput = {
  nome: string
  email: string
  telefone?: string
  entrega: string
  itens: CartItem[]
  imagens?: File[]
}

export type SendOrderResult =
  | { ok: true; pedido: string; imagensNaoEnviadas: number }
  | { ok: false }

// Folga abaixo do limite do Apps Script (~50 MB por envio)
const MAX_IMAGENS_BYTES = 20_000_000

// Envia o pedido para o Google Apps Script (apps-script/Code.gs), que
// preenche a planilha do Google Sheets — uma linha por item — e guarda as
// imagens do cliente no Google Drive. Retorna ok: false se não estiver
// configurado ou não responder, para o chamador usar o plano B.
export async function sendOrderToSheet({
  nome,
  email,
  telefone,
  entrega,
  itens,
  imagens = [],
}: SendOrderInput): Promise<SendOrderResult> {
  if (!PLANILHA_ENDPOINT) return { ok: false }

  const enviadas: { nome: string; tipo: string; conteudo: string }[] = []
  let total = 0
  let imagensNaoEnviadas = 0
  for (const original of imagens) {
    const file = await compressImage(original)
    const conteudo = await blobToBase64(file)
    if (total + conteudo.length > MAX_IMAGENS_BYTES) {
      imagensNaoEnviadas++
      continue
    }
    enviadas.push({ nome: file.name, tipo: file.type || 'image/jpeg', conteudo })
    total += conteudo.length
  }

  const body = {
    nome,
    email,
    telefone: telefone || '',
    entrega,
    imagensNaoEnviadas,
    itens: itens.map((i) => ({
      nome: i.name,
      tipo: getProductType(i.type).label,
      tema: getTheme(i.theme)?.name ?? '',
      qtd: i.qty,
      personalizado: !!i.custom,
      // endereço completo para a planilha mostrar a foto do produto
      imagem: i.image ? new URL(i.image, window.location.origin).href : '',
    })),
    imagens: enviadas,
  }

  try {
    // Sem cabeçalho Content-Type (vai como text/plain): o Apps Script não
    // responde à checagem de CORS que um envio JSON dispararia.
    const res = await fetch(PLANILHA_ENDPOINT, { method: 'POST', body: JSON.stringify(body) })
    const data = await res.json()
    if (data.ok) return { ok: true, pedido: data.pedido, imagensNaoEnviadas }
  } catch {
    /* sem conexão ou script fora do ar */
  }
  return { ok: false }
}
