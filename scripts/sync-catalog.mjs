// Sincroniza o catálogo do Google Drive antes do build (roda na Vercel a cada
// publicação). Busca a lista de fotos no Apps Script da planilha, baixa as
// fotos, converte para WebP 400×400 em public/catalogo/ e gera
// src/lib/catalog.generated.json, que o site usa no lugar do catálogo fixo.
//
// Sem endpoint configurado, não faz nada (o site usa o catálogo fixo do código).
// Com endpoint configurado e erro na busca, o build FALHA de propósito: assim a
// Vercel mantém no ar a versão anterior do site em vez de publicar sem fotos.

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONFIG = path.join(ROOT, 'src/lib/config.json')
const OUT_JSON = path.join(ROOT, 'src/lib/catalog.generated.json')
const OUT_DIR = path.join(ROOT, 'public/catalogo')
const LOTE = 4 // fotos por requisição ao Apps Script
const PARALELO = 3 // requisições ao mesmo tempo

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item'

async function getJson(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url.split('?')[0]}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'resposta inválida do Apps Script')
  return data
}

async function main() {
  const { planilhaEndpoint } = JSON.parse(await fs.readFile(CONFIG, 'utf8'))
  if (!planilhaEndpoint) {
    console.log('[catálogo] sem planilhaEndpoint em src/lib/config.json — usando o catálogo fixo do código')
    await fs.rm(OUT_JSON, { force: true })
    return
  }

  console.log('[catálogo] buscando lista de fotos no Google Drive…')
  const { itens } = await getJson(`${planilhaEndpoint}?acao=catalogo`)

  // ordem natural: "São Paulo 2" antes de "São Paulo 10"
  const cmp = (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })
  itens.sort((a, b) => cmp(a.tipo, b.tipo) || cmp(a.tema, b.tema) || cmp(a.nome, b.nome))

  // id estável por tipo + tema + nome (o carrinho salvo usa esse id)
  const usados = new Set()
  const produtos = itens.map((i) => {
    const base = `${i.tipo}-${slug(i.tema)}-`
    let nomeSlug = slug(i.nome)
    for (let n = 2; usados.has(base + nomeSlug); n++) nomeSlug = `${slug(i.nome)}-${n}`
    const id = base + nomeSlug
    usados.add(id)
    const arquivo = `${i.tipo}/${slug(i.tema)}/${nomeSlug}.webp`
    return { driveId: i.id, id, name: i.nome, type: i.tipo, theme: slug(i.tema), themeName: i.tema, arquivo }
  })

  await fs.rm(OUT_DIR, { recursive: true, force: true })
  const lotes = []
  for (let k = 0; k < produtos.length; k += LOTE) lotes.push(produtos.slice(k, k + LOTE))

  const falhas = []
  let feitos = 0
  const processar = async (lote) => {
    const { imagens } = await getJson(`${planilhaEndpoint}?acao=imagens&ids=${lote.map((p) => p.driveId).join(',')}`)
    for (const p of lote) {
      const img = imagens.find((x) => x.id === p.driveId)
      try {
        if (!img) throw new Error('não entregue pelo Apps Script')
        const destino = path.join(OUT_DIR, p.arquivo)
        await fs.mkdir(path.dirname(destino), { recursive: true })
        await sharp(Buffer.from(img.conteudo, 'base64'))
          .rotate() // respeita a orientação de fotos de celular
          .resize(400, 400, { fit: 'cover' })
          .webp({ quality: 82 })
          .toFile(destino)
        p.ok = true
      } catch (err) {
        falhas.push(`${p.themeName}/${p.name}: ${err.message}`)
      }
      feitos++
    }
    console.log(`[catálogo] ${feitos}/${produtos.length} fotos`)
  }
  for (let k = 0; k < lotes.length; k += PARALELO) {
    await Promise.all(lotes.slice(k, k + PARALELO).map(processar))
  }

  if (falhas.length) {
    // formato não suportado (ex: HEIC do iPhone) não derruba a publicação:
    // a foto fica de fora e aparece no log da Vercel
    console.warn(`[catálogo] ${falhas.length} foto(s) ignorada(s):\n  ` + falhas.join('\n  '))
  }

  const saida = produtos
    .filter((p) => p.ok)
    .map(({ id, name, type, theme, themeName, arquivo }) => ({
      id,
      name,
      type,
      theme,
      themeName,
      image: `/catalogo/${arquivo}`,
    }))
  await fs.writeFile(OUT_JSON, JSON.stringify(saida, null, 1))
  const temas = new Set(saida.map((p) => `${p.type}/${p.theme}`))
  console.log(`[catálogo] pronto: ${saida.length} produtos em ${temas.size} tema(s)`)
}

main().catch((err) => {
  console.error('[catálogo] ERRO:', err.message)
  console.error('[catálogo] A publicação foi cancelada; o site anterior continua no ar.')
  process.exit(1)
})
