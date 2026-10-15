import { Resend } from 'resend'

// Função serverless da Vercel: envia o pedido por e-mail com a planilha e as
// imagens anexadas. Variáveis de ambiente (Vercel → Project → Settings →
// Environment Variables), nunca expostas ao navegador do cliente:
//   RESEND_API_KEY  → chave de API criada em resend.com
//   RESEND_FROM     → remetente, ex: 'Gimimo <pedidos@seudominio.com>'
//                     (precisa ser um domínio verificado no Resend)
//   LOJA_EMAIL      → e-mail da loja que vai receber os pedidos
//
// Se não estiver configurada, responde com erro e o site cai no Formspree.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { nome, email, message, attachments = [] } = req.body || {}
  if (!nome || !email || !message) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
  }

  if (!process.env.RESEND_API_KEY || !process.env.LOJA_EMAIL) {
    return res.status(500).json({ error: 'Função não configurada (variáveis de ambiente ausentes)' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Gimimo <onboarding@resend.dev>',
      to: [process.env.LOJA_EMAIL],
      replyTo: email,
      subject: `Pedido Gimimo — ${nome}`,
      text: `${message}\n\n—\nCliente: ${nome}\nE-mail: ${email}`,
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
    })

    if (error) {
      return res.status(502).json({ error: error.message || 'Falha ao enviar' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro inesperado' })
  }
}
