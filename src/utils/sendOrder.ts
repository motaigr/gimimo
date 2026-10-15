function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Tenta enviar o pedido pela função serverless (Vercel + Resend, em
// api/send-order.js), que manda
// o e-mail com anexos de verdade. Retorna true se enviou com sucesso, false
// se a função não está disponível/configurada (para o chamador cair no
// próximo método de envio).
type SendOrderInput = {
  nome: string
  email: string
  message: string
  planilha?: { blob: Blob; filename: string }
  imagens?: File[]
}

export async function sendOrderViaFunction({ nome, email, message, planilha, imagens = [] }: SendOrderInput) {
  const attachments = []

  if (planilha) {
    attachments.push({
      filename: planilha.filename,
      content: await blobToBase64(planilha.blob),
    })
  }

  for (const file of imagens) {
    attachments.push({
      filename: file.name,
      content: await blobToBase64(file),
    })
  }

  let res
  try {
    res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, message, attachments }),
    })
  } catch {
    return false // sem conexão com a função
  }

  let data
  try {
    data = await res.json()
  } catch {
    return false // resposta não é da nossa função (ex: rodando local com `npm run dev`)
  }

  if (res.ok && data.ok) return true
  return false
}
