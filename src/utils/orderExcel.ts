import ExcelJS from 'exceljs'
import type { CartItem } from '@/stores/useCartStore'

async function toCircularPngBase64(url: string, size = 160): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(pngBlob => {
      if (!pngBlob) return reject(new Error('Falha ao gerar imagem'))
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(pngBlob)
    }, 'image/png')
  })
}

export async function buildOrderWorkbook(items: CartItem[], customerName: string) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Pedido')

  sheet.columns = [
    { width: 4 },
    { width: 16 },
    { width: 34 },
    { width: 14 },
  ]

  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `Pedido Gimimo — ${customerName || 'cliente'}`
  titleCell.font = { name: 'Calibri', size: 14, bold: true }

  sheet.mergeCells('A2:D2')
  const dateCell = sheet.getCell('A2')
  dateCell.value = `Data: ${new Date().toLocaleString('pt-BR')}`
  dateCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF808080' } }

  const headerRowIndex = 4
  const headerRow = sheet.getRow(headerRowIndex)
  headerRow.getCell(2).value = 'IMAGEM'
  headerRow.getCell(3).value = 'TEMA'
  headerRow.getCell(4).value = 'Qtd por unidades'
  headerRow.eachCell(cell => {
    cell.font = { bold: true }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const firstItemRow = headerRowIndex + 1

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowIndex = firstItemRow + i
    const row = sheet.getRow(rowIndex)
    row.height = 60
    row.getCell(3).value = item.name
    row.getCell(4).value = item.qty
    row.getCell(3).alignment = { vertical: 'middle' }
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }

    if (!item.image) {
      row.getCell(2).value = item.custom ? 'personalizado' : 'sem imagem'
      continue
    }

    try {
      const base64 = await toCircularPngBase64(item.image)
      const imageId = workbook.addImage({ base64, extension: 'png' })
      sheet.addImage(imageId, {
        tl: { col: 1.15, row: rowIndex - 1 + 0.1 },
        ext: { width: 58, height: 58 },
      })
    } catch {
      row.getCell(2).value = 'sem imagem'
    }
  }

  const totalRowIndex = firstItemRow + items.length
  const totalRow = sheet.getRow(totalRowIndex)
  totalRow.getCell(2).value = 'TOTAL'
  totalRow.getCell(2).font = { bold: true }
  totalRow.getCell(4).value = { formula: `SUM(D${firstItemRow}:D${totalRowIndex - 1})` }
  totalRow.getCell(4).font = { bold: true }
  totalRow.getCell(4).alignment = { horizontal: 'center' }

  return workbook
}

export async function buildOrderExcelBlob(items: CartItem[], customerName: string) {
  const workbook = await buildOrderWorkbook(items, customerName)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeName = (customerName || 'cliente').trim().replace(/[^a-zA-Z0-9À-ÿ -]/g, '')
  const filename = `pedido-gimimo-${safeName || 'cliente'}.xlsx`
  return { blob, filename }
}

export async function downloadOrderExcel(items: CartItem[], customerName: string) {
  const { blob, filename } = await buildOrderExcelBlob(items, customerName)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
