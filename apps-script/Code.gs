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

// Cada pedido vira um arquivo novo (ex: "24.10 Bottons farol"), copiado da aba
// modelo desta planilha, com a coluna Qtd preenchida. Mantenha a aba modelo
// com a coluna Qtd vazia. Os arquivos ficam em PASTA_PEDIDOS / ano-mês.
const ABA_MODELO = 'Planilha1'
const PASTA_PEDIDOS = 'Gimimo — pedidos'

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
  'Arquivo do pedido',
  'Status',
  'Observações',
]
const LARGURAS = [130, 150, 160, 200, 130, 260, 70, 180, 90, 110, 50, 150, 160, 130, 220]

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

      // arquivo do pedido a partir do modelo; se falhar, o pedido não se perde
      let arquivo = ''
      try {
        arquivo = criarArquivoPedido(id, pedido, linkImagens, agora)
      } catch (err) {
        console.error(err)
        arquivo = 'ERRO ao criar arquivo: ' + (err && err.message ? err.message : err)
      }

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
        arquivo,
        STATUS[0],
        texto(pedido.observacoes),
      ])

      const inicio = sheet.getLastRow() + 1
      sheet.getRange(inicio, 1, linhas.length, COLUNAS.length).setValues(linhas)
      sheet.setRowHeights(inicio, linhas.length, 48)

      if (AVISAR_POR_EMAIL) avisar(id, pedido, linkImagens, arquivo)
      return json({ ok: true, pedido: id })
    } finally {
      lock.releaseLock()
    }
  } catch (err) {
    console.error(err)
    return json({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

// ===== ARQUIVO DO PEDIDO (cópia do modelo) =====

// Cria "dd.MM <nome desta planilha>" na pasta do mês, com a aba modelo
// copiada e preenchida. Devolve o link do arquivo.
function criarArquivoPedido(id, pedido, linkImagens, agora) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const modelo = ss.getSheetByName(ABA_MODELO) || ss.getSheets().filter((s) => s.getName() !== ABA)[0]
  if (!modelo) throw new Error('Aba modelo "' + ABA_MODELO + '" não encontrada')

  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo'
  const pasta = subpasta(pastaPorNome(PASTA_PEDIDOS), Utilities.formatDate(agora, tz, 'yyyy-MM'))
  const nome = nomeLivre(pasta, Utilities.formatDate(agora, tz, 'dd.MM') + ' ' + ss.getName())

  // copia só a aba (copiar o arquivo inteiro levaria junto o script e o menu)
  const novo = SpreadsheetApp.create(nome)
  const aba = modelo.copyTo(novo).setName('Pedido')
  novo.getSheets().forEach((s) => {
    if (s.getSheetId() !== aba.getSheetId()) novo.deleteSheet(s)
  })

  preencherModelo(aba, pedido, linkImagens)
  blocoCliente(aba, id, pedido, linkImagens, agora, tz)
  SpreadsheetApp.flush()
  DriveApp.getFileById(novo.getId()).moveTo(pasta)
  return novo.getUrl()
}

// Preenche a coluna Qtd do modelo. Linha 1 = cabeçalho com "TEMA" e "Qtd";
// a linha com "TOTAL" marca o fim. Itens que não estão no modelo
// (personalizado, outros temas) entram nas linhas vazias antes do TOTAL.
function preencherModelo(aba, pedido, linkImagens) {
  const dados = aba.getDataRange().getValues()
  const cab = dados[0].map(normalizar)
  const colNome = cab.findIndex((c) => c.indexOf('TEMA') !== -1 || c.indexOf('PRODUTO') !== -1)
  const colQtd = cab.findIndex((c) => c.indexOf('QTD') !== -1 || c.indexOf('QUANT') !== -1)
  const colImg = cab.findIndex((c) => c.indexOf('IMAGE') !== -1 || c.indexOf('FOTO') !== -1)
  if (colNome < 0 || colQtd < 0) throw new Error('O modelo precisa das colunas "TEMA" e "Qtd" na linha 1')

  let fim = dados.findIndex((r, i) => i > 0 && r.some((v) => normalizar(v) === 'TOTAL'))
  if (fim < 0) fim = dados.length // índice (0) da linha TOTAL

  // linha de cada modelo pelo nome ("São Paulo 1" = "SÃO PAULO 01")
  const linhaDe = {}
  for (let i = 1; i < fim; i++) {
    const n = normalizar(dados[i][colNome])
    if (n && linhaDe[n] === undefined) linhaDe[n] = i
  }

  const qtd = []
  for (let i = 1; i < fim; i++) qtd.push([''])
  const extras = []
  pedido.itens.forEach((item) => {
    const i = linhaDe[normalizar(item.nome)]
    const n = Number(item.qtd) || 0
    if (i === undefined) extras.push(item)
    else qtd[i - 1][0] = (Number(qtd[i - 1][0]) || 0) + n
  })
  if (qtd.length) aba.getRange(2, colQtd + 1, qtd.length, 1).setValues(qtd)

  if (extras.length) {
    // linhas vazias depois do último modelo
    let ultimo = 0
    for (let i = 1; i < fim; i++) if (normalizar(dados[i][colNome])) ultimo = i
    const livres = []
    for (let i = ultimo + 1; i < fim; i++) if (!normalizar(dados[i][colNome])) livres.push(i + 1)

    // faltou linha: cria antes da última linha vazia (ou do TOTAL)
    const faltam = extras.length - livres.length
    if (faltam > 0) {
      const antes = livres.length ? livres[livres.length - 1] : fim + 1
      aba.insertRowsBefore(antes, faltam)
      for (let k = 0; k < faltam; k++) livres.push(livres.length ? livres[livres.length - 1] + 1 : antes + k)
      livres.sort((a, b) => a - b)
    }

    const altura = aba.getRowHeight(2)
    extras.forEach((item, k) => {
      const r = livres[k]
      const nome = item.tema && !item.personalizado ? item.nome + ' (' + item.tema + ')' : item.nome
      aba.getRange(r, colNome + 1).setValue(texto(nome.toUpperCase()))
      aba.getRange(r, colQtd + 1).setValue(Number(item.qtd) || 0)
      if (colImg >= 0) {
        const celula = aba.getRange(r, colImg + 1)
        if (item.personalizado && linkImagens) celula.setFormula('=HYPERLINK("' + linkImagens + '","ver imagens do cliente")')
        else if (item.personalizado) celula.setValue('imagens: pedir ao cliente')
        else if (formulaImagem(item.imagem)) celula.setFormula(formulaImagem(item.imagem))
      }
      aba.setRowHeight(r, altura)
    })
  }

  // TOTAL soma tudo, inclusive linhas novas
  const total = aba.createTextFinder('TOTAL').matchEntireCell(true).findNext()
  if (total) {
    const linhaTotal = total.getRow()
    const letra = aba.getRange(1, colQtd + 1).getA1Notation().replace(/\d+/g, '')
    aba.getRange(linhaTotal, colQtd + 1).setFormula('=SUM(' + letra + '2:' + letra + (linhaTotal - 1) + ')')
  }
}

// Dados do cliente ao lado da tabela
function blocoCliente(aba, id, pedido, linkImagens, agora, tz) {
  const col = aba.getLastColumn() + 2
  const linhas = [
    ['Pedido', id],
    ['Data', Utilities.formatDate(agora, tz, 'dd/MM/yyyy HH:mm')],
    ['Cliente', texto(pedido.nome)],
    ['E-mail', texto(pedido.email)],
    ['Telefone', texto(pedido.telefone)],
    ['Entrega', texto(pedido.entrega)],
    ['Imagens do cliente', linkImagens || '—'],
  ]
  aba.getRange(1, col, linhas.length, 2).setValues(linhas).setVerticalAlignment('middle')
  aba.getRange(1, col, linhas.length, 1).setFontWeight('bold')
  aba.getRange(1, col + 1, linhas.length, 1).setWrap(true)
  aba.setColumnWidth(col, 130)
  aba.setColumnWidth(col + 1, 300)
}

function normalizar(v) {
  return String(v == null ? '' : v)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\b0+(\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pasta onde está esta planilha (ex: "site gimimo"): as pastas do site ficam
// todas dentro dela.
function pastaBase() {
  const pais = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getParents()
  return pais.hasNext() ? pais.next() : DriveApp.getRootFolder()
}

// Acha (ou cria) a pasta dentro da pasta base. Se ela tiver sido criada antes
// em outro lugar do Drive, é movida para cá com tudo o que tem dentro.
function pastaPorNome(nome) {
  const base = pastaBase()
  const aqui = base.getFoldersByName(nome)
  while (aqui.hasNext()) {
    const f = aqui.next()
    if (!f.isTrashed()) return f
  }
  const outras = DriveApp.getFoldersByName(nome)
  while (outras.hasNext()) {
    const f = outras.next()
    if (!f.isTrashed()) {
      f.moveTo(base)
      return f
    }
  }
  return base.createFolder(nome)
}

function subpasta(pai, nome) {
  const pastas = pai.getFoldersByName(nome)
  return pastas.hasNext() ? pastas.next() : pai.createFolder(nome)
}

// "24.10 Bottons farol", ou "(2)", "(3)"… se já existir no mesmo dia
function nomeLivre(pasta, base) {
  if (!pasta.getFilesByName(base).hasNext()) return base
  for (let n = 2; ; n++) {
    const nome = base + ' (' + n + ')'
    if (!pasta.getFilesByName(nome).hasNext()) return nome
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
  return pastaPorNome(PASTA_CATALOGO)
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
  cabecalho(obterAba())
  pastaPrincipal() // pasta das imagens dos pedidos
  pastaPorNome(PASTA_PEDIDOS) // pasta dos arquivos de cada pedido

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

// aba "Pedidos" (índice de todos os pedidos); recriada com cabeçalho se apagada
function obterAba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(ABA) || ss.insertSheet(ABA)
  if (sheet.getLastRow() === 0) cabecalho(sheet)
  return sheet
}

function cabecalho(sheet) {
  sheet.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]).setFontWeight('bold').setBackground('#F7F4EF')
  sheet.setFrozenRows(1)
  LARGURAS.forEach((w, i) => sheet.setColumnWidth(i + 1, w))

  const col = (nome) => COLUNAS.indexOf(nome) + 1
  sheet.getRange(2, col('Data'), sheet.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm')

  // lista de status para escolher em cada linha
  const regra = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build()
  sheet.getRange(2, col('Status'), sheet.getMaxRows() - 1, 1).setDataValidation(regra)
}

function gerarId() {
  const tz = Session.getScriptTimeZone() || 'America/Sao_Paulo'
  const data = Utilities.formatDate(new Date(), tz, 'yyMMdd-HHmm')
  const sufixo = Math.random().toString(36).slice(2, 5).toUpperCase()
  return 'GM-' + data + '-' + sufixo
}

function pastaPrincipal() {
  return pastaPorNome(PASTA_DRIVE)
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

function avisar(id, pedido, linkImagens, arquivo) {
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
    arquivo ? 'Arquivo do pedido: ' + arquivo : null,
    'Índice de pedidos: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
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
