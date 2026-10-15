import { Resend } from 'resend'

// Variáveis de ambiente configuradas no painel do Netlify (Site settings →
// Environment variables), nunca expostas ao navegador do cliente:
//   RESEND_API_KEY  → chave de API criada em resend.com
//   RESEND_FROM     → remetente, ex: 'Gimimo <pedidos@seudominio.com>'
//                     (precisa ser um domínio verificado no Resend)
//   LOJA_EMAIL      → e-mail da loja que vai receber os pedidos

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }
  }

  const { nome, email, message, attachments = [] } = payload
  if (!nome || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Campos obrigatórios ausentes' }) }
  }

  if (!process.env.RESEND_API_KEY || !process.env.LOJA_EMAIL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Função não configurada (variáveis de ambiente ausentes)' }) }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Gimimo <onboarding@resend.dev>',
      to: [process.env.LOJA_EMAIL],
      replyTo: email,
      subject: `Pedido Gimimo — ${nome}`,
      text: message,
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content })),
    })

    if (error) {
      return { statusCode: 502, body: JSON.stringify({ error: error.message || 'Falha ao enviar' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Erro inesperado' }) }
  }
}
