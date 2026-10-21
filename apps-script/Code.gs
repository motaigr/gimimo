/**
 * GIMIMO — pedidos e catálogo do site.
 *
 * PEDIDOS: recebe os pedidos do site e preenche esta planilha, uma linha por
 * item. As imagens do item personalizado vão para uma pasta no Google Drive
 * (uma pasta por pedido) e o link fica na planilha. A cada pedido novo, chega
 * um e-mail de aviso para a dona da planilha.
 *
 * CATÁLOGO: os produtos do site vêm da pasta "Catálogo Gimimo" no Drive
 * (Catálogo Gimimo / Bottons / São Paulo / foto.jpg). Depois de adicionar
 * fotos, use o menu Gimimo → Publicar site.
 *
 * Instalação: veja o README do projeto (seção "Pedidos no Google Sheets").
 */

// ===== CONFIGURAÇÃO =====
const ABA = 'Pedidos'
const PASTA_DRIVE = 'Gimimo — imagens dos pedidos'
const PASTA_CATALOGO = 'Catálogo Gimimo'
// pastas de primeiro nível do catálogo → tipo de produto no site
const TIPOS_CATALOGO = { Bottons: 'pins', Canecas: 'canecas', Garrafas: 'garrafas' }
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

// GET: catálogo do site (usado na publicação) ou teste se está no ar
function doGet(e) {
  try {
    const acao = e && e.parameter ? e.parameter.acao : ''
    if (acao === 'catalogo') return json({ ok: true, itens: lerCatalogo() })
    if (acao === 'imagens') return json({ ok: true, imagens: lerImagens(String(e.parameter.ids || '')) })
    return json({ ok: true, info: 'Gimimo: recebendo pedidos' })
  } catch (err) {
    console.error(err)
    return json({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

// ===== CATÁLOGO (pasta no Drive) =====

// Lista as fotos: Catálogo Gimimo / <Tipo> / <Tema> / <foto>. Arquivos ou
// pastas que começam com "_" ficam ocultos (para tirar do site sem apagar).
function lerCatalogo() {
  const raiz = pastaCatalogo()
  const itens = []
  const tipos = raiz.getFolders()
  while (tipos.hasNext()) {
    const pastaTipo = tipos.next()
    const tipo = TIPOS_CATALOGO[pastaTipo.getName().trim()]
    if (!tipo) continue
    const temas = pastaTipo.getFolders()
    while (temas.hasNext()) {
      const pastaTema = temas.next()
      const tema = pastaTema.getName().trim()
      if (oculto(tema)) continue
      const arquivos = pastaTema.getFiles()
      while (arquivos.hasNext()) {
        const f = arquivos.next()
        if (oculto(f.getName()) || f.getMimeType().indexOf('image/') !== 0) continue
        itens.push({
          id: f.getId(),
          nome: f.getName().replace(/\.[^.]+$/, '').trim(),
          tipo: tipo,
          tema: tema,
          mime: f.getMimeType(),
          atualizado: f.getLastUpdated().getTime(),
        })
      }
    }
  }
  CacheService.getScriptCache().put('catalogo-ids', JSON.stringify(itens.map((i) => i.id)), 600)
  return itens
}

// Devolve as fotos pedidas (em base64). Só entrega arquivos que estão no
// catálogo — nunca qualquer outro arquivo do Drive.
function lerImagens(idsTexto) {
  const pedidos = idsTexto.split(',').filter(Boolean).slice(0, 5)
  const cache = CacheService.getScriptCache().get('catalogo-ids')
  const permitidos = cache ? JSON.parse(cache) : lerCatalogo().map((i) => i.id)
  return pedidos
    .filter((id) => permitidos.indexOf(id) !== -1)
    .map((id) => {
      const blob = DriveApp.getFileById(id).getBlob()
      return { id: id, mime: blob.getContentType(), conteudo: Utilities.base64Encode(blob.getBytes()) }
    })
}

function oculto(nome) {
  return /^[_.]/.test(nome)
}

function pastaCatalogo() {
  const pastas = DriveApp.getFoldersByName(PASTA_CATALOGO)
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(PASTA_CATALOGO)
}

// ===== MENU "Gimimo" NA PLANILHA =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Gimimo')
    .addItem('Publicar site (atualizar catálogo)', 'publicarSite')
    .addItem('Abrir pasta do catálogo', 'abrirCatalogo')
    .addSeparator()
    .addItem('Configurar publicação…', 'configurarPublicacao')
    .addToUi()
}

function publicarSite() {
  const ui = SpreadsheetApp.getUi()
  const hook = PropertiesService.getScriptProperties().getProperty('VERCEL_DEPLOY_HOOK')
  if (!hook) {
    ui.alert('Falta configurar a publicação: menu Gimimo → Configurar publicação…')
    return
  }
  const itens = lerCatalogo()
  const temas = {}
  itens.forEach((i) => (temas[i.tipo + '/' + i.tema] = true))
  const resposta = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true })
  if (resposta.getResponseCode() >= 300) {
    ui.alert('Não foi possível publicar (erro ' + resposta.getResponseCode() + '). Tente de novo em instantes.')
    return
  }
  ui.alert(
    'Publicando! ' + itens.length + ' fotos em ' + Object.keys(temas).length + ' tema(s).\n\n' +
      'Em 1 a 2 minutos o site estará atualizado.',
  )
}

function abrirCatalogo() {
  const url = pastaCatalogo().getUrl()
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif">Pasta do catálogo:<br><a href="' + url + '" target="_blank">' + url + '</a></p>',
  ).setHeight(90)
  SpreadsheetApp.getUi().showModalDialog(html, 'Catálogo Gimimo')
}

function configurarPublicacao() {
  const ui = SpreadsheetApp.getUi()
  const r = ui.prompt(
    'Configurar publicação',
    'Cole o "Deploy Hook" da Vercel (Settings → Git → Deploy Hooks):',
    ui.ButtonSet.OK_CANCEL,
  )
  if (r.getSelectedButton() !== ui.Button.OK) return
  const url = r.getResponseText().trim()
  if (url.indexOf('https://api.vercel.com/') !== 0) {
    ui.alert('Esse endereço não parece um Deploy Hook da Vercel (começa com https://api.vercel.com/).')
    return
  }
  PropertiesService.getScriptProperties().setProperty('VERCEL_DEPLOY_HOOK', url)
  ui.alert('Pronto! Agora é só usar Gimimo → Publicar site.')
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

  pastaPrincipal() // pasta das imagens dos pedidos

  // pasta do catálogo com uma subpasta por tipo de produto
  const catalogo = pastaCatalogo()
  Object.keys(TIPOS_CATALOGO).forEach((nome) => {
    if (!catalogo.getFoldersByName(nome).hasNext()) catalogo.createFolder(nome)
  })

  onOpen() // mostra o menu Gimimo
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
