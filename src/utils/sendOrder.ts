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
  endereco?: string
  message: string
  planilha: { blob: Blob; filename: string }
  imagens?: File[]
}

export type SendOrderResult =
  | { ok: true; imagensNaoEnviadas: number } // imagens que não couberam no envio
  | { ok: false }

// Limite da Vercel é ~4,5 MB por requisição; deixa folga para o JSON.
const MAX_PAYLOAD = 4_000_000

// Envia o pedido pela função serverless (Vercel + Resend, em api/send-order.js),
// com a planilha e as imagens do cliente anexadas. Retorna ok: false se a
// função não está disponível/configurada, para o chamador usar o plano B.
export async function sendOrderViaFunction({
  nome,
  email,
  telefone,
  endereco,
  message,
  planilha,
  imagens = [],
}: SendOrderInput): Promise<SendOrderResult> {
  const attachments = [{ filename: planilha.filename, content: await blobToBase64(planilha.blob) }]
  let size = attachments[0].content.length + message.length
  let imagensNaoEnviadas = 0

  for (const original of imagens) {
    // tamanho normal; se não couber, uma versão menor; se nem assim, fica de fora
    let file = await compressImage(original)
    let content = await blobToBase64(file)
    if (size + content.length > MAX_PAYLOAD) {
      file = await compressImage(original, 1000, 0.7)
      content = await blobToBase64(file)
    }
    if (size + content.length > MAX_PAYLOAD) {
      imagensNaoEnviadas++
      continue
    }
    attachments.push({ filename: file.name, content })
    size += content.length
  }

  const aviso = imagensNaoEnviadas
    ? `\n\n(${imagensNaoEnviadas} imagem(ns) do cliente não couberam no envio — pedir por WhatsApp)`
    : ''

  let res: Response
  try {
    res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, telefone, endereco, message: message + aviso, attachments }),
    })
  } catch {
    return { ok: false } // sem conexão com a função
  }

  try {
    const data = await res.json()
    if (res.ok && data.ok) return { ok: true, imagensNaoEnviadas }
  } catch {
    /* resposta não é da nossa função (ex: rodando local com `npm run dev`) */
  }
  return { ok: false }
}
