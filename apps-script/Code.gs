/**
 * GIMIMO — recebe os pedidos do site e preenche esta planilha.
 *
 * Uma linha por item. As imagens do item personalizado vão para uma pasta
 * no Google Drive (uma pasta por pedido) e o link fica na planilha.
 * A cada pedido novo, chega um e-mail de aviso para a dona da planilha.
 *
 * Instalação: veja o README do projeto (seção "Pedidos no Google Sheets").
 */

// ===== CONFIGURAÇÃO =====
const ABA = 'Pedidos'
const PASTA_DRIVE = 'Gimimo — imagens dos pedidos'
const AVISAR_POR_EMAIL = true // e-mail de aviso a cada pedido novo
const STATUS = ['novo', 'orçamento enviado', 'aprovado', 'em produção', 'pronto', 'entregue', 'cancelado']

const COLUNAS = [
  'Data',
  'Pedido',
  'Cliente',
  'E-mail',
  'Telefone',
  'Entrega',
  'Foto',
  'Produto',
  'Tipo',
  'Tema',
  'Qtd',
  'Imagens do cliente',
  'Status',
  'Observações',
]
const LARGURAS = [130, 150, 160, 200, 130, 260, 70, 180, 90, 110, 50, 150, 130, 220]

// ===== RECEBE O PEDIDO =====
function doPost(e) {
  try {
    const pedido = JSON.parse(e.postData.contents)
    validar(pedido)

    // um pedido por vez, para as linhas não se misturarem
    const lock = LockService.getScriptLock()
    lock.waitLock(30000)
    try {
      const sheet = obterAba()
      const id = gerarId()
      const linkImagens = salvarImagens(id, pedido)
      const agora = new Date()

      const linhas = pedido.itens.map((item) => [
        agora,
        id,
        texto(pedido.nome),
        texto(pedido.email),
        texto(pedido.telefone),
        texto(pedido.entrega),
        formulaImagem(item.imagem),
        texto(item.nome),
        texto(item.tipo),
        texto(item.tema),
        Number(item.qtd) || 0,
        item.personalizado ? linkImagens : '',
        STATUS[0],
        texto(pedido.observacoes),
      ])

      const inicio = sheet.getLastRow() + 1
      sheet.getRange(inicio, 1, linhas.length, COLUNAS.length).setValues(linhas)
      sheet.setRowHeights(inicio, linhas.length, 48)

      if (AVISAR_POR_EMAIL) avisar(id, pedido, linkImagens)
      return json({ ok: true, pedido: id })
    } finally {
      lock.releaseLock()
    }
  } catch (err) {
    console.error(err)
    return json({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

// abrir a URL do script no navegador mostra que está no ar
function doGet() {
  return json({ ok: true, info: 'Gimimo: recebendo pedidos' })
}

// ===== EXECUTE UMA VEZ, para criar o cabeçalho e pedir as permissões =====
function configurar() {
  const sheet = obterAba()
  sheet.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]).setFontWeight('bold').setBackground('#F7F4EF')
  sheet.setFrozenRows(1)
  LARGURAS.forEach((w, i) => sheet.setColumnWidth(i + 1, w))

  const col = (nome) => COLUNAS.indexOf(nome) + 1
  sheet.getRange(2, col('Data'), sheet.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm')

  // lista de status para escolher em cada linha
  const regra = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build()
  sheet.getRange(2, col('Status'), sheet.getMaxRows() - 1, 1).setDataValidation(regra)

  pastaPrincipal() // cria a pasta no Drive
  SpreadsheetApp.getUi().alert('Pronto! Agora publique: Implantar → Nova implantação → App da Web.')
}

// ===== AUXILIARES =====

// texto vindo do cliente: nunca vira fórmula (=, +, -, @ no começo)
function texto(v) {
  const s = v == null ? '' : String(v).slice(0, 500)
  return /^[=+\-@]/.test(s) ? "'" + s : s
}

// foto do produto na planilha: só aceita endereço https do próprio site
function formulaImagem(url) {
  const u = String(url || '')
  return /^https:\/\/[^"\s]+$/.test(u) ? '=IMAGE("' + u + '")' : ''
}
function validar(p) {
  if (!p || !p.nome || !p.email || !p.entrega) throw new Error('Campos obrigatórios ausentes')
  if (!Array.isArray(p.itens) || p.itens.length === 0) throw new Error('Pedido sem itens')
  if (p.itens.length > 300) throw new Error('Pedido grande demais')
  if (p.imagens && p.imagens.length > 20) throw new Error('Imagens demais')
}

function obterAba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  return ss.getSheetByName(ABA) || ss.insertSheet(ABA)
}

function gerarId() {
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo'
  const data = Utilities.formatDate(new Date(), tz, 'yyMMdd-HHmm')
  const sufixo = Math.random().toString(36).slice(2, 5).toUpperCase()
  return 'GM-' + data + '-' + sufixo
}

function pastaPrincipal() {
  const pastas = DriveApp.getFoldersByName(PASTA_DRIVE)
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(PASTA_DRIVE)
}

// salva as imagens do cliente numa pasta do pedido e devolve o link
function salvarImagens(id, pedido) {
  const imagens = pedido.imagens || []
  if (imagens.length === 0) return ''
  const pasta = pastaPrincipal().createFolder(id + ' — ' + pedido.nome)
  imagens.forEach((img, i) => {
    const bytes = Utilities.base64Decode(img.conteudo)
    const nome = img.nome || 'imagem-' + (i + 1) + '.jpg'
    pasta.createFile(Utilities.newBlob(bytes, img.tipo || 'image/jpeg', nome))
  })
  return pasta.getUrl()
}

function avisar(id, pedido, linkImagens) {
  const total = pedido.itens.reduce((s, i) => s + (Number(i.qtd) || 0), 0)
  const itens = pedido.itens.map((i) => '• ' + i.nome + ' — ' + i.qtd + ' un.').join('\n')
  const corpo = [
    'Pedido novo pelo site: ' + id,
    '',
    'Cliente: ' + pedido.nome,
    'E-mail: ' + pedido.email,
    pedido.telefone ? 'Telefone: ' + pedido.telefone : null,
    'Entrega: ' + pedido.entrega,
    '',
    itens,
    '',
    'Total: ' + total + ' unidades',
    linkImagens ? '\nImagens do cliente: ' + linkImagens : null,
    pedido.imagensNaoEnviadas ? '\n(' + pedido.imagensNaoEnviadas + ' imagem(ns) não couberam — pedir ao cliente)' : null,
    '',
    'Planilha: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  ]
    .filter((l) => l !== null)
    .join('\n')

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    replyTo: pedido.email,
    subject: 'Pedido Gimimo ' + id + ' — ' + pedido.nome,
    body: corpo,
  })
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
